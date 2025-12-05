import { getServiceSupabase } from '@/lib/supabase';
import { sendPrivateMessage, formatMessage } from '@/lib/telegram';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendEmail, sendInviteLink, sendRejectionEmail } from './email-service';

const supabase = getServiceSupabase();

/**
 * Verifica se email e telegram estão ativos nas configurações
 */
async function getActiveChannels(): Promise<{ email: boolean; telegram: boolean }> {
  const { data, error } = await supabase
    .from('system_config')
    .select('chave, valor')
    .in('chave', ['notif_enviar_email', 'notif_enviar_telegram']);

  if (error || !data) {
    console.warn('[Notification] Erro ao buscar configurações de canais, usando padrão (ambos ativos)');
    return { email: true, telegram: true };
  }

  const emailConfig = data.find((c) => c.chave === 'notif_enviar_email');
  const telegramConfig = data.find((c) => c.chave === 'notif_enviar_telegram');

  return {
    email: emailConfig?.valor === 'true' || emailConfig?.valor === true,
    telegram: telegramConfig?.valor === 'true' || telegramConfig?.valor === true,
  };
}

/**
 * Verifica configurações de avisos de vencimento (quais estão ativos)
 */
async function getExpiryWarningsConfig(): Promise<{
  enabled: boolean;
  warnings: Array<{ number: number; days: number; active: boolean }>;
}> {
  const { data, error } = await supabase
    .from('system_config')
    .select('chave, valor')
    .in('chave', [
      'notif_vencimento_ativo',
      'notif_vencimento_1_ativo',
      'notif_vencimento_1_dias',
      'notif_vencimento_2_ativo',
      'notif_vencimento_2_dias',
      'notif_vencimento_3_ativo',
      'notif_vencimento_3_dias',
    ]);

  if (error || !data) {
    console.warn('[Notification] Erro ao buscar configurações de vencimento, usando padrão');
    return {
      enabled: true,
      warnings: [
        { number: 1, days: 5, active: true },
        { number: 2, days: 7, active: true },
        { number: 3, days: 30, active: true },
      ],
    };
  }

  const getConfig = (key: string, defaultValue: any = '') => {
    const config = data.find((c) => c.chave === key);
    return config?.valor ?? defaultValue;
  };

  const enabled = getConfig('notif_vencimento_ativo', 'true') === 'true';

  return {
    enabled,
    warnings: [
      {
        number: 1,
        days: parseInt(getConfig('notif_vencimento_1_dias', '5')),
        active: getConfig('notif_vencimento_1_ativo', 'true') === 'true',
      },
      {
        number: 2,
        days: parseInt(getConfig('notif_vencimento_2_dias', '7')),
        active: getConfig('notif_vencimento_2_ativo', 'true') === 'true',
      },
      {
        number: 3,
        days: parseInt(getConfig('notif_vencimento_3_dias', '30')),
        active: getConfig('notif_vencimento_3_ativo', 'true') === 'true',
      },
    ],
  };
}

/**
 * Verifica se notificação já foi enviada
 */
async function checkNotificationSent(
  memberId: string,
  notificationType: string,
  daysBeforeExpiry?: number
): Promise<{ alreadySent: boolean; emailSent: boolean; telegramSent: boolean }> {
  const { data, error } = await supabase.rpc('check_notification_already_sent', {
    p_member_id: memberId,
    p_notification_type: notificationType,
    p_days_before_expiry: daysBeforeExpiry || null,
  });

  if (error || !data || data.length === 0) {
    return { alreadySent: false, emailSent: false, telegramSent: false };
  }

  const result = data[0];
  return {
    alreadySent: result.already_sent || false,
    emailSent: result.email_sent || false,
    telegramSent: result.telegram_sent || false,
  };
}

/**
 * Registra notificação no histórico
 */
async function createNotificationRecord(params: {
  memberId: string;
  paymentId?: string;
  notificationType: string;
  daysBeforeExpiry?: number;
  warningNumber?: number;
  subject?: string;
  message: string;
  inviteLink?: string;
  scheduledFor?: Date;
}): Promise<string> {
  const { data, error } = await supabase
    .from('notification_history')
    .insert({
      member_id: params.memberId,
      payment_id: params.paymentId || null,
      notification_type: params.notificationType,
      days_before_expiry: params.daysBeforeExpiry || null,
      warning_number: params.warningNumber || null,
      subject: params.subject || null,
      message: params.message,
      invite_link: params.inviteLink || null,
      scheduled_for: params.scheduledFor || new Date(),
      email_sent: false,
      telegram_sent: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Notification] Erro ao criar registro de notificação:', error);
    throw new Error('Erro ao criar registro de notificação');
  }

  return data.id;
}

