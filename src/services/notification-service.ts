import { getServiceSupabase } from '@/lib/supabase';
import { sendPrivateMessage, formatMessage } from '@/lib/telegram';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const supabase = getServiceSupabase();

/**
 * Obtém template de mensagem da configuração
 */
async function getMessageTemplate(key: string): Promise<string> {
  const { data, error } = await supabase
    .from('config')
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

  if (!member.telegram_user_id) {
    throw new Error('Membro não tem telegram_user_id');
  }

  // Buscar template de mensagem
  const templateKey = `mensagem_notificacao_${daysBeforeExpiry}dias`;
  const template = await getMessageTemplate(templateKey);

  // Formatar data de vencimento
  const dataVencimento = format(
    new Date(member.data_vencimento),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  // Formatar mensagem
  const message = formatMessage(template, {
    nome: member.nome,
    data: dataVencimento,
    dias: daysBeforeExpiry,
  });

  // Enviar mensagem
  const result = await sendPrivateMessage(member.telegram_user_id, message);

  if (!result.success) {
    throw new Error(`Erro ao enviar mensagem: ${result.error}`);
  }

  // Atualizar flag de notificação
  const updateField =
    daysBeforeExpiry === 7
      ? 'notificado_7dias'
      : daysBeforeExpiry === 3
      ? 'notificado_3dias'
      : 'notificado_1dia';

  await supabase
    .from('members')
    .update({ [updateField]: true })
    .eq('id', memberId);

  // Registrar log
  await supabase.from('logs').insert({
    member_id: memberId,
    acao: 'notificacao',
    detalhes: {
      tipo: `${daysBeforeExpiry}_dias`,
      mensagem: message,
    },
    telegram_user_id: member.telegram_user_id,
    telegram_username: member.telegram_username,
    executado_por: 'sistema',
  });

  return {
    success: true,
    message: 'Notificação enviada com sucesso',
  };
}

/**
 * Envia notificações para membros que vencem em X dias
 */
export async function sendExpiryNotifications(daysBeforeExpiry: number) {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

  // Determinar qual flag verificar
  const notificationField =
    daysBeforeExpiry === 7
      ? 'notificado_7dias'
      : daysBeforeExpiry === 3
      ? 'notificado_3dias'
      : 'notificado_1dia';

  // Buscar membros que ainda não foram notificados
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'ativo')
    .eq(notificationField, false)
    .gte('data_vencimento', targetDate.toISOString().split('T')[0])
    .lt(
      'data_vencimento',
      new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    );

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
    errors: [] as Array<{ memberId: string; error: string }>,
  };

  // Enviar notificações
  for (const member of members) {
    try {
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
 * Envia todas as notificações programadas (7, 3 e 1 dia antes)
 */
export async function sendAllScheduledNotifications() {
  const results = {
    day7: await sendExpiryNotifications(7),
    day3: await sendExpiryNotifications(3),
    day1: await sendExpiryNotifications(1),
  };

  return results;
}
