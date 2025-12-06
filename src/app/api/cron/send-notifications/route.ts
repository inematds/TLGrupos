import { NextRequest, NextResponse } from 'next/server';
import { sendAllScheduledNotifications } from '@/services/notification-service';
import { trackCronExecution } from '@/lib/cron-tracker';

// POST /api/cron/send-notifications - Envia notificações programadas
export async function POST(request: NextRequest) {
  try {
    // Verificar secret do cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não autorizado',
        },
        { status: 401 }
      );
    }

    const result = await sendAllScheduledNotifications();

    // Registrar execução na tabela cron_jobs
    await trackCronExecution('/api/cron/send-notifications', true);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Erro ao enviar notificações:', error);

    // Registrar execução com erro
    await trackCronExecution('/api/cron/send-notifications', false);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao enviar notificações',
      },
      { status: 500 }
    );
  }
}

// Permitir GET também (para testes)
export async function GET(request: NextRequest) {
  return POST(request);
}
