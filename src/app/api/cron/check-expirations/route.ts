import { NextRequest, NextResponse } from 'next/server';
import { sendAllScheduledNotifications } from '@/services/notification-service';
import { trackCronExecution } from '@/lib/cron-tracker';

/**
 * Endpoint de cron job para verificar e enviar notificações de vencimento
 * Deve ser chamado diariamente (configurar em cron-job.org, Vercel Cron, etc.)
 *
 * Exemplo Vercel Cron (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-expirations",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se a requisição tem a chave de autorização correta
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Iniciando verificação de vencimentos...');

    // Executar verificação e envio de notificações
    const results = await sendAllScheduledNotifications();

    console.log('[Cron] Verificação concluída:', results);

    // Registrar execução na tabela cron_jobs
    await trackCronExecution('/api/cron/check-expirations', true);

    return NextResponse.json({
      success: true,
      message: 'Verificação de vencimentos concluída',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Erro ao verificar vencimentos:', error);

    // Registrar execução com erro
    await trackCronExecution('/api/cron/check-expirations', false);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao verificar vencimentos',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Permitir POST também (alguns serviços de cron só suportam POST)
export async function POST(request: NextRequest) {
  return GET(request);
}
