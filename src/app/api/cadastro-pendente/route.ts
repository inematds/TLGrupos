import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { z } from 'zod';

const supabase = getServiceSupabase();

// Schema de validação
const cadastroPendenteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  telegram_username: z.string().optional(),
  plan_id: z.string().uuid().optional(), // Novo sistema de planos
  plano_dias: z.number().int().positive('Plano inválido').optional(), // Compatibilidade
  valor_pago: z.number().positive('Valor inválido'),
  metodo_pagamento: z.enum(['pix', 'cartao']).default('pix'),
  qr_code_pix: z.string().optional(),
});

// POST /api/cadastro-pendente - Cria novo cadastro aguardando pagamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    const validated = cadastroPendenteSchema.parse(body);

    // Se forneceu plan_id, buscar dados do plano
    let planoDias = validated.plano_dias;
    if (validated.plan_id) {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('duracao_dias')
        .eq('id', validated.plan_id)
        .single();

      if (!planError && plan) {
        planoDias = plan.duracao_dias;
      }
    }

    if (!planoDias) {
      throw new Error('Plano inválido: forneça plan_id ou plano_dias');
    }

    // Criar cadastro pendente
    const { data, error } = await supabase
      .from('cadastros_pendentes')
      .insert({
        nome: validated.nome,
        email: validated.email,
        telefone: validated.telefone,
        telegram_username: validated.telegram_username,
        plan_id: validated.plan_id,
        plano_dias: planoDias,
        valor_pago: validated.valor_pago,
        metodo_pagamento: validated.metodo_pagamento,
        qr_code_pix: validated.qr_code_pix,
        status: 'aguardando_pagamento',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar cadastro: ${error.message}`);
    }

    // Registrar log
    await supabase.from('logs').insert({
      acao: 'cadastro_pendente_criado',
      detalhes: {
        cadastro_id: data.id,
        nome: validated.nome,
        email: validated.email,
        plano_dias: validated.plano_dias,
        valor_pago: validated.valor_pago,
      },
      executado_por: 'sistema',
    });

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Cadastro criado com sucesso. Aguardando confirmação de pagamento.',
    });
  } catch (error: any) {
    console.error('Erro ao criar cadastro pendente:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao criar cadastro pendente',
      },
      { status: 500 }
    );
  }
}

// GET /api/cadastro-pendente - Lista cadastros pendentes (admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase
      .from('cadastros_pendentes')
      .select('*, plan:plans(nome, valor)')
      .order('created_at', { ascending: false });

    // Se status for fornecido, filtrar por ele
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar cadastros: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Erro ao buscar cadastros pendentes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar cadastros pendentes',
      },
      { status: 500 }
    );
  }
}