/**
 * Atualiza status de envio de email
 */
async function updateEmailStatus(
  notificationId: string,
  success: boolean,
  error?: string
): Promise<void> {
  await supabase.rpc('query', {
    query: `
      UPDATE notification_history
      SET
        email_sent = $1,
        email_sent_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
        email_error = $2,
        email_attempts = email_attempts + 1,
        updated_at = NOW()
      WHERE id = $3
    `,
    params: [success, error || null, notificationId],
  });
}

/**
 * Atualiza status de envio de telegram
 */
async function updateTelegramStatus(
  notificationId: string,
  success: boolean,
  error?: string
): Promise<void> {
  await supabase.rpc('query', {
    query: `
      UPDATE notification_history
      SET
        telegram_sent = $1,
        telegram_sent_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
        telegram_error = $2,
        telegram_attempts = telegram_attempts + 1,
        updated_at = NOW()
      WHERE id = $3
    `,
    params: [success, error || null, notificationId],
  });
}

/**
 * Obtém template de mensagem da configuração
 */
async function getMessageTemplate(key: string): Promise<string> {
  const { data, error } = await supabase
    .from('system_config')
    .select('valor')
    .eq('chave', key)
    .single();

  if (error || !data) {
    // Template padrão
    return 'Olá {nome}! Seu acesso ao grupo vence em {dias} dias ({data}). Entre em contato para renovar.';
  }

  return data.valor.texto;
}

/**
 * Envia notificação para um membro específico
 */
export async function sendNotificationToMember(
  memberId: string,
  daysBeforeExpiry: number
) {
  // Buscar membro
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    throw new Error('Membro não encontrado');
  }

  // Buscar canais ativos
  const activeChannels = await getActiveChannels();

  // Formatar data de vencimento
  const dataVencimento = format(
    new Date(member.data_vencimento),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  // Mensagem padrão
  const message = `⚠️ *Aviso de Vencimento*

Olá *${member.nome}*!

Seu acesso ao grupo VIP vence em *${daysBeforeExpiry} dias*.

📅 *Data de vencimento:* ${dataVencimento}

💡 Para renovar seu acesso e continuar no grupo, entre em contato.

Não perca! 🚀`;

  const subject = `Aviso de Vencimento - ${daysBeforeExpiry} dias`;

  // Criar registro de notificação
  const notificationId = await createNotificationRecord({
    memberId,
    notificationType: 'expiry_warning',
    daysBeforeExpiry,
    subject,
    message,
  });

  const result = { email: false, telegram: false };

  // Enviar Email se ativo
  if (activeChannels.email && member.email) {
    try {
      const emailSent = await sendEmail({
        to: member.email,
        subject,
        text: message.replace(/\*/g, ''),
        html: message.replace(/\n/g, '<br>').replace(/\*/g, '<strong>').replace(/<strong>/g, '<b>').replace(/<\/strong>/g, '</b>'),
      });
      result.email = emailSent;
      await updateEmailStatus(notificationId, emailSent);
    } catch (error: any) {
      await updateEmailStatus(notificationId, false, error.message);
    }
  }

  // Enviar Telegram se ativo
  if (activeChannels.telegram && member.telegram_user_id) {
    try {
      const telegramResult = await sendPrivateMessage(member.telegram_user_id, message);
      result.telegram = telegramResult.success;
      await updateTelegramStatus(notificationId, telegramResult.success, telegramResult.error);
    } catch (error: any) {
      await updateTelegramStatus(notificationId, false, error.message);
    }
  }

  // Registrar log compatibilidade
  await supabase.from('logs').insert({
    member_id: memberId,
    acao: 'notificacao',
    detalhes: {
      tipo: `expiry_warning_${daysBeforeExpiry}days`,
      notification_id: notificationId,
      email_enviado: result.email,
      telegram_enviado: result.telegram,
    },
    telegram_user_id: member.telegram_user_id,
    telegram_username: member.telegram_username,
    executado_por: 'Sistema (Cron)',
  });

  return {
    success: true,
    message: 'Notificação enviada com sucesso',
    email: result.email,
    telegram: result.telegram,
  };
}

