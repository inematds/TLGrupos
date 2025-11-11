import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cadastroId = params.id;

    // Buscar cadastro pendente
    const { data: cadastro, error: cadastroError } = await supabase
      .from('cadastros_pendentes')
      .select('*')
      .eq('id', cadastroId)
      .single();

    if (cadastroError || !cadastro) {
      return NextResponse.json(
        { success: false, error: 'Cadastro não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já foi processado
    if (cadastro.status === 'processado' && cadastro.membro_id) {
      // Buscar o membro criado para obter o invite_link
      const { data: membro } = await supabase
        .from('members')
        .select('invite_link')
        .eq('id', cadastro.membro_id)
        .single();

      return NextResponse.json({
        success: true,
        data: {
          pago: true,
          processado: true,
          status: cadastro.status,
          invite_link: membro?.invite_link || cadastro.invite_link,
        },
      });
    }

    // Verificar se existe pagamento compatível no banco
    const { data: pagamentos, error: pagamentosError } = await supabase
      .from('pagamentos_banco')
      .select('*')
      .eq('valor', cadastro.valor_pago)
      .eq('processado', false)
      .gte('data_pagamento', cadastro.created_at)
      .order('data_pagamento', { ascending: false })
      .limit(5);

    const temPagamento = pagamentos && pagamentos.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        pago: temPagamento,
        processado: false,
        status: cadastro.status,
        pagamentos_encontrados: pagamentos?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
