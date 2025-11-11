import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { UpdatePlanInput } from '@/types';

// GET /api/plans/[id] - Busca plano específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceSupabase();
    const { id } = params;

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Plano não encontrado',
          },
          { status: 404 }
        );
      }
      throw new Error(`Erro ao buscar plano: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Erro ao buscar plano:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar plano',
      },
      { status: 500 }
    );
  }
}

// PUT /api/plans/[id] - Atualiza plano
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceSupabase();
    const { id } = params;
    const body: UpdatePlanInput = await request.json();

    // Validações
    if (body.valor !== undefined && body.valor <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valor deve ser maior que zero',
        },
        { status: 400 }
      );
    }

    if (body.duracao_dias !== undefined && body.duracao_dias <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duração deve ser maior que zero',
        },
        { status: 400 }
      );
    }

    // Monta objeto de atualização apenas com campos fornecidos
    const updateData: any = {};
    if (body.nome !== undefined) updateData.nome = body.nome;
    if (body.descricao !== undefined) updateData.descricao = body.descricao;
    if (body.valor !== undefined) updateData.valor = body.valor;
    if (body.duracao_dias !== undefined) updateData.duracao_dias = body.duracao_dias;
    if (body.ativo !== undefined) updateData.ativo = body.ativo;
    if (body.ordem !== undefined) updateData.ordem = body.ordem;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum campo para atualizar',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Plano não encontrado',
          },
          { status: 404 }
        );
      }
      throw new Error(`Erro ao atualizar plano: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Plano atualizado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao atualizar plano',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/[id] - Remove plano
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceSupabase();
    const { id } = params;

    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao remover plano: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Plano removido com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao remover plano:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao remover plano',
      },
      { status: 500 }
    );
  }
}