/**
 * Envia notificações para membros que vencem em X dias
 */
export async function sendExpiryNotifications(daysBeforeExpiry: number) {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

  // Buscar membros ativos que vencem nesta data
  // Não usar mais flags de notificação, usar notification_history
  const startDate = targetDate.toISOString().split('T')[0];
  const endDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'ativo')
    .gte('data_vencimento', startDate)
    .lt('data_vencimento', endDate);

  if (error) {
    throw new Error(`Erro ao buscar membros: ${error.message}`);
  }

  if (!members || members.length === 0) {
    return {
      success: true,
      count: 0,
      message: 'Nenhum membro para notificar',
    };
  }

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as Array<{ memberId: string; error: string }>,
  };

  // Enviar notificações
  for (const member of members) {
    try {
      // Verificar se já enviou notificação para este período
      const alreadySent = await checkNotificationSent(
        member.id,
        'expiry_warning',
        daysBeforeExpiry
      );

      if (alreadySent.alreadySent) {
        results.skipped++;
        console.log(`[Notification] Aviso de ${daysBeforeExpiry} dias já enviado para ${member.nome} (${member.id})`);
        continue;
      }

      await sendNotificationToMember(member.id, daysBeforeExpiry);
      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        memberId: member.id,
        error: error.message,
      });
      console.error(`Erro ao notificar membro ${member.id}:`, error);
    }
  }

  return {
    success: true,
    count: members.length,
    results,
  };
}

/**
 * Envia todas as notificações programadas baseadas nas configurações
 */
export async function sendAllScheduledNotifications() {
  // Buscar configurações de avisos do banco
  const config = await getExpiryWarningsConfig();

  if (!config.enabled) {
    console.log('[Notification] Sistema de avisos de vencimento desativado nas configurações');
    return {
      success: true,
      message: 'Sistema de avisos desativado',
      results: {},
    };
  }

  const results: any = {};
  const warnings = config.warnings.filter(w => w.active);

  console.log(`[Notification] Processando ${warnings.length} tipos de avisos: ${warnings.map(w => `${w.days} dias`).join(', ')}`);

  // Enviar notificações para cada período configurado e ativo
  for (const warning of warnings) {
    try {
      const result = await sendExpiryNotifications(warning.days);
      results[`warning_${warning.number}_${warning.days}days`] = result;
      console.log(`[Notification] Aviso ${warning.number} (${warning.days} dias): ${result.count} membros processados`);
    } catch (error: any) {
      console.error(`[Notification] Erro ao processar aviso ${warning.number} (${warning.days} dias):`, error);
      results[`warning_${warning.number}_${warning.days}days`] = {
        success: false,
        error: error.message,
      };
    }
  }

  return {
    success: true,
    warningsProcessed: warnings.length,
    results,
  };
}

/**
 * Envia notificação de pagamento aprovado (Email + Telegram + Link)
 */
