import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * GET /api/cadastro/[id]
 * Busca informações de um cadastro pendente por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceSupabase();
    const cadastroId = params.id;

    if (!cadastroId) {
      return NextResponse.json(
        { success: false, error: 'ID do cadastro não fornecido' },
        { status: 400 }
      );
    }

    // Buscar cadastro
    const { data: cadastro, error: cadastroError } = await supabase
      .from('cadastros_pendentes')
      .select(`
        *,
        planos (
          id,
          nome,
          valor,
          duracao_dias,
          chave_pix
        )
      `)
      .eq('id', cadastroId)
      .single();

    if (cadastroError || !cadastro) {
      return NextResponse.json(
        { success: false, error: 'Cadastro não encontrado' },
        { status: 404 }
      );
    }

    // Buscar chave PIX global (caso não tenha no plano)
    const { data: pixConfig } = await supabase
      .from('system_config')
      .select('valor')
      .eq('chave', 'chave_pix_global')
      .single();

    // Montar resposta com informações relevantes
    const response = {
      id: cadastro.id,
      nome: cadastro.nome,
      email: cadastro.email,
      telefone: cadastro.telefone,
      status: cadastro.status,
      plano_id: cadastro.plano_id,
      plano_nome: cadastro.planos?.nome || 'Plano não especificado',
      plano_valor: cadastro.planos?.valor || '0',
      plano_duracao: cadastro.planos?.duracao_dias || 30,
      chave_pix: cadastro.planos?.chave_pix || pixConfig?.valor || '',
      comprovante_url: cadastro.comprovante_url,
      comprovante_enviado_em: cadastro.comprovante_enviado_em,
      created_at: cadastro.created_at,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Erro ao buscar cadastro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
