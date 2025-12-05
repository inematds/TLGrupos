import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createInviteLink, createGenericInviteLink } from '@/lib/telegram';
import { sendPaymentApprovedNotification, sendPaymentRejectedNotification } from '@/services/notification-service';

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
        member:members(id, nome, email, telegram_username, telegram_user_id, status),
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
    console.log('[API Payments POST] Dados recebidos:', JSON.stringify(body, null, 2));

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

    // Validações detalhadas
    if (!member_id) {
      return NextResponse.json(
        { error: 'Campo obrigatório: Membro não foi selecionado' },
        { status: 400 }
      );
    }

    if (!valor || isNaN(valor) || valor <= 0) {
      return NextResponse.json(
        { error: 'Campo obrigatório: Valor deve ser um número maior que zero' },
        { status: 400 }
      );
    }

    if (!dias_acesso || isNaN(dias_acesso) || dias_acesso <= 0) {
      return NextResponse.json(
        { error: 'Campo obrigatório: Dias de acesso deve ser um número maior que zero' },
        { status: 400 }
      );
    }

    // Verificar se o membro existe e buscar email e data_vencimento
    const { data: memberExists, error: memberError } = await supabase
      .from('members')
      .select('id, nome, email, data_vencimento')
      .eq('id', member_id)
      .single();

    if (memberError || !memberExists) {
      return NextResponse.json(
        { error: 'Membro não encontrado. Verifique se o ID do membro é válido.' },
        { status: 404 }
      );
    }

    // Criar pagamento
    const { data, error } = await supabase
      .from('payments')
      .insert({
        member_id,
        email: memberExists.email,
        plan_id,
        payment_method_id,
        valor,
        descricao,
        observacoes,
        comprovante_url,
        pix_chave,
        data_pagamento: data_pagamento || new Date().toISOString(),
        dias_acesso,
        status: 'pendente',
      })
      .select(`
        *,
        member:members(id, nome, email, telegram_username),
        plan:plans(id, nome, valor, duracao_dias)
      `)
      .single();

    if (error) {
      console.error('[API Payments] Erro ao criar pagamento:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao criar pagamento no banco de dados' },
        { status: 500 }
      );
    }

    console.log('[API Payments POST] Pagamento criado com sucesso:', data.id);

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

    return NextResponse.json({ success: true, payment: data }, { status: 201 });
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
      // Aceita tanto approved_by (inglês) quanto aprovado_por (português)
      const approver = approved_by || body.aprovado_por;

      if (!approver) {
        return NextResponse.json(
          { error: 'approved_by ou aprovado_por é obrigatório para aprovação' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.rpc('approve_payment', {
        p_payment_id: payment_id,
        p_approved_by: approver,
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

      // Buscar pagamento atualizado com dados do membro
      const { data: payment } = await supabase
        .from('payments')
        .select(`
          *,
          member:members(id, nome, email, telegram_user_id, telegram_username, data_vencimento),
          plan:plans(id, nome, valor, duracao_dias)
        `)
        .eq('id', payment_id)
        .single();

      if (!payment) {
        return NextResponse.json(
          { error: 'Pagamento não encontrado após aprovação' },
          { status: 404 }
        );
      }

      console.log('[API Payments] Pagamento aprovado, gerando link de acesso...');

      // Gerar link de convite do Telegram
      let inviteLink = '';
      const member = payment.member as any;

      if (member.telegram_user_id) {
        // Link único para usuário específico
        const linkResult = await createInviteLink(parseInt(member.telegram_user_id));
        if (linkResult.success) {
          inviteLink = linkResult.link || '';
          console.log('[API Payments] Link único gerado:', inviteLink);
        } else {
          console.error('[API Payments] Erro ao gerar link único:', linkResult.error);
          // Fallback para link genérico
          const genericResult = await createGenericInviteLink();
          if (genericResult.success) {
            inviteLink = genericResult.link || '';
            console.log('[API Payments] Link genérico gerado (fallback):', inviteLink);
          }
        }
      } else {
        // Link genérico se não houver telegram_user_id
        const genericResult = await createGenericInviteLink();
        if (genericResult.success) {
          inviteLink = genericResult.link || '';
          console.log('[API Payments] Link genérico gerado:', inviteLink);
        } else {
          console.error('[API Payments] Erro ao gerar link genérico:', genericResult.error);
        }
      }

      // Salvar link no pagamento
      if (inviteLink) {
        await supabase
          .from('payments')
          .update({ invite_link: inviteLink })
          .eq('id', payment_id);

        console.log('[API Payments] Link salvo no pagamento');
      }

      // Enviar notificações (Email + Telegram)
      if (inviteLink && member.id) {
        console.log('[API Payments] Enviando notificações...');

        try {
          const plan = payment.plan as any;
          const planoDias = plan?.duracao_dias || payment.dias_acesso || 30;

          const notificationResult = await sendPaymentApprovedNotification(
            member.id,
            inviteLink,
            planoDias,
            payment_id
          );

          console.log('[API Payments] Resultado das notificações:', {
            email: notificationResult.email ? 'Enviado' : 'Não enviado',
            telegram: notificationResult.telegram ? 'Enviado' : 'Não enviado',
          });

          // Atualizar campos de notificação no pagamento
          await supabase
            .from('payments')
            .update({
              email_sent: notificationResult.email,
              notification_sent: notificationResult.email || notificationResult.telegram,
            })
            .eq('id', payment_id);

          console.log('[API Payments] Status de notificação atualizado no pagamento');
        } catch (error) {
          console.error('[API Payments] Erro ao enviar notificações:', error);
          // Não bloqueia a aprovação se as notificações falharem
        }
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        new_expiry_date: result.new_expiry_date,
        invite_link: inviteLink,
        payment,
      });
    }

    // Se for rejeitar, usar a função do banco
    if (action === 'reject') {
      // Aceita tanto rejected_by (inglês) quanto rejeitado_por (português)
      const rejecter = rejected_by || body.rejeitado_por;

      if (!rejecter) {
        return NextResponse.json(
          { error: 'rejected_by ou rejeitado_por é obrigatório para rejeição' },
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
        p_rejected_by: rejecter,
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
          member:members(id, nome, email, telegram_user_id, telegram_username),
          plan:plans(id, nome, valor, duracao_dias)
        `)
        .eq('id', payment_id)
        .single();

      // Enviar notificações de rejeição
      if (payment && (payment.member as any)?.id) {
        console.log('[API Payments] Enviando notificações de rejeição...');

        try {
          const notificationResult = await sendPaymentRejectedNotification(
            (payment.member as any).id,
            motivo_rejeicao
          );

          console.log('[API Payments] Resultado das notificações de rejeição:', {
            email: notificationResult.email ? 'Enviado' : 'Não enviado',
            telegram: notificationResult.telegram ? 'Enviado' : 'Não enviado',
          });
        } catch (error) {
          console.error('[API Payments] Erro ao enviar notificações de rejeição:', error);
          // Não bloqueia a rejeição se as notificações falharem
        }
      }

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
        member:members(id, nome, email, telegram_username),
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

// DELETE - Excluir pagamento permanentemente
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

    // Buscar pagamento antes de deletar
    const { data: payment } = await supabase
      .from('payments')
      .select('*, member:members(id, nome, email)')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Registrar log ANTES de deletar
    await supabase.from('logs').insert({
      member_id: payment.member_id,
      acao: 'exclusao',
      detalhes: {
        tipo: 'exclusao_permanente_pagamento',
        payment_id: paymentId,
        valor: payment.valor,
        dias_acesso: payment.dias_acesso,
        status_anterior: payment.status,
      },
      executado_por: 'Admin',
    });

    // DELETAR permanentemente do banco de dados
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('[API Payments] Erro ao deletar:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`[API Payments] Pagamento ${paymentId} excluído permanentemente`);
    return NextResponse.json({ success: true, message: 'Pagamento excluído permanentemente' });
  } catch (error: any) {
    console.error('[API Payments] Erro:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
