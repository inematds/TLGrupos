import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/convites - Lista todos os convites com dados do membro
export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('invites')
      .select(`
        *,
        member:members (
          id,
          nome,
          email,
          telegram_username,
          telegram_user_id,
          status,
          data_vencimento
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Erro ao buscar convites: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Erro ao buscar convites:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar convites',
      },
      { status: 500 }
    );
  }
}
