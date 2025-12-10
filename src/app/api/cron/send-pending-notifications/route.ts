import { NextRequest, NextResponse } from 'next/server';
import { serviceSupabase as supabase } from '@/lib/supabase';
import { sendPaymentApprovedNotification } from '@/services/notification-service';
import { trackCronExecution } from '@/lib/cron-tracker';

/**
 * POST /api/cron/send-pending-notifications
 *
 * Envia notificações pendentes para pagamentos aprovados que:
 * - Têm link de convite gerado
 * - MAS ainda não tiveram email/telegram enviado
 *
 * Este endpoint complementa o process-approved-payments, garantindo que
 * todos os pagamentos aprovados recebam suas notificações.
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Não autorizado' },
          { status: 401 }
        );
      }
    }

    console.log('[Cron Send Notifications] Iniciando envio de notificações pendentes...');

    const results = {
      total: 0,
      enviados: 0,
      erros: 0,
      detalhes: [] as any[],
    };

    // Buscar pagamentos aprovados com link, mas sem notificação enviada
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        *,
        member:members(
          id,
          nome,
          email,
          telegram_username,
          telegram_user_id,
          data_vencimento
        )
      `)
      .eq('status', 'aprovado')
      .not('invite_link', 'is', null) // Tem link
      .or('email_sent.is.null,email_sent.eq.false,notification_sent.is.null,notification_sent.eq.false') // Sem notificação
      .order('created_at', { ascending: true })
      .limit(50);

    if (paymentsError) {
      throw new Error(`Erro ao buscar pagamentos: ${paymentsError.message}`);
    }

    if (!payments || payments.length === 0) {
      console.log('[Cron Send Notifications] Nenhum pagamento pendente de notificação.');
      return NextResponse.json({
        success: true,
        message: 'Nenhum pagamento pendente de notificação',
        results,
      });
    }

    results.total = payments.length;
    console.log(`[Cron Send Notifications] Encontrados ${payments.length} pagamentos para notificar`);

    // Processar cada pagamento
    for (const payment of payments) {
      const member = payment.member as any;

      if (!member) {
        console.error(`[Cron Send Notifications] Membro não encontrado para pagamento ${payment.id}`);
        results.erros++;
        results.detalhes.push({
          payment_id: payment.id,
          status: 'erro',
          erro: 'Membro não encontrado',
        });
        continue;
      }

      if (!payment.invite_link) {
        console.error(`[Cron Send Notifications] Pagamento ${payment.id} sem link de convite`);
        results.erros++;
        results.detalhes.push({
          payment_id: payment.id,
          status: 'erro',
          erro: 'Link de convite não encontrado',
        });
        continue;
      }

      try {
        console.log(`[Cron Send Notifications] Enviando para ${member.nome} (${member.email})`);

        const plan = payment.plan as any;
        const planoDias = plan?.duracao_dias || payment.dias_acesso || 30;

        const notificationResult = await sendPaymentApprovedNotification(
          member.id,
          payment.invite_link,
          planoDias,
          payment.id
        );

        console.log(`[Cron Send Notifications] Resultado:`, {
          email: notificationResult.email ? '✓' : '✗',
          telegram: notificationResult.telegram ? '✓' : '✗',
        });

        // Registrar log
        await supabase.from('logs').insert({
          member_id: member.id,
          acao: 'notificacao_retroativa',
          detalhes: {
            payment_id: payment.id,
            email_enviado: notificationResult.email,
            telegram_enviado: notificationResult.telegram,
            notification_id: notificationResult.notificationId,
            processado_por_cron: true,
          },
          telegram_user_id: member.telegram_user_id,
          telegram_username: member.telegram_username,
          executado_por: 'Sistema (Cron Send Notifications)',
        });

        results.enviados++;
        results.detalhes.push({
          payment_id: payment.id,
          member_id: member.id,
          nome: member.nome,
          email: member.email,
          status: 'enviado',
          email_enviado: notificationResult.email,
          telegram_enviado: notificationResult.telegram,
        });

        console.log(`[Cron Send Notifications] ✓ Notificação enviada para ${member.nome}`);

      } catch (error: any) {
        console.error(`[Cron Send Notifications] Erro ao enviar para ${member.nome}:`, error);

        results.erros++;
        results.detalhes.push({
          payment_id: payment.id,
          member_id: member.id,
          nome: member.nome,
          email: member.email,
          status: 'erro',
          erro: error.message,
        });

        // Registrar log de erro
        await supabase.from('logs').insert({
          member_id: member.id,
          acao: 'erro_notificacao_retroativa',
          detalhes: {
            payment_id: payment.id,
            erro: error.message,
            processado_por_cron: true,
          },
          telegram_user_id: member.telegram_user_id,
          telegram_username: member.telegram_username,
          executado_por: 'Sistema (Cron Send Notifications)',
        });
      }
    }

    const message = `Enviados: ${results.enviados}/${results.total}, Erros: ${results.erros}`;
    console.log(`[Cron Send Notifications] Finalizado. ${message}`);

    // Registrar execução na tabela cron_jobs
    await trackCronExecution('/api/cron/send-pending-notifications', true);

    return NextResponse.json({
      success: true,
      message,
      results,
    });

  } catch (error: any) {
    console.error('[Cron Send Notifications] Erro geral:', error);

    // Registrar execução com erro
    await trackCronExecution('/api/cron/send-pending-notifications', false);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao enviar notificações pendentes',
      },
      { status: 500 }
    );
  }
}
