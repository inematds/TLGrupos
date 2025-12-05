import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/config - Retorna todas as configurações do banco
export async function GET() {
  try {
    console.log('📥 [GET /api/config] Buscando configurações...');
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('chave');

    if (error) {
      console.error('❌ [GET /api/config] Erro Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('✅ [GET /api/config] Sucesso:', data?.length || 0, 'configs');
    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error: any) {
    console.error('❌ [GET /api/config] Erro geral:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/config - Atualiza ou cria uma configuração
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { chave, valor } = body;

    if (!chave) {
      return NextResponse.json(
        { success: false, error: 'Chave é obrigatória' },
        { status: 400 }
      );
    }

    // Primeiro, verifica se a config já existe
    const { data: existing } = await supabase
      .from('system_config')
      .select('*')
      .eq('chave', chave)
      .maybeSingle();

    let data, error;

    if (existing) {
      // Atualiza registro existente
      const result = await supabase
        .from('system_config')
        .update({ valor, updated_at: new Date().toISOString() })
        .eq('chave', chave)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insere novo registro
      const result = await supabase
        .from('system_config')
        .insert({ chave, valor, updated_at: new Date().toISOString() })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
