import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

const supabase = getServiceSupabase();

/**
 * GET /api/config - Busca todas as configurações ou uma específica
 * Query params: ?chave=nome_config
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chave = searchParams.get('chave');

    if (chave) {
      // Buscar uma configuração específica
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .eq('chave', chave)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        data,
      });
    }

    // Buscar todas as configurações
    const { data, error } = await supabase
      .from('system_config')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Erro ao buscar configuração:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar configuração',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/config - Atualiza uma configuração
 * Body: { chave: string, valor: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { chave, valor } = body;

    if (!chave) {
      return NextResponse.json(
        { success: false, error: 'Chave é obrigatória' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('system_config')
      .update({ valor, updated_at: new Date().toISOString() })
      .eq('chave', chave)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Configuração atualizada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar configuração:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao atualizar configuração',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/config - Cria uma nova configuração
 * Body: { chave: string, valor: string, descricao?: string, tipo?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chave, valor, descricao, tipo } = body;

    if (!chave || valor === undefined) {
      return NextResponse.json(
        { success: false, error: 'Chave e valor são obrigatórios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('system_config')
      .insert({ chave, valor, descricao, tipo: tipo || 'text' })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Configuração criada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao criar configuração:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao criar configuração',
      },
      { status: 500 }
    );
  }
}
