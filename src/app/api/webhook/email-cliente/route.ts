import { NextRequest, NextResponse } from 'next/server';
import { serviceSupabase as supabase } from '@/lib/supabase';

/**
 * Webhook para receber emails de clientes com comprovantes
 * Integrado com CloudMailin, SendGrid Inbound Parse, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = request.headers.get('x-email-provider') || 'cloudmailin';

    console.log('Email recebido do cliente:', { provider });

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
      console.log('Email inválido');
      return NextResponse.json({ success: false, error: 'Email inválido' });
    }

    // Extrair nome do cliente do assunto (formato: "Cadastro - Nome do Cliente")
    const nomeMatch = emailData.subject?.match(/cadastro\s*-\s*(.+)/i);
    const nomeCliente = nomeMatch ? nomeMatch[1].trim() : null;

    if (!nomeCliente) {
      console.log('Assunto do email não segue o padrão esperado');
      return NextResponse.json({
        success: false,
        error: 'Assunto deve ser: Cadastro - Seu Nome',
      });
    }

    // Buscar cadastro pendente pelo nome
    const { data: cadastros, error: searchError } = await supabase
      .from('cadastros_pendentes')
      .select('*')
      .ilike('nome', `%${nomeCliente}%`)
      .in('status', ['aguardando_pagamento', 'pendente'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (searchError || !cadastros || cadastros.length === 0) {
      console.log('Nenhum cadastro encontrado para:', nomeCliente);
      return NextResponse.json({
        success: false,
        error: 'Cadastro não encontrado',
      });
    }

    const cadastro = cadastros[0];

    // Processar anexos (comprovantes)
    let comprovanteUrl = null;

    if (emailData.attachments && emailData.attachments.length > 0) {
      const attachment = emailData.attachments[0];

      // Upload do anexo para Supabase Storage
      const fileName = `comprovante_email_${cadastro.id}_${Date.now()}.${attachment.type?.split('/')[1] || 'jpg'}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, Buffer.from(attachment.content, 'base64'), {
          contentType: attachment.type || 'image/jpeg',
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('comprovantes')
          .getPublicUrl(fileName);
        comprovanteUrl = urlData.publicUrl;
      }
    }

    // Salvar comprovante recebido por email
    const { error: insertError } = await supabase
      .from('comprovantes_email')
      .insert({
        cadastro_id: cadastro.id,
        email_remetente: emailData.from,
        assunto: emailData.subject,
        corpo_email: emailData.text,
        comprovante_url: comprovanteUrl,
        processado: false,
      });

    if (insertError) {
      console.error('Erro ao salvar comprovante:', insertError);
    }

    // Atualizar cadastro
    await supabase
      .from('cadastros_pendentes')
      .update({
        status: 'comprovante_enviado',
        comprovante_url: comprovanteUrl || cadastro.comprovante_url,
        comprovante_enviado_em: new Date().toISOString(),
      })
      .eq('id', cadastro.id);

    console.log('Comprovante do cliente registrado:', cadastro.id);

    return NextResponse.json({
      success: true,
      data: {
        cadastro_id: cadastro.id,
        nome: cadastro.nome,
        comprovante_url: comprovanteUrl,
      },
    });
  } catch (error: any) {
    console.error('Erro ao processar email do cliente:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function parseCloudMailin(body: any) {
  try {
    const attachments = (body.attachments || []).map((att: any) => ({
      filename: att.file_name,
      type: att.content_type,
      content: att.content,
    }));

    return {
      from: body.envelope?.from || body.headers?.From,
      to: body.envelope?.to?.[0] || body.headers?.To,
      subject: body.headers?.Subject,
      text: body.plain,
      html: body.html,
      attachments,
    };
  } catch (error) {
    return null;
  }
}

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
    return null;
  }
}

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
    return null;
  }
}

function parseGeneric(body: any) {
  try {
    return {
      from: body.from || body.sender,
      to: body.to || body.recipient,
      subject: body.subject,
      text: body.text || body.body,
      html: body.html,
      attachments: body.attachments || [],
    };
  } catch (error) {
    return null;
  }
}
