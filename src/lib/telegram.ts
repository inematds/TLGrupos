import { Telegraf, Context } from 'telegraf';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('Missing env.TELEGRAM_BOT_TOKEN');
}

if (!process.env.TELEGRAM_GROUP_ID) {
  throw new Error('Missing env.TELEGRAM_GROUP_ID');
}

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
export const GROUP_ID = parseInt(process.env.TELEGRAM_GROUP_ID);

// Tipos úteis
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

// Funções auxiliares

/**
 * Adiciona um usuário ao grupo através de um invite link
 */
export async function createInviteLink(userId: number, expiresAt?: Date) {
  try {
    const invite = await bot.telegram.createChatInviteLink(GROUP_ID, {
      member_limit: 1, // Link único para 1 pessoa
      expire_date: expiresAt ? Math.floor(expiresAt.getTime() / 1000) : undefined,
    });

    return {
      success: true,
      link: invite.invite_link,
    };
  } catch (error: any) {
    console.error('Erro ao criar invite link:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cria um link de convite genérico para o grupo (sem limite de membros)
 * Use quando não houver telegram_user_id disponível
 */
export async function createGenericInviteLink() {
  try {
    const invite = await bot.telegram.createChatInviteLink(GROUP_ID, {
      // Sem member_limit = link pode ser usado múltiplas vezes
      // Sem expire_date = link permanente
    });

    return {
      success: true,
      link: invite.invite_link,
    };
  } catch (error: any) {
    console.error('Erro ao criar link genérico:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Revoga um link de convite (torna-o inválido)
 */
export async function revokeInviteLink(inviteLink: string) {
  try {
    await bot.telegram.revokeChatInviteLink(GROUP_ID, inviteLink);

    return {
      success: true,
      message: 'Link revogado com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao revogar link:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Remove um membro do grupo
 */
export async function removeMemberFromGroup(userId: number) {
  try {
    await bot.telegram.banChatMember(GROUP_ID, userId);
    // Desbanir imediatamente para permitir que entre novamente se renovar
    await bot.telegram.unbanChatMember(GROUP_ID, userId);

    return {
      success: true,
      message: 'Membro removido com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao remover membro:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Envia mensagem privada para um usuário
 */
export async function sendPrivateMessage(userId: number, message: string) {
  try {
    await bot.telegram.sendMessage(userId, message, {
      parse_mode: 'HTML',
    });

    return {
      success: true,
      message: 'Mensagem enviada com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtém informações do grupo
 */
export async function getGroupInfo() {
  try {
    const chat = await bot.telegram.getChat(GROUP_ID);

    return {
      success: true,
      data: {
        id: chat.id,
        title: 'title' in chat ? chat.title : undefined,
        type: chat.type,
      },
    };
  } catch (error: any) {
    console.error('Erro ao obter info do grupo:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verifica se o bot é admin do grupo
 */
export async function isBotAdmin() {
  try {
    const botInfo = await bot.telegram.getMe();
    const member = await bot.telegram.getChatMember(GROUP_ID, botInfo.id);

    return {
      success: true,
      isAdmin: member.status === 'administrator' || member.status === 'creator',
      status: member.status,
    };
  } catch (error: any) {
    console.error('Erro ao verificar status do bot:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtém informações de um usuário pelo ID
 */
export async function getUserInfo(userId: number): Promise<TelegramUser | null> {
  try {
    const member = await bot.telegram.getChatMember(GROUP_ID, userId);
    return {
      id: member.user.id,
      first_name: member.user.first_name,
      last_name: member.user.last_name,
      username: member.user.username,
    };
  } catch (error) {
    console.error('Erro ao obter info do usuário:', error);
    return null;
  }
}

/**
 * Formata mensagem substituindo placeholders
 */
export function formatMessage(
  template: string,
  data: {
    nome: string;
    data?: string;
    dias?: number;
  }
): string {
  return template
    .replace(/{nome}/g, data.nome)
    .replace(/{data}/g, data.data || '')
    .replace(/{dias}/g, data.dias?.toString() || '');
}

/**
 * Busca todos os administradores do grupo
 * Nota: A Bot API do Telegram não permite listar todos os membros por privacidade,
 * apenas administradores. Para membros regulares, use getGroupMembersByIds()
 */
export async function getGroupAdministrators() {
  try {
    const admins = await bot.telegram.getChatAdministrators(GROUP_ID);

    return {
      success: true,
      data: admins.map(admin => ({
        id: admin.user.id,
        first_name: admin.user.first_name,
        last_name: admin.user.last_name,
        username: admin.user.username,
        status: admin.status,
        is_bot: admin.user.is_bot,
      })),
    };
  } catch (error: any) {
    console.error('Erro ao buscar administradores:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Busca informações de múltiplos membros pelos IDs
 * Use esta função com uma lista de IDs de membros conhecidos
 */
export async function getGroupMembersByIds(userIds: number[]) {
  try {
    const members = [];

    for (const userId of userIds) {
      try {
        const member = await bot.telegram.getChatMember(GROUP_ID, userId);

        // Só adiciona se for membro ativo
        if (member.status === 'member' || member.status === 'administrator' || member.status === 'creator') {
          members.push({
            id: member.user.id,
            first_name: member.user.first_name,
            last_name: member.user.last_name,
            username: member.user.username,
            status: member.status,
            is_bot: member.user.is_bot,
          });
        }
      } catch (err) {
        console.error(`Erro ao buscar membro ${userId}:`, err);
      }
    }

    return {
      success: true,
      data: members,
    };
  } catch (error: any) {
    console.error('Erro ao buscar membros:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtém o número total de membros do grupo
 */
export async function getGroupMemberCount() {
  try {
    const count = await bot.telegram.getChatMembersCount(GROUP_ID);

    return {
      success: true,
      count,
    };
  } catch (error: any) {
    console.error('Erro ao contar membros:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
