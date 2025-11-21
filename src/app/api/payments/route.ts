import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Listar pagamentos com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const memberId = searchParams.get('member_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('payments')
      .select(`
        *,
        member:members(id, nome, telegram_username, telegram_user_id, status),
        plan:plans(id, nome, valor, duracao_dias)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (memberId) {
      query = query.eq('member_id', memberId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[API Payments] Erro ao buscar:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payments: data,
      total: count,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('[API Payments] Erro:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Criar novo pagamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      member_id,
      plan_id,
      payment_method_id,
      valor,
      descricao,
      observacoes,
      comprovante_url,
      pix_chave,
      data_pagamento,
      data_vencimento,
      dias_acesso = 30,
    } = body;

    // Validações
    if (!member_id) {
      return NextResponse.json(
        { error: 'member_id é obrigatório' },
        { status: 400 }
      );
    }

    if (!valor || valor <= 0) {
      return NextResponse.json(
        { error: 'valor deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Criar pagamento
    const { data, error } = await supabase
      .from('payments')
      .insert({
        member_id,
        plan_id,
        payment_method_id,
        valor,
        descricao,
        observacoes,
        comprovante_url,
        pix_chave,
        data_pagamento: data_pagamento || new Date().toISOString(),
        data_vencimento,
        dias_acesso,
        status: 'pendente',
      })
      .select(`
        *,
        member:members(id, nome, telegram_username),
        plan:plans(id, nome, valor, duracao_dias)
      `)
      .single();

    if (error) {
      console.error('[API Payments] Erro ao criar:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Registrar log
    await supabase.from('logs').insert({
      member_id,
      acao: 'edicao',
      detalhes: {
        tipo: 'criacao_pagamento',
        payment_id: data.id,
        valor,
        dias_acesso,
      },
      executado_por: 'Sistema',
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('[API Payments] Erro:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar pagamento (aprovar/rejeitar)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payment_id,
      action, // 'approve' ou 'reject'
      approved_by,
      rejected_by,
      motivo_rejeicao,
      ...updateData
    } = body;

    if (!payment_id) {
      return NextResponse.json(
        { error: 'payment_id é obrigatório' },
        { status: 400 }
      );
    }

    // Se for aprovar, usar a função do banco
    if (action === 'approve') {
      if (!approved_by) {
        return NextResponse.json(
          { error: 'approved_by é obrigatório para aprovação' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.rpc('approve_payment', {
        p_payment_id: payment_id,
        p_approved_by: approved_by,
      });

      if (error) {
        console.error('[API Payments] Erro ao aprovar:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      const result = data[0];
      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }

      // Buscar pagamento atualizado
      const { data: payment } = await supabase
        .from('payments')
        .select(`
          *,
          member:members(id, nome, telegram_username, data_vencimento),
          plan:plans(id, nome, valor, duracao_dias)
        `)
        .eq('id', payment_id)
        .single();

      return NextResponse.json({
        success: true,
        message: result.message,
        new_expiry_date: result.new_expiry_date,
        payment,
      });
    }

    // Se for rejeitar, usar a função do banco
    if (action === 'reject') {
      if (!rejected_by) {
        return NextResponse.json(
          { error: 'rejected_by é obrigatório para rejeição' },
          { status: 400 }
        );
      }

      if (!motivo_rejeicao) {
        return NextResponse.json(
          { error: 'motivo_rejeicao é obrigatório para rejeição' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.rpc('reject_payment', {
        p_payment_id: payment_id,
        p_rejected_by: rejected_by,
        p_motivo: motivo_rejeicao,
      });

      if (error) {
        console.error('[API Payments] Erro ao rejeitar:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      const result = data[0];
      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }

      // Buscar pagamento atualizado
      const { data: payment } = await supabase
        .from('payments')
        .select(`
          *,
          member:members(id, nome, telegram_username),
          plan:plans(id, nome, valor, duracao_dias)
        `)
        .eq('id', payment_id)
        .single();

      return NextResponse.json({
        success: true,
        message: result.message,
        payment,
      });
    }

    // Atualização simples de campos
    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment_id)
      .select(`
        *,
        member:members(id, nome, telegram_username),
        plan:plans(id, nome, valor, duracao_dias)
      `)
      .single();

    if (error) {
      console.error('[API Payments] Erro ao atualizar:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Payments] Erro:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar pagamento
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar pagamento antes de cancelar
    const { data: payment } = await supabase
      .from('payments')
      .select('*, member:members(id, nome)')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar status para cancelado
    const { error } = await supabase
      .from('payments')
      .update({ status: 'cancelado' })
      .eq('id', paymentId);

    if (error) {
      console.error('[API Payments] Erro ao cancelar:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Registrar log
    await supabase.from('logs').insert({
      member_id: payment.member_id,
      acao: 'edicao',
      detalhes: {
        tipo: 'cancelamento_pagamento',
        payment_id: paymentId,
      },
      executado_por: 'Sistema',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Payments] Erro:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
