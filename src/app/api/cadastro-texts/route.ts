import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

const supabase = getServiceSupabase();

/**
 * GET /api/cadastro-texts - Busca todos os textos configuráveis do formulário
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('chave, valor')
      .like('chave', 'cadastro_%');

    if (error) {
      throw new Error(error.message);
    }

    // Transformar em objeto para facilitar acesso
    const texts: Record<string, string> = {};
    data?.forEach((config: any) => {
      texts[config.chave] = config.valor || '';
    });

    return NextResponse.json({
      success: true,
      data: texts,
    });
  } catch (error: any) {
    console.error('Erro ao buscar textos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar textos',
      },
      { status: 500 }
    );
  }
}
