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
  email?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('members')
    .select('*, telegram_groups(nome)', { count: 'exact' });

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

  // Busca por email específico (prioridade sobre search)
  if (filters?.email) {
    query = query.eq('email', filters.email);
  } else if (filters?.search) {
    query = query.or(
      `nome.ilike.%${filters.search}%,telegram_username.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
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

  // Mapear os dados para incluir grupo_nome
  const membersWithGroupName = data?.map((member: any) => ({
    ...member,
    grupo_nome: member.telegram_groups?.nome || null,
    telegram_groups: undefined, // Remove o objeto aninhado
  }));

  return {
    data: membersWithGroupName as Member[],
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

  if (input.telegram_user_id && dataVencimento) {
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
 * Marca membro como removido (remove do grupo mas mantém no banco)
 * Usado quando: sistema remove do grupo, não está em grupo, ou erro de remoção
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

  // Marcar como removido no banco (mas NÃO deleta)
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
 * Exclui permanentemente um membro do banco de dados
 * ATENÇÃO: Esta ação é irreversível
 * Remove manualmente todos os logs e pagamentos associados antes de deletar o membro
 */
export async function deleteMember(id: string) {
  const member = await getMemberById(id);

  if (!member) {
    throw new Error('Membro não encontrado');
  }

  console.log(`[deleteMember] Deletando membro ${member.nome} (${id}) e todos os registros relacionados`);

  // 1. Primeiro, setar member_id como NULL nos logs (para desvincular)
  const { error: logsUpdateError } = await supabase
    .from('logs')
    .update({ member_id: null })
    .eq('member_id', id);

  if (logsUpdateError) {
    console.error('[deleteMember] Erro ao desvincular logs:', logsUpdateError);
    // Tentar deletar os logs diretamente
    const { error: logsDeleteError } = await supabase
      .from('logs')
      .delete()
      .eq('member_id', id);

    if (logsDeleteError) {
      console.error('[deleteMember] Erro ao deletar logs:', logsDeleteError);
    }
  } else {
    console.log(`[deleteMember] Logs do membro ${id} desvinculados`);
  }

  // 2. Setar member_id como NULL nos pagamentos
  const { error: paymentsUpdateError } = await supabase
    .from('payments')
    .update({ member_id: null })
    .eq('member_id', id);

  if (paymentsUpdateError) {
    console.error('[deleteMember] Erro ao desvincular pagamentos:', paymentsUpdateError);
    // Tentar deletar os pagamentos diretamente
    const { error: paymentsDeleteError } = await supabase
      .from('payments')
      .delete()
      .eq('member_id', id);

    if (paymentsDeleteError) {
      console.error('[deleteMember] Erro ao deletar pagamentos:', paymentsDeleteError);
    }
  } else {
    console.log(`[deleteMember] Pagamentos do membro ${id} desvinculados`);
  }

  // 3. Desvincular convites relacionados (se existir a tabela)
  await supabase
    .from('invites')
    .update({ member_id: null })
    .eq('member_id', id);

  // 4. Finalmente, deletar o membro
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteMember] Erro ao deletar membro:', error);
    console.error('[deleteMember] Detalhes do erro:', JSON.stringify(error, null, 2));
    throw new Error(`Erro ao excluir membro: ${error.message}`);
  }

  console.log(`[deleteMember] Membro ${id} e todos os registros relacionados foram excluídos permanentemente`);
  return {
    success: true,
    message: 'Membro e todos os registros relacionados (logs, pagamentos) foram excluídos permanentemente'
  };
}

/**
 * Obtém estatísticas gerais
 * Calcula diretamente da tabela members para garantir dados atualizados
 */
export async function getStats() {
  // Buscar todos os membros diretamente (não usar view que pode estar desatualizada)
  const { data: allMembers, error: membersError } = await supabase
    .from('members')
    .select('id, status, telegram_user_id, data_vencimento, no_grupo');

  if (membersError) {
    throw new Error(`Erro ao buscar membros: ${membersError.message}`);
  }

  const members = allMembers || [];
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Calcular estatísticas em tempo real
  const stats = {
    total_cadastros: members.length,
    total_ativos: members.filter(m => m.status === 'ativo').length,
    total_vencidos: members.filter(m => m.status === 'vencido').length,
    total_removidos: members.filter(m => m.status === 'removido').length,
    erro_remocao: members.filter(m => m.status === 'erro_remocao').length,
    total_pausados: members.filter(m => m.status === 'pausado').length,
    ativos_no_grupo: members.filter(m => m.status === 'ativo' && m.no_grupo === true).length,
    ativos_sem_grupo: members.filter(m => m.status === 'ativo' && m.no_grupo === false).length,
    ativos_sem_telegram: members.filter(m => m.status === 'ativo' && m.telegram_user_id === null).length,
    sem_telegram_user_id: members.filter(m => m.status === 'ativo' && m.telegram_user_id === null).length,
    vencendo_7dias: members.filter(m => {
      if (m.status !== 'ativo') return false;
      const vencimento = new Date(m.data_vencimento);
      return vencimento >= now && vencimento <= sevenDaysFromNow;
    }).length,
    ativos_mas_vencidos: members.filter(m => {
      if (m.status !== 'ativo') return false;
      const vencimento = new Date(m.data_vencimento);
      return vencimento < now;
    }).length,
  };

  return stats as Stats;
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
