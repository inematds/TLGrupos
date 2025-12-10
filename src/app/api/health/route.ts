import { NextResponse } from 'next/server';
import { serviceSupabase as supabase } from '@/lib/supabase';

// GET /api/health - Verificação completa de saúde do sistema
export async function GET() {
  try {
    const checks: any = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      checks: []
    };

    // 1. Verificar notificações recentes (últimas 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: notifications, error: notifError } = await supabase
      .from('notification_history')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!notifError && notifications) {
      const emailSuccess = notifications.filter(n => n.channel === 'email' && n.status === 'sent').length;
      const emailFailed = notifications.filter(n => n.channel === 'email' && n.status === 'failed').length;
      const telegramSuccess = notifications.filter(n => n.channel === 'telegram' && n.status === 'sent').length;
      const telegramFailed = notifications.filter(n => n.channel === 'telegram' && n.status === 'failed').length;

      checks.checks.push({
        name: 'Notificações (últimas 24h)',
        status: (emailFailed + telegramFailed) > 5 ? 'warning' : 'success',
        details: {
          email: {
            enviados: emailSuccess,
            falhas: emailFailed,
            taxa_sucesso: emailSuccess > 0 ? `${((emailSuccess / (emailSuccess + emailFailed)) * 100).toFixed(1)}%` : 'N/A'
          },
          telegram: {
            enviados: telegramSuccess,
            falhas: telegramFailed,
            taxa_sucesso: telegramSuccess > 0 ? `${((telegramSuccess / (telegramSuccess + telegramFailed)) * 100).toFixed(1)}%` : 'N/A'
          },
          total: notifications.length
        }
      });
    } else {
      checks.checks.push({
        name: 'Notificações',
        status: 'warning',
        message: 'Não foi possível verificar histórico de notificações'
      });
    }

    // 2. Verificar links de convite enviados (últimos pagamentos aprovados)
    const { data: recentPayments, error: payError } = await supabase
      .from('payments')
      .select('id, status, invite_link, data_aprovacao, member:members(nome, email)')
      .eq('status', 'aprovado')
      .not('data_aprovacao', 'is', null)
      .gte('data_aprovacao', oneDayAgo)
      .order('data_aprovacao', { ascending: false })
      .limit(10);

    if (!payError && recentPayments) {
      const comLink = recentPayments.filter(p => p.invite_link).length;
      const semLink = recentPayments.filter(p => !p.invite_link).length;

      checks.checks.push({
        name: 'Links de Convite (últimas 24h)',
        status: semLink > 0 ? 'warning' : 'success',
        details: {
          pagamentos_aprovados: recentPayments.length,
          com_link: comLink,
          sem_link: semLink,
          taxa_sucesso: recentPayments.length > 0 ? `${((comLink / recentPayments.length) * 100).toFixed(1)}%` : 'N/A'
        }
      });
    }

    // 3. Verificar membros vencendo em breve (próximos 7 dias)
    const { data: vencendoBreve } = await supabase
      .from('members')
      .select('id, nome, data_vencimento, notificado_7dias, notificado_3dias, notificado_1dia')
      .eq('status', 'ativo')
      .gte('data_vencimento', new Date().toISOString())
      .lte('data_vencimento', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    if (vencendoBreve) {
      const naoNotificados = vencendoBreve.filter(m => !m.notificado_7dias).length;

      checks.checks.push({
        name: 'Avisos de Vencimento',
        status: naoNotificados > 3 ? 'warning' : 'success',
        details: {
          vencendo_7dias: vencendoBreve.length,
          notificados: vencendoBreve.filter(m => m.notificado_7dias).length,
          pendentes_notificacao: naoNotificados
        }
      });
    }

    // 4. Verificar membros vencidos não removidos
    const { data: vencidosAtivos } = await supabase
      .from('members')
      .select('id, nome, data_vencimento, status, no_grupo')
      .eq('status', 'ativo')
      .lt('data_vencimento', new Date().toISOString());

    if (vencidosAtivos) {
      const noGrupo = vencidosAtivos.filter(m => m.no_grupo).length;

      checks.checks.push({
        name: 'Remoção Automática',
        status: noGrupo > 5 ? 'error' : noGrupo > 0 ? 'warning' : 'success',
        details: {
          membros_vencidos_ativos: vencidosAtivos.length,
          ainda_no_grupo: noGrupo,
          removidos_corretamente: vencidosAtivos.length - noGrupo,
          acao: noGrupo > 0 ? 'Verificar script de auto-remoção' : 'Sistema funcionando'
        }
      });
    }

    // 5. Verificar logs de atividade recente
    const { data: recentLogs } = await supabase
      .from('logs')
      .select('acao, created_at')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(100);

    if (recentLogs) {
      const edicoes = recentLogs.filter(l => l.acao === 'edicao').length;
      const adicoes = recentLogs.filter(l => l.acao === 'adicao').length;
      const exclusoes = recentLogs.filter(l => l.acao === 'exclusao').length;

      checks.checks.push({
        name: 'Atividade do Sistema (24h)',
        status: 'success',
        details: {
          total_operacoes: recentLogs.length,
          adicoes: adicoes,
          edicoes: edicoes,
          exclusoes: exclusoes,
          ultima_atividade: recentLogs[0]?.created_at ? new Date(recentLogs[0].created_at).toLocaleString('pt-BR') : 'N/A'
        }
      });
    }

    // 6. Verificar membros com erro de remoção
    const { data: erroRemocao } = await supabase
      .from('members')
      .select('id, nome, data_vencimento')
      .eq('status', 'erro_remocao');

    if (erroRemocao) {
      checks.checks.push({
        name: 'Erros de Remoção',
        status: erroRemocao.length > 0 ? 'warning' : 'success',
        details: {
          total: erroRemocao.length,
          acao: erroRemocao.length > 0 ? 'Revisar manualmente e tentar remover novamente' : 'Nenhum erro'
        }
      });
    }

    // 7. Verificar integridade dos dados
    const { data: semEmail } = await supabase
      .from('members')
      .select('id')
      .eq('status', 'ativo')
      .or('email.is.null,email.eq.');

    const { data: semTelegramId } = await supabase
      .from('members')
      .select('id')
      .eq('status', 'ativo')
      .is('telegram_user_id', null);

    if (semEmail && semTelegramId) {
      checks.checks.push({
        name: 'Integridade dos Dados',
        status: (semEmail.length + semTelegramId.length) > 10 ? 'warning' : 'success',
        details: {
          ativos_sem_email: semEmail.length,
          ativos_sem_telegram_id: semTelegramId.length,
          observacao: 'Membros sem email ou Telegram ID não receberão notificações'
        }
      });
    }

    // Determinar status geral
    const hasError = checks.checks.some((c: any) => c.status === 'error');
    const hasWarning = checks.checks.some((c: any) => c.status === 'warning');

    if (hasError) {
      checks.overall = 'unhealthy';
    } else if (hasWarning) {
      checks.overall = 'degraded';
    }

    return NextResponse.json(checks);

  } catch (error: any) {
    console.error('[Health Check] Erro:', error);
    return NextResponse.json(
      {
        overall: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
