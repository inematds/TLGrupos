import { promises as fs } from 'fs';
import path from 'path';

/**
 * Atualiza o arquivo .env.local com os IDs dos grupos ativos
 */
export async function updateTelegramGroupsInEnv(groupIds: string[]) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');

    console.log('[Update Env] Atualizando .env.local...');
    console.log('[Update Env] Grupos ativos:', groupIds);

    // Ler arquivo atual
    let envContent = await fs.readFile(envPath, 'utf-8');

    // Criar nova linha com grupos
    const newGroupLine = `TELEGRAM_GROUP_ID=${groupIds.join(',')}`;

    // Verificar se já existe a variável
    const groupIdRegex = /^TELEGRAM_GROUP_ID=.*$/m;

    if (groupIdRegex.test(envContent)) {
      // Substituir linha existente
      envContent = envContent.replace(groupIdRegex, newGroupLine);
      console.log('[Update Env] Variável TELEGRAM_GROUP_ID atualizada');
    } else {
      // Adicionar no final do arquivo
      envContent = envContent.trim() + '\n' + newGroupLine + '\n';
      console.log('[Update Env] Variável TELEGRAM_GROUP_ID adicionada');
    }

    // Escrever arquivo
    await fs.writeFile(envPath, envContent, 'utf-8');

    console.log('[Update Env] ✅ .env.local atualizado com sucesso!');
    console.log('[Update Env] Nova configuração:', newGroupLine);

    return { success: true };
  } catch (error: any) {
    console.error('[Update Env] ❌ Erro ao atualizar .env.local:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca todos os grupos ativos no banco e retorna os IDs do Telegram
 */
export async function getActiveGroupIds() {
  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('telegram_groups')
      .select('telegram_group_id')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (error) {
      console.error('[Get Active Groups] Erro:', error);
      return { success: false, error: error.message };
    }

    const groupIds = data?.map(g => g.telegram_group_id) || [];

    console.log('[Get Active Groups] Encontrados', groupIds.length, 'grupos ativos');

    return { success: true, groupIds };
  } catch (error: any) {
    console.error('[Get Active Groups] Erro:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sincroniza grupos do banco com o .env.local
 */
export async function syncGroupsToEnv() {
  console.log('[Sync Groups] Iniciando sincronização...');

  // Buscar grupos ativos
  const result = await getActiveGroupIds();

  if (!result.success || !result.groupIds) {
    console.error('[Sync Groups] Falha ao buscar grupos:', result.error);
    return { success: false, error: result.error };
  }

  // Se não houver grupos ativos, usar valor padrão
  if (result.groupIds.length === 0) {
    console.warn('[Sync Groups] ⚠️ Nenhum grupo ativo encontrado! Mantendo configuração atual.');
    return { success: true, warning: 'No active groups' };
  }

  // Atualizar .env.local
  const updateResult = await updateTelegramGroupsInEnv(result.groupIds);

  if (!updateResult.success) {
    console.error('[Sync Groups] Falha ao atualizar .env:', updateResult.error);
    return { success: false, error: updateResult.error };
  }

  console.log('[Sync Groups] ✅ Sincronização concluída!');

  return {
    success: true,
    groupsCount: result.groupIds.length,
    groupIds: result.groupIds,
  };
}