export async function sendPaymentApprovedNotification(
  memberId: string,
  inviteLink: string,
  planoDias: number,
  paymentId?: string
): Promise<{ email: boolean; telegram: boolean; notificationId?: string }> {
  const result = { email: false, telegram: false, notificationId: undefined as string | undefined };

  // Buscar dados do membro
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, nome, email, telegram_user_id, telegram_username, data_vencimento')
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    console.error('[Notification] Membro não encontrado:', memberId);
    return result;
  }

  // Verificar canais ativos
  const activeChannels = await getActiveChannels();

  // Verificar se já enviou esta notificação
  const alreadySent = await checkNotificationSent(memberId, 'payment_approved');
  if (alreadySent.alreadySent) {
    console.log(`[Notification] Pagamento aprovado já notificado para membro ${memberId}`);
    return { email: alreadySent.emailSent, telegram: alreadySent.telegramSent };
  }

  // Preparar mensagem
  const message = `🎉 *Pagamento Aprovado!*

Olá *${member.nome}*!

Seu pagamento foi confirmado com sucesso! Bem-vindo ao grupo VIP.

📅 *Plano:* ${planoDias} dias
⏰ *Válido até:* ${member.data_vencimento ? format(new Date(member.data_vencimento), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}

🔗 *Clique no link para entrar:*
${inviteLink}

⚠️ *Importante:*
• Este link é pessoal e intransferível
• Seu acesso expira em ${planoDias} dias
• Você receberá avisos antes do vencimento

Aproveite! 🚀`;

  // Criar registro de notificação
  try {
    const notificationId = await createNotificationRecord({
      memberId,
      paymentId,
      notificationType: 'payment_approved',
      subject: 'Pagamento Aprovado - Acesso Liberado',
      message,
      inviteLink,
    });
    result.notificationId = notificationId;

    // Enviar Email se ativo E membro tem email
    if (activeChannels.email && member.email) {
      try {
        const emailSent = await sendInviteLink({
          to: member.email,
          nome: member.nome,
          inviteLink,
          planoDias,
          dataExpiracao: member.data_vencimento || new Date().toISOString(),
        });

        result.email = emailSent;
        await updateEmailStatus(notificationId, emailSent, emailSent ? undefined : 'Falha ao enviar email');

        console.log(`[Notification] Email para ${member.email}: ${emailSent ? '✓ Sucesso' : '✗ Falha'}`);
      } catch (error: any) {
        console.error('[Notification] Erro ao enviar email:', error);
        await updateEmailStatus(notificationId, false, error.message);
      }
    } else {
      console.log(`[Notification] Email desativado ou membro sem email`);
    }

    // Enviar Telegram se ativo E membro tem telegram_user_id
    if (activeChannels.telegram && member.telegram_user_id) {
      try {
        const telegramResult = await sendPrivateMessage(member.telegram_user_id, message);
        result.telegram = telegramResult.success;

        await updateTelegramStatus(
          notificationId,
          telegramResult.success,
          telegramResult.success ? undefined : telegramResult.error
        );

        console.log(`[Notification] Telegram para ${member.telegram_user_id}: ${telegramResult.success ? '✓ Sucesso' : '✗ Falha'}`);
      } catch (error: any) {
        console.error('[Notification] Erro ao enviar Telegram:', error);
        await updateTelegramStatus(notificationId, false, error.message);
      }
    } else {
      console.log(`[Notification] Telegram desativado ou membro sem telegram_user_id`);
    }

    // Registrar log compatibilidade
    await supabase.from('logs').insert({
      member_id: memberId,
      acao: 'notificacao',
      detalhes: {
        tipo: 'pagamento_aprovado',
        notification_id: notificationId,
        email_ativo: activeChannels.email,
        telegram_ativo: activeChannels.telegram,
        email_enviado: result.email,
        telegram_enviado: result.telegram,
        plano_dias: planoDias,
        link: inviteLink,
      },
      telegram_user_id: member.telegram_user_id,
      telegram_username: member.telegram_username,
      executado_por: 'Sistema',
    });
  } catch (error: any) {
    console.error('[Notification] Erro ao processar notificação:', error);
  }

  return result;
}

/**
 * Envia notificação de pagamento rejeitado
 */
export async function sendPaymentRejectedNotification(
  memberId: string,
  motivo: string
): Promise<{ email: boolean; telegram: boolean }> {
  const result = { email: false, telegram: false };

  // Buscar dados do membro
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, nome, email, telegram_user_id, telegram_username')
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    console.error('[Notification] Membro não encontrado:', memberId);
    return result;
  }

  // Enviar Email
  if (member.email) {
    try {
      result.email = await sendRejectionEmail({
        to: member.email,
        nome: member.nome,
        motivo,
      });

      console.log(`[Notification] Email de rejeição enviado para ${member.email}: ${result.email ? 'Sucesso' : 'Falha'}`);
    } catch (error) {
      console.error('[Notification] Erro ao enviar email de rejeição:', error);
    }
  }

  // Enviar Telegram
  if (member.telegram_user_id) {
    try {
      const message = `❌ *Pagamento Não Aprovado*

Olá *${member.nome}*,

Infelizmente não conseguimos aprovar seu comprovante de pagamento.

📝 *Motivo:*
${motivo}

Por favor, verifique os dados e tente novamente. Se precisar de ajuda, entre em contato.

💡 *Dicas:*
• Certifique-se de que o comprovante está legível
• Verifique se o valor está correto
• Confirme a chave PIX utilizada`;

      const telegramResult = await sendPrivateMessage(member.telegram_user_id, message);
      result.telegram = telegramResult.success;

      console.log(`[Notification] Telegram de rejeição enviado para ${member.telegram_user_id}: ${result.telegram ? 'Sucesso' : 'Falha'}`);
    } catch (error) {
      console.error('[Notification] Erro ao enviar Telegram de rejeição:', error);
    }
  }

  // Registrar log
  await supabase.from('logs').insert({
    member_id: memberId,
    acao: 'notificacao',
    detalhes: {
      tipo: 'pagamento_rejeitado',
      email_enviado: result.email,
      telegram_enviado: result.telegram,
      motivo,
    },
    telegram_user_id: member.telegram_user_id,
    telegram_username: member.telegram_username,
    executado_por: 'Sistema',
  });

  return result;
}

