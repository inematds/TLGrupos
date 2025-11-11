import { getServiceSupabase } from '@/lib/supabase';
import { removeMemberFromGroup, createInviteLink } from '@/lib/telegram';

const supabase = getServiceSupabase();

/**
 * Remove membros que já venceram do grupo Telegram
 * Status 'vencido' é calculado dinamicamente (data_vencimento < NOW)
 * Esta função apenas remove do Telegram e atualiza status para 'removido'
 */
export async function removeExpiredMembers() {
  // Buscar membros ATIVOS com data de vencimento já passada
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'ativo')
    .lt('data_vencimento', new Date().toISOString());

  if (error) {
    throw new Error(`Erro ao buscar membros vencidos: ${error.message}`);
  }

  if (!members || members.length === 0) {
    return {
      success: true,
      count: 0,
      message: 'Nenhum membro vencido para remover',
    };
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ memberId: string; error: string }>,
  };

  // Remover cada membro
  for (const member of members) {
    try {
      // Remover do grupo Telegram
      if (member.telegram_user_id) {
        const result = await removeMemberFromGroup(member.telegram_user_id);
        if (!result.success) {
          throw new Error(result.error || 'Erro ao remover do Telegram');
        }
      }

      // Atualizar status no banco para "removido" (removido com sucesso)
      await supabase
        .from('members')
        .update({ status: 'removido' })
        .eq('id', member.id);

      // Registrar log
      await supabase.from('logs').insert({
        member_id: member.id,
        acao: 'remocao',
        detalhes: {
          motivo: 'vencimento',
          data_vencimento: member.data_vencimento,
          removido_do_telegram: true,
        },
        telegram_user_id: member.telegram_user_id,
        telegram_username: member.telegram_username,
        executado_por: 'cron',
      });

      results.success++;
    } catch (error: any) {
      // Falhou ao remover do Telegram - marcar com status especial
      await supabase
        .from('members')
        .update({
          status: 'erro_remocao',
          observacoes: `Erro ao remover do Telegram: ${error.message}`
        })
        .eq('id', member.id);

      // Registrar log do erro
      await supabase.from('logs').insert({
        member_id: member.id,
        acao: 'erro_remocao',
        detalhes: {
          motivo: 'vencimento',
          data_vencimento: member.data_vencimento,
          erro: error.message,
          removido_do_telegram: false,
        },
        telegram_user_id: member.telegram_user_id,
        telegram_username: member.telegram_username,
        executado_por: 'cron',
      });

      results.failed++;
      results.errors.push({
        memberId: member.id,
        error: error.message,
      });
      console.error(`Erro ao remover membro ${member.id}:`, error);
    }
  }

  return {
    success: true,
    count: members.length,
    results,
  };
}


/**
 * Inclui membros elegíveis no grupo automaticamente
 */
export async function includeEligibleMembers() {
  // Buscar membros elegíveis (ativos com telegram_user_id e não vencidos)
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'ativo')
    .not('telegram_user_id', 'is', null)
    .gte('data_vencimento', new Date().toISOString());

  if (error) {
    throw new Error(`Erro ao buscar membros elegíveis: ${error.message}`);
  }

  if (!members || members.length === 0) {
    return {
      success: true,
      count: 0,
      message: 'Nenhum membro elegível para inclusão',
    };
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ memberId: string; error: string }>,
  };

  // Incluir cada membro
  for (const member of members) {
    try {
      // Criar invite link
      const linkResult = await createInviteLink(
        member.telegram_user_id,
        new Date(member.data_vencimento)
      );

      if (!linkResult.success) {
        throw new Error(linkResult.error || 'Erro ao criar invite link');
      }

      // Registrar log de inclusão
      await supabase.from('logs').insert({
        member_id: member.id,
        acao: 'adicao',
        detalhes: {
          invite_link: linkResult.link,
          via: 'cron_inclusao_automatica',
          data_vencimento: member.data_vencimento,
        },
        telegram_user_id: member.telegram_user_id,
        telegram_username: member.telegram_username,
        executado_por: 'cron',
      });

      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        memberId: member.id,
        error: error.message,
      });
      console.error(`Erro ao incluir membro ${member.id}:`, error);
    }
  }

  return {
    success: true,
    count: members.length,
    results,
  };
}

/**
 * Executa todas as tarefas de manutenção diária
 * Nota: Status 'vencido' é calculado dinamicamente, não precisa atualização
 */
export async function runDailyMaintenance() {
  const results = {
    expiredMembers: await removeExpiredMembers(),
    includedMembers: await includeEligibleMembers(),
    timestamp: new Date().toISOString(),
  };

  // Registrar execução no log
  await supabase.from('logs').insert({
    acao: 'manutencao_diaria',
    detalhes: results,
    executado_por: 'cron',
  });

  return results;
}
