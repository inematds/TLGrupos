import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendInviteLink } from '@/services/email-service';
import { createMember } from '@/services/member-service';
import { Telegraf } from 'telegraf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const GROUP_ID = process.env.TELEGRAM_GROUP_ID!;

/**
 * Webhook para receber notificações de pagamento PIX
 * Suporta diferentes provedores: Mercado Pago, PicPay, Asaas, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = request.headers.get('x-provider') || 'mercadopago';

    console.log('Webhook recebido:', { provider, body });

    let paymentData;

    // Parser específico para cada provedor
    switch (provider.toLowerCase()) {
      case 'mercadopago':
        paymentData = parseMercadoPago(body);
        break;
      case 'picpay':
        paymentData = parsePicPay(body);
        break;
      case 'asaas':
        paymentData = parseAsaas(body);
        break;
      default:
        paymentData = parseGeneric(body);
    }

    if (!paymentData || !paymentData.approved) {
      console.log('Pagamento não aprovado ou dados inválidos');
      return NextResponse.json({ success: true, message: 'Ignorado' });
    }

    // Buscar cadastro pendente pelo valor ou ID externo
    const { data: cadastros, error: searchError } = await supabase
      .from('cadastros_pendentes')
      .select('*')
      .eq('valor_pago', paymentData.amount)
      .eq('status', 'aguardando_pagamento')
      .order('created_at', { ascending: false })
      .limit(1);

    if (searchError || !cadastros || cadastros.length === 0) {
      console.log('Nenhum cadastro pendente encontrado para este valor');
      return NextResponse.json({ success: true, message: 'Cadastro não encontrado' });
    }

    const cadastro = cadastros[0];

    // Verificar se já foi processado
    if (cadastro.membro_id) {
      console.log('Cadastro já processado');
      return NextResponse.json({ success: true, message: 'Já processado' });
    }

    // Criar membro no sistema
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + cadastro.plano_dias);

    const membro = await createMember({
      nome: cadastro.nome,
      email: cadastro.email,
      telefone: cadastro.telefone,
      telegram_username: cadastro.telegram_username,
      dias_acesso: cadastro.plano_dias,
    });

    // Gerar link de convite único
    const inviteLink = await bot.telegram.createChatInviteLink(GROUP_ID, {
      expire_date: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 dias
      member_limit: 1,
    });

    // Atualizar membro com link
    await supabase
      .from('members')
      .update({ invite_link: inviteLink.invite_link })
      .eq('id', membro.id);

    // Atualizar cadastro como processado
    await supabase
      .from('cadastros_pendentes')
      .update({
        status: 'processado',
        membro_id: membro.id,
        processado_em: new Date().toISOString(),
        invite_link: inviteLink.invite_link,
      })
      .eq('id', cadastro.id);

    // Enviar email com link de acesso
    await sendInviteLink({
      to: cadastro.email,
      nome: cadastro.nome,
      inviteLink: inviteLink.invite_link,
      planoDias: cadastro.plano_dias,
      dataExpiracao: dataExpiracao.toISOString(),
    });

    console.log('Pagamento processado com sucesso:', cadastro.id);

    return NextResponse.json({
      success: true,
      data: {
        cadastro_id: cadastro.id,
        membro_id: membro.id,
        invite_link: inviteLink.invite_link,
      },
    });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Parser para Mercado Pago
 */
function parseMercadoPago(body: any) {
  try {
    if (body.type === 'payment' && body.action === 'payment.created') {
      const payment = body.data;
      return {
        id: payment.id,
        amount: payment.transaction_amount,
        approved: payment.status === 'approved',
        payer: {
          email: payment.payer?.email,
          name: payment.payer?.first_name,
        },
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao parsear Mercado Pago:', error);
    return null;
  }
}

/**
 * Parser para PicPay
 */
function parsePicPay(body: any) {
  try {
    if (body.status === 'paid') {
      return {
        id: body.referenceId,
        amount: body.value,
        approved: true,
        payer: {
          email: body.buyer?.email,
          name: body.buyer?.firstName,
        },
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao parsear PicPay:', error);
    return null;
  }
}

/**
 * Parser para Asaas
 */
function parseAsaas(body: any) {
  try {
    if (body.event === 'PAYMENT_RECEIVED') {
      const payment = body.payment;
      return {
        id: payment.id,
        amount: payment.value,
        approved: payment.status === 'RECEIVED',
        payer: {
          email: payment.customer?.email,
          name: payment.customer?.name,
        },
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao parsear Asaas:', error);
    return null;
  }
}

/**
 * Parser genérico
 */
function parseGeneric(body: any) {
  try {
    return {
      id: body.id || body.payment_id || body.transaction_id,
      amount: body.amount || body.value || body.total,
      approved: body.status === 'approved' || body.status === 'paid',
      payer: {
        email: body.email || body.payer_email,
        name: body.name || body.payer_name,
      },
    };
  } catch (error) {
    console.error('Erro ao parsear genérico:', error);
    return null;
  }
}
