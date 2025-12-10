import { NextResponse } from 'next/server';
import { serviceSupabase as supabase } from '@/lib/supabase';

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

// POST /api/config - Salva múltiplas configurações de uma vez (evita rate limiting)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { configs } = body;

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json(
        { success: false, error: 'configs deve ser um array' },
        { status: 400 }
      );
    }

    console.log(`💾 [POST /api/config] Salvando ${configs.length} configurações em batch...`);

    // Processar em grupos menores para evitar timeout
    const BATCH_SIZE = 10;
    const results = [];

    for (let i = 0; i < configs.length; i += BATCH_SIZE) {
      const batch = configs.slice(i, i + BATCH_SIZE);

      // Para cada config no batch, fazer upsert
      const batchPromises = batch.map(async ({ chave, valor }: { chave: string; valor: string }) => {
        try {
          // Usar upsert do Supabase (mais eficiente)
          const { error } = await supabase
            .from('system_config')
            .upsert(
              { chave, valor, updated_at: new Date().toISOString() },
              { onConflict: 'chave' }
            );

          if (error) throw error;
          return { chave, success: true };
        } catch (error: any) {
          console.error(`❌ Erro ao salvar ${chave}:`, error.message);
          return { chave, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const failedCount = results.filter(r => !r.success).length;

    if (failedCount === 0) {
      console.log(`✅ [POST /api/config] Todas as ${configs.length} configurações salvas com sucesso!`);
      return NextResponse.json({
        success: true,
        message: `${configs.length} configurações salvas com sucesso`,
        results
      });
    } else {
      console.warn(`⚠️ [POST /api/config] ${failedCount} de ${configs.length} falharam`);
      return NextResponse.json({
        success: false,
        message: `${failedCount} de ${configs.length} configurações falharam`,
        results
      }, { status: 207 }); // 207 Multi-Status
    }
  } catch (error: any) {
    console.error('❌ [POST /api/config] Erro geral:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/config - Atualiza ou cria uma configuração (DEPRECATED - usar POST para múltiplas)
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

    // Usar upsert para simplicidade
    const { data, error } = await supabase
      .from('system_config')
      .upsert(
        { chave, valor, updated_at: new Date().toISOString() },
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
