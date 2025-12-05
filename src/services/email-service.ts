import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendInviteLinkParams {
  to: string;
  nome: string;
  inviteLink: string;
  planoDias: number;
  dataExpiracao: string;
}

/**
 * Envia email usando o provedor configurado
 * Pode ser Resend, SendGrid, AWS SES, etc.
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const emailProvider = process.env.EMAIL_PROVIDER || 'resend';

    if (emailProvider === 'resend') {
      return await sendEmailResend(params);
    } else if (emailProvider === 'sendgrid') {
      return await sendEmailSendGrid(params);
    } else if (emailProvider === 'smtp') {
      return await sendEmailSMTP(params);
    } else {
      console.log('Email simulado (configure EMAIL_PROVIDER):', params);
      return true;
    }
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Envia email usando Resend
 */
async function sendEmailResend(params: SendEmailParams): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY não configurada');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@seudominio.com',
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro Resend:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar via Resend:', error);
    return false;
  }
}

/**
 * Envia email usando SendGrid
 */
async function sendEmailSendGrid(params: SendEmailParams): Promise<boolean> {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY não configurada');
    return false;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: params.to }],
            subject: params.subject,
          },
        ],
        from: {
          email: process.env.EMAIL_FROM || 'noreply@seudominio.com',
        },
        content: [
          {
            type: 'text/html',
            value: params.html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro SendGrid:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar via SendGrid:', error);
    return false;
  }
}

/**
 * Envia email usando SMTP (Gmail, Outlook, etc)
 */
