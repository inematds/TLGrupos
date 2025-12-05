/**
 * API para executar manualmente um cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST - Executar um cron job manualmente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do cron job é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar o cron job
    const { data: job, error: fetchError } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { success: false, error: 'Cron job não encontrado' },
        { status: 404 }
      );
    }

    // Fazer requisição para o endpoint
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const url = `${baseUrl}${job.endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const resultado = await response.json();

    // Atualizar estatísticas
    const agora = new Date().toISOString();
    const updates: any = {
      ultimo_exec: agora,
      total_execucoes: (job.total_execucoes || 0) + 1,
      updated_at: agora,
    };

    if (response.ok) {
      updates.total_sucessos = (job.total_sucessos || 0) + 1;
    } else {
      updates.total_erros = (job.total_erros || 0) + 1;
    }

    await supabase
      .from('cron_jobs')
      .update(updates)
      .eq('id', id);

    return NextResponse.json({
      success: true,
      job: job.nome,
      executionSuccess: response.ok,
      status: response.status,
      resultado: resultado,
      message: response.ok
        ? 'Cron job executado com sucesso'
        : 'Cron job executado com erro'
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
