import { NextRequest, NextResponse } from 'next/server';
import { removeExpiredMembers } from '@/services/cron-service';

// POST /api/admin/remove-expired - Remove membros vencidos (rota administrativa)
// Esta rota pode ser chamada pelo dashboard sem necessidade de CRON_SECRET
export async function POST(request: NextRequest) {
  try {
    const result = await removeExpiredMembers();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Erro ao remover membros vencidos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao remover membros vencidos',
      },
      { status: 500 }
    );
  }
}
