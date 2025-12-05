import { getServiceSupabase } from './supabase';

const supabase = getServiceSupabase();

/**
 * Obtém o ID do grupo principal configurado no banco
 * Retorna o primeiro grupo do .env.local como fallback
 */
export async function getMainGroupId(): Promise<number> {
  try {
    // Buscar do banco
    const { data, error } = await supabase
      .from('config')
      .select('valor')
      .eq('chave', 'bot_grupo_principal')
      .single();

    if (!error && data?.valor) {
      const groupId = parseInt(data.valor);
      if (!isNaN(groupId)) {
        return groupId;
      }
    }
  } catch (error) {
    console.warn('[Config] Erro ao buscar grupo principal do banco:', error);
  }

  // Fallback: usar o primeiro grupo do .env.local
  if (process.env.TELEGRAM_GROUP_ID) {
    const firstGroupId = process.env.TELEGRAM_GROUP_ID.split(',')[0].trim();
    const parsedId = parseInt(firstGroupId);
    if (!isNaN(parsedId)) {
      return parsedId;
    }
  }

  // Último fallback: retornar o grupo padrão
  return -1002242190548;
}

/**
 * Obtém uma configuração específica do banco
 */
export async function getConfig(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('valor')
      .eq('chave', key)
      .single();

    if (!error && data?.valor) {
      return data.valor;
    }
  } catch (error) {
    console.warn(`[Config] Erro ao buscar config ${key}:`, error);
  }

  return null;
}
