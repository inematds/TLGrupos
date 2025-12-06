import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createInviteLink, createGenericInviteLink } from '@/lib/telegram';
import { sendPaymentApprovedNotification } from '@/services/notification-service';
import { trackCronExecution } from '@/lib/cron-tracker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/cron/process-approved-payments
 *
 * Processa pagamentos que foram aprovados mas não conseguiram gerar link de convite.
 * Este endpoint deve ser chamado periodicamente (ex: a cada 15 minutos) para:
 *
 * 1. Buscar pagamentos aprovados sem invite_link
 * 2. Tentar gerar o link de convite do Telegram
 * 3. Salvar o link no pagamento
 * 4. Enviar notificações (email + telegram) com o link
 * 5. Registrar logs de sucesso/falha
 *
 * Protegido com CRON_SECRET em produção.
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Permitir sem auth apenas em desenvolvimento
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Não autorizado' },
          { status: 401 }
        );
      }
    }

    console.log('[Cron] Iniciando processamento de pagamentos aprovados sem link...');

    const results = {
      total: 0,
      processados: 0,
      erros: 0,
      detalhes: [] as any[],
    };

    // Buscar pagamentos aprovados sem link de convite
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
      .is('invite_link', null)
      .order('created_at', { ascending: true }) // Processar os mais antigos primeiro
      .limit(50); // Limitar para não sobrecarregar

    if (paymentsError) {
      throw new Error(`Erro ao buscar pagamentos: ${paymentsError.message}`);
    }

    if (!payments || payments.length === 0) {
      console.log('[Cron] Nenhum pagamento pendente encontrado.');
      return NextResponse.json({
        success: true,
        message: 'Nenhum pagamento aprovado sem link encontrado',
        results,
      });
    }

    results.total = payments.length;
    console.log(`[Cron] Encontrados ${payments.length} pagamentos para processar`);

    // Processar cada pagamento
    for (const payment of payments) {
      const member = payment.member as any;

      if (!member) {
        console.error(`[Cron] Membro não encontrado para pagamento ${payment.id}`);
        results.erros++;
        results.detalhes.push({
          payment_id: payment.id,
          status: 'erro',
          erro: 'Membro não encontrado',
        });
        continue;
      }

      try {
        console.log(`[Cron] Processando pagamento ${payment.id} - Membro: ${member.nome}`);

        let inviteLink = '';

        // Tentar gerar link único se tiver telegram_user_id
        if (member.telegram_user_id) {
          console.log(`[Cron] Tentando gerar link único para user_id: ${member.telegram_user_id}`);

          const linkResult = await createInviteLink(parseInt(member.telegram_user_id));

          if (linkResult.success && linkResult.link) {
            inviteLink = linkResult.link;
            console.log(`[Cron] ✓ Link único gerado`);
          } else {
            console.warn(`[Cron] Falha ao gerar link único: ${linkResult.error}`);

            // Fallback para link genérico
            const genericResult = await createGenericInviteLink();
            if (genericResult.success && genericResult.link) {
              inviteLink = genericResult.link;
              console.log(`[Cron] ✓ Link genérico gerado (fallback)`);
            } else {
              console.error(`[Cron] Falha ao gerar link genérico: ${genericResult.error}`);
            }
          }
        } else {
          // Sem telegram_user_id, tentar link genérico
          console.log(`[Cron] Membro sem telegram_user_id, gerando link genérico`);

          const genericResult = await createGenericInviteLink();
          if (genericResult.success && genericResult.link) {
            inviteLink = genericResult.link;
            console.log(`[Cron] ✓ Link genérico gerado`);
          } else {
            console.error(`[Cron] Falha ao gerar link genérico: ${genericResult.error}`);
          }
        }

        // Se conseguiu gerar o link
        if (inviteLink) {
          // Salvar link no pagamento
          const { error: updateError } = await supabase
            .from('payments')
            .update({
              invite_link: inviteLink,
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          if (updateError) {
            throw new Error(`Erro ao salvar link: ${updateError.message}`);
          }

          console.log(`[Cron] ✓ Link salvo no pagamento`);

          // Enviar notificações (email + telegram)
          try {
            const plan = payment.plan as any;
            const planoDias = plan?.duracao_dias || payment.dias_acesso || 30;

            console.log(`[Cron] Enviando notificações para ${member.email}...`);

            const notificationResult = await sendPaymentApprovedNotification(
              member.id,
              inviteLink,
              planoDias,
              payment.id
            );

            console.log(`[Cron] Notificações enviadas:`, {
              email: notificationResult.email ? '✓' : '✗',
              telegram: notificationResult.telegram ? '✓' : '✗',
            });

            // Registrar log de sucesso
            await supabase.from('logs').insert({
              member_id: member.id,
              acao: 'link_gerado_retroativo',
              detalhes: {
                payment_id: payment.id,
                invite_link: inviteLink,
                email_enviado: notificationResult.email,
                telegram_enviado: notificationResult.telegram,
                notification_id: notificationResult.notificationId,
                processado_por_cron: true,
              },
              telegram_user_id: member.telegram_user_id,
              telegram_username: member.telegram_username,
              executado_por: 'Sistema (Cron)',
            });

            results.processados++;
            results.detalhes.push({
              payment_id: payment.id,
              member_id: member.id,
              nome: member.nome,
              email: member.email,
              status: 'processado',
              link_gerado: true,
              email_enviado: notificationResult.email,
              telegram_enviado: notificationResult.telegram,
            });

            console.log(`[Cron] ✓ Pagamento ${payment.id} processado com sucesso`);

          } catch (notifError: any) {
            console.error(`[Cron] Erro ao enviar notificações:`, notifError);

            // Link foi salvo mas notificação falhou
            results.processados++; // Conta como processado pois o link foi gerado
            results.detalhes.push({
              payment_id: payment.id,
              member_id: member.id,
              nome: member.nome,
              status: 'link_gerado_notificacao_falhou',
              link_gerado: true,
              erro_notificacao: notifError.message,
            });
          }

        } else {
          // Não conseguiu gerar link
          throw new Error('Não foi possível gerar link de convite');
        }

      } catch (error: any) {
        console.error(`[Cron] Erro ao processar pagamento ${payment.id}:`, error);

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
          acao: 'erro_gerar_link_retroativo',
          detalhes: {
            payment_id: payment.id,
            erro: error.message,
            processado_por_cron: true,
          },
          telegram_user_id: member.telegram_user_id,
          telegram_username: member.telegram_username,
          executado_por: 'Sistema (Cron)',
        });
      }
    }

    const message = `Processados: ${results.processados}/${results.total}, Erros: ${results.erros}`;
    console.log(`[Cron] Finalizado. ${message}`);

    // Registrar execução na tabela cron_jobs
    await trackCronExecution('/api/cron/process-approved-payments', true);

    return NextResponse.json({
      success: true,
      message,
      results,
    });

  } catch (error: any) {
    console.error('[Cron] Erro geral ao processar pagamentos:', error);

    // Registrar execução com erro
    await trackCronExecution('/api/cron/process-approved-payments', false);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao processar pagamentos aprovados',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-approved-payments
 *
 * Retorna estatísticas de pagamentos aprovados sem link (para monitoramento)
 */
export async function GET() {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('id, created_at, member:members(nome, email)', { count: 'exact' })
      .eq('status', 'aprovado')
      .is('invite_link', null);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      total: payments?.length || 0,
      payments: payments || [],
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
