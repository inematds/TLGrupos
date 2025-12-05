import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/config - Retorna todas as configurações do banco
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('configs')
      .select('*')
      .order('chave');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error: any) {
    console.error('Erro ao buscar configurações:', error);
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

    // Upsert: insere se não existe, atualiza se já existe
    const { data, error } = await supabase
      .from('configs')
      .upsert(
        { chave, valor },
        { onConflict: 'chave' }
      )
      .select()
      .single();

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