/**
 * Envia broadcast (notícia/aviso) para membros
 */
export async function sendBroadcastNotification(params: {
  subject: string;
  message: string;
  targetAudience: 'all' | 'active' | 'expiring' | 'expired';
  sendEmail: boolean;
  sendTelegram: boolean;
}): Promise<{
  success: boolean;
  totalMembers: number;
  emailsSent: number;
  telegramsSent: number;
  errors: Array<{ memberId: string; error: string }>;
}> {
  const result = {
    success: true,
    totalMembers: 0,
    emailsSent: 0,
    telegramsSent: 0,
    errors: [] as Array<{ memberId: string; error: string }>,
  };

  // Buscar membros de acordo com o público-alvo
  let query = supabase.from('members').select('*');

  switch (params.targetAudience) {
    case 'active':
      query = query.eq('status', 'ativo');
      break;
    case 'expiring':
      // Membros que vencem nos próximos 30 dias
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      query = query
        .eq('status', 'ativo')
        .lte('data_vencimento', in30Days.toISOString());
      break;
    case 'expired':
      query = query.in('status', ['expirado', 'removido']);
      break;
    case 'all':
    default:
      // Todos os membros
      break;
  }

  const { data: members, error } = await query;

  if (error) {
    return {
      ...result,
      success: false,
      errors: [{ memberId: 'query', error: error.message }],
    };
  }

  if (!members || members.length === 0) {
    return result;
  }

  result.totalMembers = members.length;

  // Enviar para cada membro
  for (const member of members) {
    try {
      // Criar registro de notificação
      const notificationId = await createNotificationRecord({
        memberId: member.id,
        notificationType: 'broadcast',
        subject: params.subject,
        message: params.message,
      });

      // Enviar Email
      if (params.sendEmail && member.email) {
        try {
          const emailSent = await sendEmail({
            to: member.email,
            subject: params.subject,
            text: params.message.replace(/\*/g, ''),
            html: params.message
              .replace(/\n/g, '<br>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
          });

          if (emailSent) {
            result.emailsSent++;
          }

          await updateEmailStatus(notificationId, emailSent);
        } catch (error: any) {
          await updateEmailStatus(notificationId, false, error.message);
        }
      }

      // Enviar Telegram
      if (params.sendTelegram && member.telegram_user_id) {
        try {
          const telegramResult = await sendPrivateMessage(
            member.telegram_user_id,
            params.message
          );

          if (telegramResult.success) {
            result.telegramsSent++;
          }

          await updateTelegramStatus(
            notificationId,
            telegramResult.success,
            telegramResult.error
          );
        } catch (error: any) {
          await updateTelegramStatus(notificationId, false, error.message);
        }
      }

      // Log
      await supabase.from('logs').insert({
        member_id: member.id,
        acao: 'notificacao',
        detalhes: {
          tipo: 'broadcast',
          notification_id: notificationId,
          subject: params.subject,
          target_audience: params.targetAudience,
        },
        telegram_user_id: member.telegram_user_id,
        telegram_username: member.telegram_username,
        executado_por: 'Admin (Broadcast)',
      });
    } catch (error: any) {
      result.errors.push({
        memberId: member.id,
        error: error.message,
      });
    }
  }

  return result;
}
