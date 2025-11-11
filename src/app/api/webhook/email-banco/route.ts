import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Webhook para receber emails do banco via serviço de parsing
 * Pode ser integrado com CloudMailin, SendGrid Inbound Parse, AWS SES, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = request.headers.get('x-email-provider') || 'cloudmailin';

    console.log('Email recebido do banco:', { provider });

    let emailData;

    // Parser específico para cada provedor
    switch (provider.toLowerCase()) {
      case 'cloudmailin':
        emailData = parseCloudMailin(body);
        break;
      case 'sendgrid':
        emailData = parseSendGridInbound(body);
        break;
      case 'mailgun':
        emailData = parseMailgun(body);
        break;
      default:
        emailData = parseGeneric(body);
    }

    if (!emailData) {
      console.log('Email inválido ou não reconhecido');
      return NextResponse.json({ success: false, error: 'Email inválido' });
    }

    // Verificar se é um email de confirmação de pagamento do banco
    const isPaymentConfirmation = detectPaymentConfirmation(emailData);

    if (!isPaymentConfirmation) {
      console.log('Não é um email de confirmação de pagamento');
      return NextResponse.json({ success: true, message: 'Ignorado' });
    }

    // Extrair dados do pagamento do email
    const paymentInfo = extractPaymentInfo(emailData);

    if (!paymentInfo || !paymentInfo.valor) {
      console.log('Não foi possível extrair informações de pagamento');
      return NextResponse.json({ success: true, message: 'Sem dados de pagamento' });
    }

    // Salvar na tabela pagamentos_banco
    const { data: pagamento, error: insertError } = await supabase
      .from('pagamentos_banco')
      .insert({
        valor: paymentInfo.valor,
        descricao: paymentInfo.descricao || emailData.subject,
        data_pagamento: paymentInfo.data || new Date().toISOString(),
        remetente: paymentInfo.remetente,
        documento: paymentInfo.documento,
        email_origem: emailData.from,
        email_body: emailData.text,
        processado: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao salvar pagamento:', insertError);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar pagamento' },
        { status: 500 }
      );
    }

    console.log('Pagamento do banco registrado:', pagamento.id);

    // Tentar processar automaticamente
    // A rotina de processamento automático pegará este pagamento
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/processar-pagamentos`, {
      method: 'POST',
    }).catch((err) => console.log('Erro ao acionar processamento:', err));

    return NextResponse.json({
      success: true,
      data: {
        pagamento_id: pagamento.id,
        valor: pagamento.valor,
      },
    });
  } catch (error: any) {
    console.error('Erro ao processar email do banco:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Parser para CloudMailin
 */
function parseCloudMailin(body: any) {
  try {
    return {
      from: body.envelope?.from || body.headers?.From,
      to: body.envelope?.to?.[0] || body.headers?.To,
      subject: body.headers?.Subject,
      text: body.plain,
      html: body.html,
      attachments: body.attachments || [],
    };
  } catch (error) {
    console.error('Erro ao parsear CloudMailin:', error);
    return null;
  }
}

/**
 * Parser para SendGrid Inbound Parse
 */
function parseSendGridInbound(body: any) {
  try {
    return {
      from: body.from,
      to: body.to,
      subject: body.subject,
      text: body.text,
      html: body.html,
      attachments: body.attachments ? JSON.parse(body.attachments) : [],
    };
  } catch (error) {
    console.error('Erro ao parsear SendGrid:', error);
    return null;
  }
}

/**
 * Parser para Mailgun
 */
function parseMailgun(body: any) {
  try {
    return {
      from: body.sender,
      to: body.recipient,
      subject: body.subject,
      text: body['body-plain'],
      html: body['body-html'],
      attachments: [],
    };
  } catch (error) {
    console.error('Erro ao parsear Mailgun:', error);
    return null;
  }
}

/**
 * Parser genérico
 */
function parseGeneric(body: any) {
  try {
    return {
      from: body.from || body.sender || body.email,
      to: body.to || body.recipient,
      subject: body.subject || body.assunto,
      text: body.text || body.body || body.plain,
      html: body.html,
      attachments: body.attachments || [],
    };
  } catch (error) {
    console.error('Erro ao parsear genérico:', error);
    return null;
  }
}

/**
 * Detecta se o email é uma confirmação de pagamento
 */
function detectPaymentConfirmation(emailData: any): boolean {
  const subject = emailData.subject?.toLowerCase() || '';
  const text = emailData.text?.toLowerCase() || '';

  const keywords = [
    'pagamento aprovado',
    'pagamento confirmado',
    'pix recebido',
    'transferência recebida',
    'crédito em conta',
    'comprovante',
    'transação aprovada',
  ];

  return keywords.some((keyword) => subject.includes(keyword) || text.includes(keyword));
}

/**
 * Extrai informações do pagamento do email
 */
function extractPaymentInfo(emailData: any) {
  const text = emailData.text || '';
  const html = emailData.html || '';

  try {
    // Regex para encontrar valores em reais
    const valorRegex = /R\$\s*(\d+[.,]\d{2})/gi;
    const valores = [...text.matchAll(valorRegex)];

    if (valores.length === 0) {
      return null;
    }

    // Pegar o primeiro valor encontrado
    const valorStr = valores[0][1].replace(',', '.');
    const valor = parseFloat(valorStr);

    // Tentar extrair nome do remetente
    const nomeRegex = /(?:remetente|origem|pagador):\s*([^\n]+)/i;
    const nomeMatch = text.match(nomeRegex);
    const remetente = nomeMatch ? nomeMatch[1].trim() : null;

    // Tentar extrair CPF/CNPJ
    const docRegex = /(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/;
    const docMatch = text.match(docRegex);
    const documento = docMatch ? docMatch[1] : null;

    // Tentar extrair data
    const dataRegex = /(\d{2}\/\d{2}\/\d{4})/;
    const dataMatch = text.match(dataRegex);
    let data = null;
    if (dataMatch) {
      const [dia, mes, ano] = dataMatch[1].split('/');
      data = new Date(`${ano}-${mes}-${dia}`).toISOString();
    }

    return {
      valor,
      remetente,
      documento,
      data,
      descricao: emailData.subject,
    };
  } catch (error) {
    console.error('Erro ao extrair informações de pagamento:', error);
    return null;
  }
}
