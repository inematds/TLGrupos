/**
 * Script para configurar e verificar o bot Telegram
 */

import { bot, isBotAdmin, getGroupInfo } from '../src/lib/telegram';

async function main() {
  console.log('🤖 Verificando configuração do bot Telegram...\n');

  try {
    // 1. Obter informações do bot
    const botInfo = await bot.telegram.getMe();
    console.log('✅ Bot conectado com sucesso!');
    console.log(`📛 Nome: ${botInfo.first_name}`);
    console.log(`🆔 Username: @${botInfo.username}`);
    console.log(`🔢 ID: ${botInfo.id}\n`);

    // 2. Verificar informações do grupo
    console.log('🔍 Verificando grupo...');
    const groupResult = await getGroupInfo();

    if (groupResult.success && groupResult.data) {
      console.log('✅ Grupo encontrado!');
      console.log(`📛 Nome: ${groupResult.data.title}`);
      console.log(`🔢 ID: ${groupResult.data.id}`);
      console.log(`📝 Tipo: ${groupResult.data.type}\n`);
    } else {
      console.log('❌ Erro ao obter informações do grupo:');
      console.log(groupResult.error);
      console.log(
        '\n💡 Dica: Verifique se o TELEGRAM_GROUP_ID está correto no .env\n'
      );
    }

    // 3. Verificar se o bot é admin
    console.log('🔍 Verificando permissões...');
    const adminResult = await isBotAdmin();

    if (adminResult.success) {
      if (adminResult.isAdmin) {
        console.log('✅ Bot é administrador do grupo!');
        console.log(`📝 Status: ${adminResult.status}\n`);
      } else {
        console.log('⚠️  Bot NÃO é administrador do grupo!');
        console.log(`📝 Status: ${adminResult.status}`);
        console.log(
          '\n💡 O bot precisa ser administrador com as seguintes permissões:'
        );
        console.log('   - Adicionar usuários (can_invite_users)');
        console.log('   - Banir usuários (can_restrict_members)\n');
      }
    } else {
      console.log('❌ Erro ao verificar permissões:');
      console.log(adminResult.error);
    }

    // 4. Resumo
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RESUMO DA CONFIGURAÇÃO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (adminResult.isAdmin && groupResult.success) {
      console.log('✅ Tudo configurado corretamente!');
      console.log('🚀 Você pode começar a usar o sistema.');
    } else {
      console.log('⚠️  Há problemas na configuração:');
      if (!adminResult.isAdmin) {
        console.log('   - Bot precisa ser admin do grupo');
      }
      if (!groupResult.success) {
        console.log('   - Grupo não foi encontrado');
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao verificar bot:', error.message);
    process.exit(1);
  }
}

main();
