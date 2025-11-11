import { getServiceSupabase } from '@/lib/supabase';
import { Member, CreateMemberInput, UpdateMemberInput, Stats } from '@/types';
import { createInviteLink, removeMemberFromGroup, getUserInfo } from '@/lib/telegram';

const supabase = getServiceSupabase();

/**
 * Lista todos os membros com filtros opcionais
 */
export async function getMembers(filters?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase.from('members').select('*', { count: 'exact' });

  // Filtro especial: "requer_atencao" mostra tudo EXCETO ativos normais
  if (filters?.status === 'requer_atencao') {
    // Buscar membros que requerem atenção:
    // - Ativos vencidos (data_vencimento < NOW)
    // - Erro de remoção
    // - Removidos
    // - Pausados
    // - Ativos que vencem em 7 dias ou menos
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    query = query.or(
      `status.eq.erro_remocao,status.eq.removido,status.eq.pausado,and(status.eq.ativo,data_vencimento.lte.${sevenDaysFromNow.toISOString()})`
    );
  } else if (filters?.status === 'vencido') {
    // Filtro virtual: buscar membros ATIVOS com data vencida
    query = query.eq('status', 'ativo').lt('data_vencimento', new Date().toISOString());
  } else if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `nome.ilike.%${filters.search}%,telegram_username.ilike.%${filters.search}%`
    );
  }

  query = query.order('data_vencimento', { ascending: true });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao buscar membros: ${error.message}`);
  }

  return {
    data: data as Member[],
    total: count || 0,
  };
}

/**
 * Busca um membro pelo ID
 */
export async function getMemberById(id: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar membro: ${error.message}`);
  }

  return data as Member;
}

/**
 * Busca um membro pelo telegram_user_id
 */
export async function getMemberByTelegramId(telegramUserId: number) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = não encontrado
    throw new Error(`Erro ao buscar membro: ${error.message}`);
  }

  return data as Member | null;
}

/**
 * Cria um novo membro e gera invite link
 */
export async function createMember(input: CreateMemberInput & { dias_acesso?: number }) {
  // Se forneceu telegram_user_id, buscar informações do usuário
  let telegramInfo = null;
  if (input.telegram_user_id) {
    telegramInfo = await getUserInfo(input.telegram_user_id);
  }

  // Calcular data de vencimento baseado no plano ou dias_acesso
  let dataVencimento = input.data_vencimento;

  // Se forneceu plan_id, buscar plano e calcular data de vencimento
  if (input.plan_id && !input.data_vencimento) {
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('duracao_dias')
      .eq('id', input.plan_id)
      .single();

    if (!planError && plan) {
      const hoje = new Date();
      const vencimento = new Date(hoje);
      vencimento.setDate(vencimento.getDate() + plan.duracao_dias);
      dataVencimento = vencimento.toISOString();
    }
  } else if (input.dias_acesso && !input.data_vencimento) {
    // Fallback para dias_acesso (compatibilidade)
    const hoje = new Date();
    const vencimento = new Date(hoje);
    vencimento.setDate(vencimento.getDate() + input.dias_acesso);
    dataVencimento = vencimento.toISOString();
  }

  // Criar membro no banco
  const { data, error } = await supabase
    .from('members')
    .insert({
      nome: input.nome,
      email: input.email,
      telefone: input.telefone,
      telegram_user_id: input.telegram_user_id,
      telegram_username: input.telegram_username || telegramInfo?.username,
      telegram_first_name: telegramInfo?.first_name,
      telegram_last_name: telegramInfo?.last_name,
      data_vencimento: dataVencimento,
      plan_id: input.plan_id,
      observacoes: input.observacoes,
      status: 'ativo',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar membro: ${error.message}`);
  }

  const member = data as Member;

  // Gerar invite link se tiver telegram_user_id
  let inviteLink = null;
  let linkType: 'unique' | 'generic' | null = null;

  if (input.telegram_user_id) {
    const linkResult = await createInviteLink(
      input.telegram_user_id,
      new Date(dataVencimento)
    );

    if (linkResult.success) {
      inviteLink = linkResult.link;
      linkType = 'unique';
    }
  }

  // Salvar link no membro se foi gerado
  if (inviteLink && linkType) {
    await supabase
      .from('members')
      .update({
        invite_link: inviteLink,
        invite_link_type: linkType,
        invite_link_revoked: false,
      })
      .eq('id', member.id);
  }

  return {
    member,
    inviteLink,
  };
}

/**
 * Atualiza um membro
 */
export async function updateMember(id: string, input: UpdateMemberInput) {
  const { data, error } = await supabase
    .from('members')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar membro: ${error.message}`);
  }

  return data as Member;
}

/**
 * Renova a assinatura de um membro
 */
export async function renewMember(id: string, newExpiryDate: string) {
  const { data, error } = await supabase
    .from('members')
    .update({
      data_vencimento: newExpiryDate,
      status: 'ativo',
      notificado_7dias: false,
      notificado_3dias: false,
      notificado_1dia: false,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao renovar membro: ${error.message}`);
  }

  // Registrar log de renovação
  await supabase.from('logs').insert({
    member_id: id,
    acao: 'renovacao',
    detalhes: { nova_data_vencimento: newExpiryDate },
    executado_por: 'admin',
  });

  return data as Member;
}

/**
 * Remove um membro (marca como removido e remove do grupo)
 */
export async function removeMember(id: string) {
  const member = await getMemberById(id);

  if (!member) {
    throw new Error('Membro não encontrado');
  }

  // Remover do grupo Telegram
  if (member.telegram_user_id) {
    const result = await removeMemberFromGroup(member.telegram_user_id);
    if (!result.success) {
      console.error('Erro ao remover do Telegram:', result.error);
    }
  }

  // Marcar como removido no banco
  const { data, error } = await supabase
    .from('members')
    .update({ status: 'removido' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao remover membro: ${error.message}`);
  }

  return data as Member;
}

/**
 * Obtém estatísticas gerais
 */
export async function getStats() {
  const { data, error } = await supabase.from('stats').select('*').single();

  if (error) {
    throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
  }

  return data as Stats;
}

/**
 * Obtém membros expirando em breve
 */
export async function getMembersExpiringSoon(days: number = 7) {
  const { data, error } = await supabase
    .from('members_expiring_soon')
    .select('*')
    .lte('dias_restantes', days);

  if (error) {
    throw new Error(`Erro ao buscar membros expirando: ${error.message}`);
  }

  return data;
}

/**
 * Obtém membros já vencidos
 */
export async function getMembersExpired() {
  const { data, error } = await supabase.from('members_expired').select('*');

  if (error) {
    throw new Error(`Erro ao buscar membros vencidos: ${error.message}`);
  }

  return data;
}
