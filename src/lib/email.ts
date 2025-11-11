/**
 * Serviço de envio de emails
 * Usa Resend para enviar emails transacionais
 *
 * Para usar:
 * 1. Criar conta gratuita em https://resend.com
 * 2. Gerar API Key
 * 3. Adicionar RESEND_API_KEY no .env.local
 * 4. Adicionar EMAIL_FROM no .env.local (ex: onboarding@seudominio.com)
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia email usando Resend
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html } = params;

  // Verificar se as variáveis de ambiente estão configuradas
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY não configurado - email não será enviado');
    return {
      success: false,
      error: 'RESEND_API_KEY não configurado',
    };
  }

  const emailFrom = process.env.EMAIL_FROM || 'noreply@tlgrupos.com';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error: any) {
    console.error('[Email] Erro ao enviar:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Template de email para convite de entrada no grupo
 */
export function getInviteEmailTemplate(params: {
  nome: string;
  inviteLink: string;
  vencimento: Date;
  diasRestantes: number;
}) {
  const { nome, inviteLink, vencimento, diasRestantes } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para o Grupo</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🎉 Bem-vindo(a)!</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>${nome}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Você foi aprovado para entrar no nosso grupo exclusivo do Telegram!
    </p>

    <div style="background: #f7f9fc; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>📅 Vencimento:</strong> ${vencimento.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      <p style="margin: 5px 0;"><strong>⏰ Dias de acesso:</strong> ${diasRestantes} dias</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteLink}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
        🔗 Entrar no Grupo
      </a>
    </div>

    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 5px 0; font-size: 14px;"><strong>⚠️ Importante:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
        <li>O link é único e exclusivo para você</li>
        <li>Use o link o quanto antes</li>
        <li>Após entrar, você terá acesso até ${vencimento.toLocaleDateString('pt-BR')}</li>
      </ul>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Depois de entrar no grupo, use o comando <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">/status</code> para verificar seu cadastro a qualquer momento.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>TLGrupos - Sistema de Gerenciamento de Grupos Telegram</p>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Envia email de convite para entrada no grupo
 */
export async function sendInviteEmail(params: {
  to: string;
  nome: string;
  inviteLink: string;
  vencimento: Date;
  diasRestantes: number;
}): Promise<SendEmailResult> {
  const { to, nome, inviteLink, vencimento, diasRestantes } = params;

  return sendEmail({
    to,
    subject: '🎉 Seu convite para o grupo está pronto!',
    html: getInviteEmailTemplate({ nome, inviteLink, vencimento, diasRestantes }),
  });
}
