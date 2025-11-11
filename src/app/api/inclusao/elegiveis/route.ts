import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/inclusao/elegiveis - Busca membros elegíveis para inclusão
export async function GET() {
  try {
    const supabase = getServiceSupabase();

    // Buscar membros ativos que:
    // - Status = ativo
    // - Têm telegram_user_id (estão cadastrados no Telegram)
    // - NÃO estão no grupo (no_grupo = false ou null)
    // - Data de vencimento não expirada
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'ativo')
      .not('telegram_user_id', 'is', null)
      .gte('data_vencimento', new Date().toISOString())
      .or('no_grupo.is.null,no_grupo.eq.false')
      .order('data_entrada', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar membros: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Erro ao buscar membros elegíveis:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar membros elegíveis',
      },
      { status: 500 }
    );
  }
}
