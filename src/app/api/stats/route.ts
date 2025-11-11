import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/services/member-service';

// GET /api/stats - Retorna estatísticas gerais
export async function GET(request: NextRequest) {
  try {
    const stats = await getStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar estatísticas',
      },
      { status: 500 }
    );
  }
}
