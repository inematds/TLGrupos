import { NextRequest, NextResponse } from 'next/server';
import { removeExpiredMembers } from '@/services/cron-service';
import { trackCronExecution } from '@/lib/cron-tracker';

// POST /api/cron/remove-expired - Remove membros vencidos
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

    const result = await removeExpiredMembers();

    // Registrar execução na tabela cron_jobs
    await trackCronExecution('/api/cron/remove-expired', true);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Erro ao remover membros vencidos:', error);

    // Registrar execução com erro
    await trackCronExecution('/api/cron/remove-expired', false);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao remover membros vencidos',
      },
      { status: 500 }
    );
  }
}

// Permitir GET também (para testes)
export async function GET(request: NextRequest) {
  return POST(request);
}
