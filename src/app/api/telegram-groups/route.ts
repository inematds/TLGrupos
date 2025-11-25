import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncGroupsToEnv } from '@/lib/update-env';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');

    let query = supabase
      .from('telegram_groups')
      .select('*')
      .order('nome', { ascending: true });

    if (ativo === 'true') {
      query = query.eq('ativo', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar grupos:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro ao buscar grupos:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

    const { data, error } = await supabase
      .from('telegram_groups')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar grupo:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 1. Sincronizar grupos com .env.local
    console.log('[Grupo Criado] Sincronizando .env.local...');
    const syncResult = await syncGroupsToEnv();

    if (!syncResult.success) {
      console.error('[Grupo Criado] Falha ao sincronizar .env:', syncResult.error);
    } else {
      console.log('[Grupo Criado] ✅ .env.local atualizado com', syncResult.groupsCount, 'grupos');
    }

    // 2. Reiniciar bot para aplicar mudanças
    try {
      const restartResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bot/restart`, {
        method: 'POST',
      });
      const restartData = await restartResponse.json();
      console.log('[Grupo Criado] Bot restart:', restartData);
    } catch (restartError) {
      console.warn('[Grupo Criado] Não foi possível reiniciar bot automaticamente:', restartError);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro ao criar grupo:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('telegram_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar grupo:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 1. Sincronizar grupos com .env.local
    console.log('[Grupo Atualizado] Sincronizando .env.local...');
    const syncResult = await syncGroupsToEnv();

    if (!syncResult.success) {
      console.error('[Grupo Atualizado] Falha ao sincronizar .env:', syncResult.error);
    } else {
      console.log('[Grupo Atualizado] ✅ .env.local atualizado com', syncResult.groupsCount, 'grupos');
    }

    // 2. Reiniciar bot para aplicar mudanças
    try {
      const restartResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bot/restart`, {
        method: 'POST',
      });
      const restartData = await restartResponse.json();
      console.log('[Grupo Atualizado] Bot restart:', restartData);
    } catch (restartError) {
      console.warn('[Grupo Atualizado] Não foi possível reiniciar bot automaticamente:', restartError);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro ao atualizar grupo:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('telegram_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar grupo:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 1. Sincronizar grupos com .env.local
    console.log('[Grupo Deletado] Sincronizando .env.local...');
    const syncResult = await syncGroupsToEnv();

    if (!syncResult.success) {
      console.error('[Grupo Deletado] Falha ao sincronizar .env:', syncResult.error);
    } else {
      console.log('[Grupo Deletado] ✅ .env.local atualizado com', syncResult.groupsCount, 'grupos');
    }

    // 2. Reiniciar bot para aplicar mudanças
    try {
      const restartResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bot/restart`, {
        method: 'POST',
      });
      const restartData = await restartResponse.json();
      console.log('[Grupo Deletado] Bot restart:', restartData);
    } catch (restartError) {
      console.warn('[Grupo Deletado] Não foi possível reiniciar bot automaticamente:', restartError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao deletar grupo:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
