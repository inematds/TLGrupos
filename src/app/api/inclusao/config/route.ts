import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/inclusao/config - Busca configuração de horário
export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('configs')
      .select('*')
      .eq('chave', 'inclusao_horario')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = não encontrado
      throw new Error(`Erro ao buscar configuração: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: data ? { horario: data.valor } : { horario: '09:00' },
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

// POST /api/inclusao/config - Salva configuração de horário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { horario } = body;

    if (!horario || !/^\d{2}:\d{2}$/.test(horario)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Horário inválido. Use o formato HH:MM',
        },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Upsert na configuração
    const { error } = await supabase
      .from('configs')
      .upsert(
        {
          chave: 'inclusao_horario',
          valor: horario,
          descricao: 'Horário diário para inclusão automática de membros no grupo',
        },
        {
          onConflict: 'chave',
        }
      );

    if (error) {
      throw new Error(`Erro ao salvar configuração: ${error.message}`);
    }

    // Registrar log
    await supabase.from('logs').insert({
      acao: 'configuracao',
      detalhes: {
        tipo: 'inclusao_horario',
        horario,
      },
      executado_por: 'admin',
    });

    return NextResponse.json({
      success: true,
      message: 'Configuração salva com sucesso',
      data: { horario },
    });
  } catch (error: any) {
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao salvar configuração',
      },
      { status: 500 }
    );
  }
}
