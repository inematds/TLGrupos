import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bot } from '@/lib/telegram';

// Cliente Supabase com service role (bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ID do admin para notificações (configure no .env)
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID
  ? parseInt(process.env.TELEGRAM_ADMIN_CHAT_ID)
  : null;

/**
 * POST /api/processar-aprovacao
 *
 * Processa aprovação de pagamento e gera link de acesso
 *
 * Body:
 * {
 *   payment_id: string (UUID do pagamento),
 *   group_id: string (UUID do grupo Telegram)
 * }
 *
 * Fluxo:
 * 1. Busca dados do pagamento (COM member)
 * 2. Valida que pagamento está aprovado
 * 3. Gera link de convite no Telegram (member_limit: 1, sem expire_date)
 * 4. Salva na tabela payment_access_codes
 * 5. Retorna link para ser enviado por email
 */
export async function POST(request: NextRequest) {
  try {
    const { payment_id, group_id } = await request.json();

    // Validação básica
    if (!payment_id || !group_id) {
      return NextResponse.json(
        { error: 'payment_id e group_id são obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Busca dados do pagamento com informações do membro
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        members (
          id,
          nome,
          email,
          telefone,
          telegram_user_id
        )
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      console.error('Erro ao buscar pagamento:', paymentError);
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Validar que pagamento está aprovado
    if (payment.status !== 'aprovado') {
      return NextResponse.json(
        { error: 'Pagamento não está aprovado' },
        { status: 400 }
      );
    }

    // Verificar se já existe um código ativo para este pagamento
    const { data: existingCode } = await supabase
      .from('payment_access_codes')
      .select('*')
      .eq('payment_id', payment_id)
      .eq('status', 'ativo')
      .single();

    if (existingCode) {
      return NextResponse.json({
        success: true,
        invite_link: existingCode.invite_link,
        code_id: existingCode.id,
        message: 'Link já foi gerado anteriormente'
      });
    }

    // 2. Busca informações do grupo
    const { data: telegramGroup, error: groupError } = await supabase
      .from('telegram_groups')
      .select('*')
      .eq('id', group_id)
      .single();

    if (groupError || !telegramGroup) {
      console.error('Erro ao buscar grupo:', groupError);
      return NextResponse.json(
        { error: 'Grupo não encontrado' },
        { status: 404 }
      );
    }

    // 3. Gera link de convite no Telegram
    // ⭐ SEM expire_date = link nunca expira por tempo (só por uso ou revogação)
    let inviteLink: string;
    try {
      const result = await bot.telegram.createChatInviteLink(
        telegramGroup.chat_id,
        {
          member_limit: 1  // Link expira após 1 uso
          // ⭐ NÃO tem expire_date
        }
      );
      inviteLink = result.invite_link;
    } catch (telegramError: any) {
      console.error('Erro ao criar link no Telegram:', telegramError);

      // Notifica admin se configurado
      if (ADMIN_CHAT_ID) {
        try {
          await bot.telegram.sendMessage(
            ADMIN_CHAT_ID,
            `⚠️ ERRO ao criar link de convite\n\n` +
            `💰 Pagamento ID: ${payment_id}\n` +
            `👤 Membro: ${payment.members.nome}\n` +
            `❌ Erro: ${telegramError.message}`
          );
        } catch {}
      }

      return NextResponse.json(
        { error: 'Erro ao gerar link no Telegram', details: telegramError.message },
        { status: 500 }
      );
    }

    // 4. Busca forma de pagamento (se houver)
    let formaPagamento = null;
    if (payment.payment_method_id) {
      const { data: paymentMethod } = await supabase
        .from('forma_pagamentos')
        .select('nome')
        .eq('id', payment.payment_method_id)
        .single();

      formaPagamento = paymentMethod?.nome || null;
    }

    // 5. Salva na tabela payment_access_codes
    // ⭐ COPIA dados de payments (NÃO calcula)
    const { data: accessCode, error: insertError } = await supabase
      .from('payment_access_codes')
      .insert({
        invite_link: inviteLink,
        tipo: 'pagamento',

        member_id: payment.member_id,
        payment_id: payment.id,
        group_id: group_id,

        // Dados do usuário (snapshot)
        usuario_nome: payment.members.nome,
        usuario_email: payment.members.email,
        usuario_telefone: payment.members.telefone,
        usuario_telegram_id: payment.members.telegram_user_id,

        // ⭐ COPIA de payments (NÃO calcula)
        data_vencimento_acesso: payment.data_vencimento,
        dias_acesso: payment.dias_acesso,

        // Snapshot do pagamento
        valor_pago: payment.valor,
        forma_pagamento: formaPagamento,

        status: 'ativo',
        usado: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao salvar access code:', insertError);

      // Tenta revogar o link do Telegram para não deixar link órfão
      try {
        await bot.telegram.revokeChatInviteLink(telegramGroup.chat_id, inviteLink);
      } catch {}

      return NextResponse.json(
        { error: 'Erro ao salvar código de acesso', details: insertError.message },
        { status: 500 }
      );
    }

    // 6. Log da ação
    await supabase.from('logs').insert({
      member_id: payment.member_id,
      acao: 'geracao_link',
      detalhes: {
        payment_id: payment.id,
        group_id: group_id,
        access_code_id: accessCode.id,
        invite_link: inviteLink,
        valor: payment.valor,
        dias_acesso: payment.dias_acesso
      },
      executado_por: 'sistema'
    });

    // 7. Sucesso!
    return NextResponse.json({
      success: true,
      invite_link: inviteLink,
      code_id: accessCode.id,
      data_vencimento: payment.data_vencimento,
      dias_acesso: payment.dias_acesso,
      message: 'Link gerado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro geral ao processar aprovação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
