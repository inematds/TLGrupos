// @ts-nocheck
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { getServiceSupabase } from './supabase';
import { getMemberByTelegramId } from '@/services/member-service';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('Missing env.TELEGRAM_BOT_TOKEN');
}

if (!process.env.TELEGRAM_GROUP_ID) {
  throw new Error('Missing env.TELEGRAM_GROUP_ID');
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Suporte a múltiplos grupos
const GROUP_IDS = process.env.TELEGRAM_GROUP_ID!
  .split(',')
  .map(id => parseInt(id.trim()))
  .filter(id => !isNaN(id));

const GROUP_ID = GROUP_IDS[0]; // Manter compatibilidade
const supabase = getServiceSupabase();

console.log(`🤖 [Webhook] Monitorando ${GROUP_IDS.length} grupo(s):`, GROUP_IDS);

// Configuração padrão
const DEFAULT_EXPIRY_DAYS = 30;

/**
 * Busca a URL configurada para o formulário de cadastro
 */
async function getCadastroUrl(): Promise<string> {
  try {
    const { data: configs } = await supabase
      .from('system_config')
      .select('chave, valor')
      .in('chave', ['cadastro_url', 'cadastro_externo']);

    if (configs && configs.length > 0) {
      const cadastroUrlConfig = configs.find(c => c.chave === 'cadastro_url');
      const cadastroExternoConfig = configs.find(c => c.chave === 'cadastro_externo');

      // Se configurado para usar URL externa
      if (cadastroExternoConfig?.valor === 'true' && cadastroUrlConfig?.valor) {
        return cadastroUrlConfig.valor;
      }
    }
  } catch (error) {
    console.error('Erro ao buscar URL de cadastro do banco:', error);
  }

  // Fallback: usar URL do sistema
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://157.180.72.42';
  return `${baseUrl}/cadastro`;
}

/**
 * Auto-cadastra um membro quando detectado
 */
async function autoRegisterMember(
  userId: number,
  firstName: string,
  lastName?: string,
  username?: string,
  chatId?: number
) {
  try {
    // Verificar se já existe
    const existing = await getMemberByTelegramId(userId);
    if (existing) {
      console.log(`[Auto-Register] Membro ${firstName} já cadastrado`);
      return { success: true, alreadyExists: true };
    }

    // Buscar group_id baseado no telegram_group_id (chatId)
    let groupId = null;
    if (chatId) {
      const { data: groupData } = await supabase
        .from('telegram_groups')
        .select('id')
        .eq('telegram_group_id', chatId.toString())
        .single();

      if (groupData) {
        groupId = groupData.id;
        console.log(`[Auto-Register] Grupo encontrado: ${groupId}`);
      }
    }

    // Calcular data de vencimento
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + DEFAULT_EXPIRY_DAYS);

    // Criar membro
    const { data, error } = await supabase.from('members').insert({
      telegram_user_id: userId,
      telegram_username: username || null,
      telegram_first_name: firstName,
      telegram_last_name: lastName || null,
      nome: `${firstName}${lastName ? ' ' + lastName : ''}`,
      data_vencimento: expiryDate.toISOString(),
      status: 'ativo',
      group_id: groupId, // Registrar grupo de origem
    }).select().single();

    if (error) {
      console.error(`[Auto-Register] Erro ao cadastrar ${firstName}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Auto-Register] ✅ ${firstName} cadastrado! Vence em ${expiryDate.toLocaleDateString()}`);

    // Registrar log
    await supabase.from('logs').insert({
      member_id: data.id,
      acao: 'auto_cadastro',
      detalhes: { origem: 'webhook', firstName, username },
      executado_por: 'sistema',
    });

    return { success: true, member: data };
  } catch (error: any) {
    console.error('[Auto-Register] Erro:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handler para novos membros entrando no grupo
 */
bot.on('new_chat_members', async (ctx) => {
  const chatId = ctx.chat.id;

  // Só processar se for um dos grupos monitorados
  if (!GROUP_IDS.includes(chatId)) return;

  const newMembers = ctx.message.new_chat_members;

  for (const member of newMembers) {
    // Ignorar bots
    if (member.is_bot) continue;

    console.log(`[Webhook] Novo membro entrou: ${member.first_name} (${member.id})`);

    // Capturar o link de convite usado (se disponível)
    const inviteLinkUsed = (ctx.message as any).invite_link?.invite_link;
    console.log(`[Webhook] Link usado: ${inviteLinkUsed || 'desconhecido'}`);

    // Verificar se o membro já existe no banco pelo telegram_user_id
    let existing = await getMemberByTelegramId(member.id);

    // Se não encontrou por ID, tentar por telegram_username
    if (!existing && member.username) {
      console.log(`[Webhook] Não encontrado por ID, buscando por username: @${member.username}`);
      const { data } = await supabase
        .from('members')
        .select('*')
        .ilike('telegram_username', member.username)
        .single();
      existing = data;

      if (existing) {
        console.log(`[Webhook] Encontrado por username! Vinculando telegram_user_id`);
      }
    }

    // Se não encontrou ainda, tentar pelo invite_link usado
    if (!existing && inviteLinkUsed) {
      console.log(`[Webhook] Não encontrado, buscando por invite_link: ${inviteLinkUsed}`);
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('invite_link', inviteLinkUsed)
        .single();
      existing = data;

      if (existing) {
        console.log(`[Webhook] Encontrado pelo link! Vinculando telegram_user_id`);
      }
    }

    if (existing) {
      // Verificar se o membro estava removido e precisa ser reativado
      const foiRemovido = existing.status === 'removido';

      // Preparar dados de atualização
      const updateData: any = {
        no_grupo: true,
        telegram_user_id: member.id, // Vincular/atualizar ID
        telegram_username: member.username || null,
        telegram_first_name: member.first_name,
        telegram_last_name: member.last_name || null,
      };

      // Se estava removido, reativar automaticamente
      if (foiRemovido) {
        console.log(`[Webhook] Membro ${member.first_name} estava removido. Reativando automaticamente...`);

        // Calcular nova data de vencimento (+ 30 dias)
        const hoje = new Date();
        const novaDataVencimento = new Date(hoje);
        novaDataVencimento.setDate(novaDataVencimento.getDate() + DEFAULT_EXPIRY_DAYS);

        updateData.status = 'ativo';
        updateData.data_vencimento = novaDataVencimento.toISOString();
        updateData.notificado_7dias = false;
        updateData.notificado_3dias = false;
        updateData.notificado_1dia = false;
      }

      // Atualizar dados do Telegram e reativar se necessário
      await supabase
        .from('members')
        .update(updateData)
        .eq('id', existing.id);

      if (foiRemovido) {
        console.log(`[Webhook] Membro reativado com sucesso! Nova data de vencimento: ${updateData.data_vencimento}`);

        // Enviar mensagem de boas-vindas para membro reativado
        try {
          await ctx.reply(
            `🎉 Bem-vindo(a) de volta, ${member.first_name}!\n\n` +
            `Seu acesso foi reativado automaticamente.\n` +
            `Você tem mais ${DEFAULT_EXPIRY_DAYS} dias de acesso.\n\n` +
            `Use /status para verificar seu cadastro.`
          );
        } catch (err) {
          console.error('[Webhook] Erro ao enviar mensagem de reativação:', err);
        }
      } else {
        console.log(`[Webhook] Membro ${member.first_name} atualizado: no_grupo=true, telegram_user_id=${member.id}`);
      }

      // Marcar link como usado (já expira automaticamente pelo Telegram)
      if (existing.invite_link && inviteLinkUsed === existing.invite_link) {
        await supabase
          .from('members')
          .update({ invite_link_revoked: true })
          .eq('id', existing.id);

        console.log(`[Webhook] Link marcado como usado (expira automaticamente)`);
      }

      // Registrar log de entrada
      await supabase.from('logs').insert({
        member_id: existing.id,
        acao: foiRemovido ? 'reativacao_automatica' : 'entrada_grupo',
        detalhes: {
          first_name: member.first_name,
          username: member.username,
          foi_removido: foiRemovido,
          nova_data_vencimento: foiRemovido ? updateData.data_vencimento : null,
        },
        telegram_user_id: member.id,
        telegram_username: member.username,
        executado_por: 'sistema',
      });
    } else {
      // Auto-cadastrar se não existir
      const result = await autoRegisterMember(
        member.id,
        member.first_name,
        member.last_name,
        member.username,
        chatId // Registrar grupo de origem
      );

      if (result.success && !result.alreadyExists) {
        // Marcar como no grupo
        if (result.member) {
          await supabase
            .from('members')
            .update({ no_grupo: true })
            .eq('id', result.member.id);
        }

        // Enviar mensagem de boas-vindas
        try {
          await ctx.reply(
            `🎉 Bem-vindo(a) ${member.first_name}!\n\n` +
            `Você foi cadastrado automaticamente no sistema.\n` +
            `Seu acesso expira em ${DEFAULT_EXPIRY_DAYS} dias.\n\n` +
            `Use /status para verificar seu cadastro.`
          );
        } catch (err) {
          console.error('[Webhook] Erro ao enviar boas-vindas:', err);
        }
      }
    }
  }
});

/**
 * Handler para membros saindo do grupo
 */
bot.on('left_chat_member', async (ctx) => {
  const chatId = ctx.chat.id;

  // Só processar se for um dos grupos monitorados
  if (!GROUP_IDS.includes(chatId)) return;

  const leftMember = ctx.message.left_chat_member;

  // Ignorar bots
  if (leftMember.is_bot) return;

  console.log(`[Webhook] Membro saiu: ${leftMember.first_name} (${leftMember.id})`);

  // Verificar se o membro existe no banco
  const existing = await getMemberByTelegramId(leftMember.id);

  if (existing) {
    // Atualizar para marcar que NÃO está mais no grupo
    await supabase
      .from('members')
      .update({ no_grupo: false })
      .eq('id', existing.id);

    console.log(`[Webhook] Membro ${leftMember.first_name} marcado como no_grupo = false`);

    // Registrar log de saída
    await supabase.from('logs').insert({
      member_id: existing.id,
      acao: 'saida_grupo',
      detalhes: {
        first_name: leftMember.first_name,
        username: leftMember.username,
        tipo: 'saida_voluntaria',
      },
      telegram_user_id: leftMember.id,
      telegram_username: leftMember.username,
      executado_por: 'sistema',
    });
  }
});

/**
 * Comando /cadastro - Envia link personalizado para cadastro completo
 */
bot.command('cadastro', async (ctx) => {
  const user = ctx.from;

  console.log(`[Comando] /cadastro de ${user.first_name} (${user.id})`);

  // Buscar URL configurada no banco
  const baseUrl = await getCadastroUrl();

  // Adicionar parâmetros do Telegram
  const cadastroUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}telegram_id=${user.id}&username=${user.username || ''}&nome=${encodeURIComponent(user.first_name + (user.last_name ? ' ' + user.last_name : ''))}`;

  console.log(`[Cadastro] URL gerada: ${cadastroUrl}`);

  const mensagemTexto =
    `📝 Cadastro Completo\n\n` +
    `Olá ${user.first_name}! 👋\n\n` +
    `Para completar seu cadastro, COPIE e COLE o link abaixo no navegador:\n\n` +
    `${cadastroUrl}\n\n` +
    `📱 Ou toque LONGO no link acima e escolha "Abrir"\n\n` +
    `✅ Seus dados do Telegram já estão vinculados!\n` +
    `📋 Basta preencher suas informações pessoais.\n` +
    `⚡ O processo leva menos de 2 minutos!`;

  // Calcular posição do link na mensagem
  const linkInicio = mensagemTexto.indexOf(cadastroUrl);
  const linkFim = linkInicio + cadastroUrl.length;

  // Enviar com entities para forçar link clicável
  await ctx.telegram.sendMessage(
    ctx.chat.id,
    mensagemTexto,
    {
      reply_to_message_id: ctx.message.message_id,
      entities: [
        {
          type: 'text_link',
          offset: linkInicio,
          length: cadastroUrl.length,
          url: cadastroUrl
        }
      ]
    }
  );
});

/**
 * Comando /registrar - Registro voluntário
 */
bot.command('registrar', async (ctx) => {
  const user = ctx.from;
  const chatId = ctx.chat.id;

  console.log(`[Comando] /registrar de ${user.first_name} (${user.id})`);

  // Verificar se já está cadastrado
  const existing = await getMemberByTelegramId(user.id);

  if (existing) {
    const vencimento = new Date(existing.data_vencimento);
    const hoje = new Date();
    const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    await ctx.reply(
      `✅ Você já está cadastrado!\n\n` +
      `📅 Vencimento: ${vencimento.toLocaleDateString('pt-BR')}\n` +
      `⏰ Dias restantes: ${diasRestantes > 0 ? diasRestantes : 'VENCIDO'}\n` +
      `📊 Status: ${existing.status}\n\n` +
      `Use /status para mais informações.`
    );
    return;
  }

  // Registrar novo membro
  const result = await autoRegisterMember(
    user.id,
    user.first_name,
    user.last_name,
    user.username,
    chatId // Registrar grupo de origem
  );

  if (result.success) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + DEFAULT_EXPIRY_DAYS);

    await ctx.reply(
      `🎉 Cadastro realizado com sucesso!\n\n` +
      `👤 Nome: ${user.first_name}\n` +
      `🆔 ID: ${user.id}\n` +
      `📅 Vencimento: ${expiryDate.toLocaleDateString('pt-BR')}\n` +
      `⏰ Dias: ${DEFAULT_EXPIRY_DAYS} dias\n\n` +
      `✅ Seu acesso está ativo!\n\n` +
      `Use /status para verificar a qualquer momento.`,
      { reply_to_message_id: ctx.message.message_id }
    );
  } else {
    await ctx.reply(
      `❌ Erro ao realizar cadastro.\n\n` +
      `Por favor, entre em contato com um administrador.`,
      { reply_to_message_id: ctx.message.message_id }
    );
  }
});

/**
 * Comando /entrar TOKEN - Usar token de convite para entrar no grupo
 */
bot.command('entrar', async (ctx) => {
  const user = ctx.from;
  const chatId = ctx.chat.id;

  // Extrair o token do comando
  const args = ctx.message.text.split(' ');
  const token = args[1]?.trim().toUpperCase();

  if (!token) {
    await ctx.reply(
      `⚠️ Uso incorreto do comando.\n\n` +
      `✅ Formato correto:\n` +
      `/entrar SEUCÓDIGO\n\n` +
      `Exemplo: /entrar ABC12345`,
      { reply_to_message_id: ctx.message.message_id }
    );
    return;
  }

  console.log(`[Comando] /entrar ${token} de ${user.first_name} (${user.id})`);

  try {
    // Buscar membro pelo token
    const { data: member, error: findError } = await supabase
      .from('members')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (findError || !member) {
      await ctx.reply(
        `❌ Código inválido!\n\n` +
        `Verifique se digitou corretamente ou entre em contato com o suporte.`,
        { reply_to_message_id: ctx.message.message_id }
      );
      return;
    }

    // Verificar se o token já foi usado
    if (member.token_usado) {
      await ctx.reply(
        `⚠️ Este código já foi utilizado!\n\n` +
        `Cada código pode ser usado apenas uma vez.\n` +
        `Se você já está no grupo, use /status para verificar seu cadastro.`,
        { reply_to_message_id: ctx.message.message_id }
      );
      return;
    }

    // Verificar se está vencido
    const vencimento = new Date(member.data_vencimento);
    const hoje = new Date();

    if (vencimento < hoje) {
      await ctx.reply(
        `❌ Código expirado!\n\n` +
        `A data de vencimento deste acesso já passou.\n` +
        `Entre em contato com o suporte para renovar.`,
        { reply_to_message_id: ctx.message.message_id }
      );
      return;
    }

    // Tentar adicionar o usuário ao grupo
    try {
      // Criar invite link específico para este usuário
      const inviteLink = await bot.telegram.createChatInviteLink(GROUP_ID, {
        member_limit: 1, // Apenas 1 pessoa pode usar
        expire_date: Math.floor(Date.now() / 1000) + 3600, // Expira em 1 hora
      });

      // Atualizar o membro com o telegram_user_id e marcar token como usado
      const { error: updateError } = await supabase
        .from('members')
        .update({
          telegram_user_id: user.id,
          telegram_username: user.username || null,
          telegram_first_name: user.first_name,
          telegram_last_name: user.last_name || null,
          token_usado: true,
          token_usado_em: new Date().toISOString(),
        })
        .eq('id', member.id);

      if (updateError) {
        console.error('[Comando /entrar] Erro ao atualizar membro:', updateError);
        throw updateError;
      }

      // Registrar log
      await supabase.from('logs').insert({
        member_id: member.id,
        acao: 'entrada_via_token',
        detalhes: {
          token,
          telegram_user_id: user.id,
          telegram_username: user.username
        },
        executado_por: 'sistema',
      });

      const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      await ctx.reply(
        `🎉 Código validado com sucesso!\n\n` +
        `👤 Nome: ${member.nome}\n` +
        `📅 Vencimento: ${vencimento.toLocaleDateString('pt-BR')}\n` +
        `⏰ Dias de acesso: ${diasRestantes} dias\n\n` +
        `🔗 Use o link abaixo para entrar no grupo:\n` +
        `${inviteLink.invite_link}\n\n` +
        `⚠️ O link expira em 1 hora e só pode ser usado uma vez.\n` +
        `⚠️ Certifique-se de entrar usando esta conta do Telegram!`,
        { reply_to_message_id: ctx.message.message_id }
      );

      console.log(`[Comando /entrar] ✅ Token ${token} validado para ${user.first_name} (${user.id})`);

    } catch (error: any) {
      console.error('[Comando /entrar] Erro ao criar invite link:', error);
      await ctx.reply(
        `❌ Erro ao gerar link de convite.\n\n` +
        `Por favor, tente novamente ou entre em contato com o suporte.`,
        { reply_to_message_id: ctx.message.message_id }
      );
    }

  } catch (error: any) {
    console.error('[Comando /entrar] Erro:', error);
    await ctx.reply(
      `❌ Erro ao processar código.\n\n` +
      `Por favor, tente novamente mais tarde.`,
      { reply_to_message_id: ctx.message.message_id }
    );
  }
});

/**
 * Comando /status - Verificar cadastro
 */
bot.command('status', async (ctx) => {
  const user = ctx.from;
  const isGroup = ctx.chat.type !== 'private';

  console.log(`[Comando] /status de ${user.first_name} (${user.id}) - Chat: ${ctx.chat.type}`);

  const member = await getMemberByTelegramId(user.id);

  if (!member) {
    // Se for no grupo, deletar o comando e avisar no privado
    if (isGroup) {
      try {
        await ctx.deleteMessage();
      } catch (err) {
        console.error('[/status] Erro ao deletar mensagem:', err);
      }

      try {
        await ctx.telegram.sendMessage(
          user.id,
          `⚠️ Você não está cadastrado no sistema.\n\n` +
          `Use /registrar para se cadastrar automaticamente.`
        );
      } catch (err) {
        // Se falhar enviar no privado (usuário bloqueou bot), avisar no grupo
        console.error('[/status] Erro ao enviar mensagem privada:', err);
        await ctx.reply(
          `⚠️ ${user.first_name}, não consegui te enviar mensagem privada!\n\n` +
          `Inicie uma conversa comigo primeiro: @${(await ctx.telegram.getMe()).username}`,
          { reply_to_message_id: ctx.message.message_id }
        );
      }
    } else {
      // Se já é privado, responder normalmente
      await ctx.reply(
        `⚠️ Você não está cadastrado no sistema.\n\n` +
        `Use /registrar para se cadastrar automaticamente.`
      );
    }
    return;
  }

  const vencimento = new Date(member.data_vencimento);
  const hoje = new Date();
  const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  let statusEmoji = '✅';
  let statusMsg = 'Ativo';

  if (diasRestantes < 0) {
    statusEmoji = '❌';
    statusMsg = 'VENCIDO';
  } else if (diasRestantes <= 7) {
    statusEmoji = '⚠️';
    statusMsg = 'Próximo ao vencimento';
  }

  const statusMessage =
    `${statusEmoji} Status do seu cadastro:\n\n` +
    `👤 Nome: ${member.nome}\n` +
    `🆔 ID: ${member.telegram_user_id}\n` +
    `📅 Cadastrado em: ${new Date(member.data_entrada).toLocaleDateString('pt-BR')}\n` +
    `📅 Vencimento: ${vencimento.toLocaleDateString('pt-BR')}\n` +
    `⏰ Dias restantes: ${diasRestantes > 0 ? diasRestantes : 'VENCIDO'}\n` +
    `📊 Status: ${statusMsg}\n\n` +
    `${diasRestantes <= 7 && diasRestantes > 0 ? '⚠️ Seu acesso está próximo de vencer!\n' : ''}` +
    `${diasRestantes < 0 ? '❌ Seu acesso está vencido. Solicite renovação.\n' : ''}`;

  // Se foi usado no grupo, enviar no privado
  if (isGroup) {
    try {
      // Deletar comando do grupo
      await ctx.deleteMessage();
    } catch (err) {
      console.error('[/status] Erro ao deletar mensagem:', err);
    }

    try {
      // Enviar status no privado
      await ctx.telegram.sendMessage(user.id, statusMessage);

      // Avisar no grupo que foi enviado no privado (mensagem auto-deletável)
      const notification = await ctx.reply(
        `📬 ${user.first_name}, enviei suas informações no privado para proteger sua privacidade!`,
        { reply_to_message_id: ctx.message.message_id }
      );

      // Deletar notificação após 5 segundos
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, notification.message_id);
        } catch (err) {
          console.error('[/status] Erro ao deletar notificação:', err);
        }
      }, 5000);

    } catch (err) {
      // Se falhar enviar no privado (usuário bloqueou bot)
      console.error('[/status] Erro ao enviar mensagem privada:', err);
      await ctx.reply(
        `⚠️ ${user.first_name}, não consegui te enviar mensagem privada!\n\n` +
        `Inicie uma conversa comigo primeiro: @${(await ctx.telegram.getMe()).username}\n` +
        `Depois use /status novamente.`,
        { reply_to_message_id: ctx.message.message_id }
      );
    }
  } else {
    // Se já é privado, responder normalmente
    await ctx.reply(statusMessage);
  }
});

/**
 * Handler para mensagens no grupo (auto-captura)
 * IMPORTANTE: Deve estar DEPOIS de todos os comandos
 */
bot.on(message('text'), async (ctx) => {
  const chatId = ctx.chat.id;

  // Só processar se for um dos grupos monitorados
  if (!GROUP_IDS.includes(chatId)) return;

  const user = ctx.from;

  // Ignorar bots
  if (user.is_bot) return;

  // Auto-registrar (silenciosamente se já existir)
  await autoRegisterMember(
    user.id,
    user.first_name,
    user.last_name,
    user.username,
    chatId // Registrar grupo de origem
  );
});

/**
 * Handler de erros
 */
bot.catch((err: any, ctx: any) => {
  console.error('[Webhook] Erro:', err);
});

export { bot };
export default bot;
