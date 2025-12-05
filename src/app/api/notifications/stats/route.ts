import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

const supabase = getServiceSupabase();

/**
 * GET /api/notifications/stats
 * Retorna estatísticas completas de notificações
 */
export async function GET() {
  try {
    // 1. Estatísticas gerais dos últimos 30 dias
    const { data: generalStats, error: generalError } = await supabase
      .from('notification_history')
      .select('notification_type, email_sent, telegram_sent, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (generalError) throw generalError;

    // 2. Taxa de sucesso por tipo
    const { data: successRates, error: successError } = await supabase
      .from('notification_success_rate')
      .select('*')
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (successError) throw successError;

    // 3. Notificações pendentes
    const { data: pending, error: pendingError } = await supabase
      .from('pending_notifications')
      .select('*')
      .limit(50);

    if (pendingError) throw pendingError;

    // 4. Notificações falhadas
    const { data: failed, error: failedError } = await supabase
      .from('failed_notifications')
      .select('*')
      .limit(50);

    if (failedError) throw failedError;

    // 5. Calcular estatísticas
    const total = generalStats?.length || 0;
    const emailsSent = generalStats?.filter((n) => n.email_sent).length || 0;
    const telegramsSent = generalStats?.filter((n) => n.telegram_sent).length || 0;

    // Agrupar por tipo
    const byType: Record<string, { total: number; email: number; telegram: number }> = {};
    generalStats?.forEach((notif) => {
      const type = notif.notification_type;
      if (!byType[type]) {
        byType[type] = { total: 0, email: 0, telegram: 0 };
      }
      byType[type].total++;
      if (notif.email_sent) byType[type].email++;
      if (notif.telegram_sent) byType[type].telegram++;
    });

    // Estatísticas diárias (últimos 7 dias)
    const dailyStats: Record<string, { total: number; email: number; telegram: number }> = {};
    generalStats?.forEach((notif) => {
      const date = new Date(notif.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, email: 0, telegram: 0 };
      }
      dailyStats[date].total++;
      if (notif.email_sent) dailyStats[date].email++;
      if (notif.telegram_sent) dailyStats[date].telegram++;
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total,
          emailsSent,
          telegramsSent,
          emailSuccessRate: total > 0 ? Math.round((emailsSent / total) * 100) : 0,
          telegramSuccessRate: total > 0 ? Math.round((telegramsSent / total) * 100) : 0,
          pending: pending?.length || 0,
          failed: failed?.length || 0,
        },
        byType,
        dailyStats,
        successRates: successRates || [],
        pending: pending || [],
        failed: failed || [],
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas de notificações:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar estatísticas',
      },
      { status: 500 }
    );
  }
}
