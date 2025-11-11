import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { CreatePlanInput } from '@/types';

// GET /api/plans - Lista todos os planos
export async function GET(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    // Filtro opcional por status ativo
    const apenasAtivos = searchParams.get('ativos') === 'true';

    let query = supabase
      .from('plans')
      .select('*')
      .order('ordem', { ascending: true });

    if (apenasAtivos) {
      query = query.eq('ativo', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar planos: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar planos',
      },
      { status: 500 }
    );
  }
}

// POST /api/plans - Cria novo plano
export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const body: CreatePlanInput = await request.json();

    // Validações
    if (!body.nome || !body.valor || !body.duracao_dias) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome, valor e duração são obrigatórios',
        },
        { status: 400 }
      );
    }

    if (body.valor <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valor deve ser maior que zero',
        },
        { status: 400 }
      );
    }

    if (body.duracao_dias <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duração deve ser maior que zero',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('plans')
      .insert([{
        nome: body.nome,
        descricao: body.descricao || null,
        valor: body.valor,
        duracao_dias: body.duracao_dias,
        ativo: body.ativo !== undefined ? body.ativo : true,
        ordem: body.ordem || 0,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar plano: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Plano criado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao criar plano:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao criar plano',
      },
      { status: 500 }
    );
  }
}