async function sendEmailSMTP(params: SendEmailParams): Promise<boolean> {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_FROM = process.env.SMTP_FROM || process.env.EMAIL_FROM;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('Configurações SMTP incompletas (SMTP_HOST, SMTP_USER, SMTP_PASS necessários)');
    return false;
  }

  try {
    // Importar nodemailer dinamicamente
    const nodemailer = require('nodemailer');

    // Criar transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587'),
      secure: SMTP_PORT === '465', // true para 465, false para outras portas
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Enviar email
    const info = await transporter.sendMail({
      from: SMTP_FROM || `"TLGrupos" <${SMTP_USER}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log(`[Email SMTP] Enviado com sucesso para ${params.to} - ID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error('[Email SMTP] Erro ao enviar:', error.message);
    return false;
  }
}

/**
 * Envia email com link de convite do Telegram
 */
export async function sendInviteLink(params: SendInviteLinkParams): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Grupo VIP</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Pagamento Confirmado!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
                Olá <strong>${params.nome}</strong>,
              </p>

              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
                Seu pagamento foi confirmado com sucesso! Seja bem-vindo ao nosso grupo VIP do Telegram.
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                <p style="margin: 5px 0; color: #555;">
                  <strong>📅 Plano:</strong> ${params.planoDias} dias
                </p>
                <p style="margin: 5px 0; color: #555;">
                  <strong>⏰ Válido até:</strong> ${new Date(params.dataExpiracao).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <p style="font-size: 16px; color: #333; margin: 20px 0;">
                Clique no botão abaixo para entrar no grupo:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${params.inviteLink}"
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 18px; font-weight: bold;">
                  🚀 Entrar no Grupo VIP
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin: 20px 0;">
                Ou copie e cole este link no seu navegador:
              </p>

              <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; color: #333;">
                ${params.inviteLink}
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 14px; color: #666; margin: 5px 0;">
                  ⚠️ <strong>Importante:</strong>
                </p>
                <ul style="font-size: 14px; color: #666; padding-left: 20px;">
                  <li>Este link é pessoal e intransferível</li>
                  <li>Seu acesso expira em ${params.planoDias} dias</li>
                  <li>Você receberá um aviso antes do vencimento</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                Este email foi enviado automaticamente. Por favor, não responda.
              </p>
              <p style="font-size: 12px; color: #999; margin: 10px 0 0;">
                © ${new Date().getFullYear()} TLGrupos - Sistema de Gerenciamento Telegram
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Olá ${params.nome},

Seu pagamento foi confirmado com sucesso! Seja bem-vindo ao nosso grupo VIP do Telegram.

Plano: ${params.planoDias} dias
Válido até: ${new Date(params.dataExpiracao).toLocaleDateString('pt-BR')}

Clique no link abaixo para entrar no grupo:
${params.inviteLink}

IMPORTANTE:
- Este link é pessoal e intransferível
- Seu acesso expira em ${params.planoDias} dias
- Você receberá um aviso antes do vencimento

---
TLGrupos - Sistema de Gerenciamento Telegram
  `.trim();

  const success = await sendEmail({
    to: params.to,
    subject: '🎉 Acesso Liberado - Grupo VIP Telegram',
    html,
    text,
  });

  // Registrar envio no banco
  if (success) {
    await supabase.from('emails_enviados').insert({
      destinatario: params.to,
      assunto: '🎉 Acesso Liberado - Grupo VIP Telegram',
      tipo: 'invite_link',
      status: 'enviado',
    });
  } else {
    await supabase.from('emails_enviados').insert({
      destinatario: params.to,
      assunto: '🎉 Acesso Liberado - Grupo VIP Telegram',
      tipo: 'invite_link',
      status: 'erro',
    });
  }

  return success;
}

/**
 * Envia email de notificação de expiração próxima
 */
export async function sendExpirationWarning(
  to: string,
  nome: string,
  diasRestantes: number
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>⚠️ Seu acesso está expirando em breve</h2>
  <p>Olá ${nome},</p>
  <p>Seu acesso ao grupo VIP expira em <strong>${diasRestantes} dias</strong>.</p>
  <p>Para renovar seu acesso, entre em contato conosco.</p>
  <p>Obrigado!</p>
</body>
</html>
  `;

  return await sendEmail({
    to,
    subject: '⚠️ Seu acesso expira em breve',
    html,
  });
}

export interface SendRejectionEmailParams {
  to: string;
  nome: string;
  motivo: string;
}

/**
 * Envia email de reprovação de pagamento
 */
export async function sendRejectionEmail(params: SendRejectionEmailParams): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Não Aprovado</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">❌ Pagamento Não Aprovado</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
                Olá <strong>${params.nome}</strong>,
              </p>

              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
                Infelizmente não conseguimos aprovar seu comprovante de pagamento.
              </p>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 5px 0; color: #555;">
                  <strong>📝 Motivo:</strong>
                </p>
                <p style="margin: 10px 0; color: #333;">
                  ${params.motivo}
                </p>
              </div>

              <p style="font-size: 16px; color: #333; margin: 20px 0;">
                Por favor, verifique os dados do pagamento e tente novamente. Se você acredita que houve um erro, entre em contato conosco.
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 14px; color: #666; margin: 5px 0;">
                  💡 <strong>Dicas:</strong>
                </p>
                <ul style="font-size: 14px; color: #666; padding-left: 20px;">
                  <li>Certifique-se de que o comprovante está legível</li>
                  <li>Verifique se o valor está correto</li>
                  <li>Confirme que o pagamento foi feito para a chave PIX correta</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                Este email foi enviado automaticamente. Se tiver dúvidas, entre em contato.
              </p>
              <p style="font-size: 12px; color: #999; margin: 10px 0 0;">
                © ${new Date().getFullYear()} TLGrupos - Sistema de Gerenciamento Telegram
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Olá ${params.nome},

Infelizmente não conseguimos aprovar seu comprovante de pagamento.

Motivo: ${params.motivo}

Por favor, verifique os dados do pagamento e tente novamente. Se você acredita que houve um erro, entre em contato conosco.

Dicas:
- Certifique-se de que o comprovante está legível
- Verifique se o valor está correto
- Confirme que o pagamento foi feito para a chave PIX correta

---
TLGrupos - Sistema de Gerenciamento Telegram
  `.trim();

  const success = await sendEmail({
    to: params.to,
    subject: '❌ Comprovante de Pagamento Não Aprovado',
    html,
    text,
  });

  // Registrar envio no banco
  if (success) {
    await supabase.from('emails_enviados').insert({
      destinatario: params.to,
      assunto: '❌ Comprovante de Pagamento Não Aprovado',
      tipo: 'rejection',
      status: 'enviado',
    });
  } else {
    await supabase.from('emails_enviados').insert({
      destinatario: params.to,
      assunto: '❌ Comprovante de Pagamento Não Aprovado',
      tipo: 'rejection',
      status: 'erro',
    });
  }

  return success;
}
