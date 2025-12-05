import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

const supabase = getServiceSupabase();

// GET /api/cron-stats - Retorna estatísticas de execução dos CRONs
export async function GET() {
  try {
    // Buscar logs dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logs, error } = await supabase
      .from('logs')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .in('acao', ['notificacao', 'remocao', 'edicao'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Processar logs para estatísticas por dia e por tipo
    const statsByDay: { [key: string]: any } = {};

    logs?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0]; // YYYY-MM-DD

      if (!statsByDay[date]) {
        statsByDay[date] = {
          date,
          notifications: 0,
          removals: 0,
          payments: 0,
          total: 0,
        };
      }

      if (log.acao === 'notificacao') {
        statsByDay[date].notifications++;
        statsByDay[date].total++;
      } else if (log.acao === 'remocao') {
        statsByDay[date].removals++;
        statsByDay[date].total++;
      } else if (log.acao === 'edicao' && log.detalhes?.tipo === 'aprovacao_pagamento') {
        statsByDay[date].payments++;
        statsByDay[date].total++;
      }
    });

    // Converter para array e preencher dias sem dados
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      last7Days.push(
        statsByDay[dateStr] || {
          date: dateStr,
          notifications: 0,
          removals: 0,
          payments: 0,
          total: 0,
        }
      );
    }

    // Buscar totais gerais
    const { data: allLogs, error: allLogsError } = await supabase
      .from('logs')
      .select('acao, detalhes')
      .in('acao', ['notificacao', 'remocao', 'edicao']);

    if (allLogsError) throw allLogsError;

    const totals = {
      notifications: allLogs?.filter((l) => l.acao === 'notificacao').length || 0,
      removals: allLogs?.filter((l) => l.acao === 'remocao').length || 0,
      payments:
        allLogs?.filter((l) => l.acao === 'edicao' && l.detalhes?.tipo === 'aprovacao_pagamento')
          .length || 0,
    };

    // Buscar última execução de cada CRON
    const { data: lastExecution, error: lastExecError } = await supabase
      .from('logs')
      .select('acao, created_at, detalhes')
      .in('acao', ['notificacao', 'remocao', 'edicao'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (lastExecError) throw lastExecError;

    // Encontrar última execução de cada tipo
    const lastNotification = lastExecution?.find((l) => l.acao === 'notificacao');
    const lastRemoval = lastExecution?.find((l) => l.acao === 'remocao');
    const lastPayment = lastExecution?.find(
      (l) => l.acao === 'edicao' && l.detalhes?.tipo === 'aprovacao_pagamento'
    );

    return NextResponse.json({
      success: true,
      data: {
        last7Days,
        totals,
        lastExecution: {
          notifications: lastNotification?.created_at || null,
          removals: lastRemoval?.created_at || null,
          payments: lastPayment?.created_at || null,
        },
      },
    });
  } catch (error: any) {
    console.error('[API Cron Stats] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
