/**
 * API para gerenciar cron jobs via web
 * CRUD completo + atualização automática do crontab
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { atualizarCrontab, calcularProximaExecucao } from '@/services/crontab-manager';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configuração do Supabase não encontrada');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * GET - Listar todos os cron jobs
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: jobs, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || [],
      total: jobs?.length || 0
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Criar novo cron job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { nome, descricao, endpoint, frequencia, ativo = true } = body;

    // Validações
    if (!nome || !endpoint || !frequencia) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: nome, endpoint, frequencia' },
        { status: 400 }
      );
    }

    // Validar formato do endpoint
    if (!endpoint.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Endpoint deve começar com /api/' },
        { status: 400 }
      );
    }

    // Calcular próxima execução
    const proximaExec = calcularProximaExecucao(frequencia);

    // Inserir no banco
    const { data: newJob, error } = await supabase
      .from('cron_jobs')
      .insert({
        nome,
        descricao,
        endpoint,
        frequencia,
        ativo,
        proximo_exec: proximaExec.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Atualizar crontab na VPS
    const cronResult = await atualizarCrontab();

    return NextResponse.json({
      success: true,
      job: newJob,
      crontabUpdated: cronResult.success,
      message: 'Cron job criado com sucesso'
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualizar cron job existente
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, nome, descricao, endpoint, frequencia, ativo } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Preparar objeto de atualização
    const updates: any = { updated_at: new Date().toISOString() };

    if (nome !== undefined) updates.nome = nome;
    if (descricao !== undefined) updates.descricao = descricao;
    if (endpoint !== undefined) {
      if (!endpoint.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Endpoint deve começar com /api/' },
          { status: 400 }
        );
      }
      updates.endpoint = endpoint;
    }
    if (frequencia !== undefined) {
      updates.frequencia = frequencia;
      updates.proximo_exec = calcularProximaExecucao(frequencia).toISOString();
    }
    if (ativo !== undefined) updates.ativo = ativo;

    // Atualizar no banco
    const { data: updatedJob, error } = await supabase
      .from('cron_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Atualizar crontab na VPS
    const cronResult = await atualizarCrontab();

    return NextResponse.json({
      success: true,
      job: updatedJob,
      crontabUpdated: cronResult.success,
      message: 'Cron job atualizado com sucesso'
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remover cron job
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Deletar do banco
    const { error } = await supabase
      .from('cron_jobs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Atualizar crontab na VPS
    const cronResult = await atualizarCrontab();

    return NextResponse.json({
      success: true,
      crontabUpdated: cronResult.success,
      message: 'Cron job removido com sucesso'
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
