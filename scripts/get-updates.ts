#!/usr/bin/env tsx

/**
 * Script para ver as últimas atualizações recebidas pelo bot
 * Isso ajuda a descobrir IDs de grupos e chats
 *
 * USO: npm run get-updates
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { Telegraf } from 'telegraf';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ Erro: TELEGRAM_BOT_TOKEN não encontrado no .env.local');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

async function getUpdates() {
  try {
    console.log('🔍 Buscando últimas atualizações do bot...\n');

    // Buscar últimas atualizações
    const updates = await bot.telegram.getUpdates(0, 100);

    if (updates.length === 0) {
      console.log('⚠️  Nenhuma atualização encontrada.');
      console.log('\n💡 Dicas:');
      console.log('   1. Envie uma mensagem no grupo com o bot');
      console.log('   2. Ou use: npm run get-group-id (modo interativo)');
      console.log('   3. Ou adicione @RawDataBot ao grupo\n');
      return;
    }

    console.log(`📊 Encontradas ${updates.length} atualizações\n`);
    console.log('═'.repeat(70));

    // Agrupar por chat
    const chatsMap = new Map();

    updates.forEach((update, index) => {
      if ('message' in update && update.message) {
        const msg = update.message;
        const chatId = msg.chat.id;
        const chatType = msg.chat.type;
        const chatTitle = 'title' in msg.chat ? msg.chat.title :
                         'first_name' in msg.chat ? msg.chat.first_name : 'Unknown';

        if (!chatsMap.has(chatId)) {
          chatsMap.set(chatId, {
            id: chatId,
            type: chatType,
            title: chatTitle,
            count: 0,
          });
        }

        chatsMap.get(chatId).count++;
      }
    });

    // Exibir chats únicos
    console.log('\n📋 CHATS ENCONTRADOS:\n');

    let groupCount = 0;
    chatsMap.forEach((chat, chatId) => {
      const isGroup = chat.type === 'group' || chat.type === 'supergroup';
      const emoji = isGroup ? '👥' : '👤';

      console.log(`${emoji} ${chat.title}`);
      console.log(`   Tipo: ${chat.type}`);
      console.log(`   ID: ${chatId}${isGroup ? ' ✅ (Grupo)' : ''}`);
      console.log(`   Mensagens: ${chat.count}`);
      console.log();

      if (isGroup) groupCount++;
    });

    console.log('═'.repeat(70));
    console.log(`\n✅ Total de grupos encontrados: ${groupCount}`);
    console.log(`📊 Total de chats: ${chatsMap.size}\n`);

    if (groupCount > 0) {
      console.log('🎯 Para usar um grupo, copie o ID e atualize no .env.local:');
      console.log('   TELEGRAM_GROUP_ID=<ID_DO_GRUPO>\n');
    } else {
      console.log('⚠️  Nenhum grupo encontrado nas atualizações.');
      console.log('\n💡 Envie uma mensagem no grupo onde o bot está presente');
      console.log('   e execute este comando novamente.\n');
    }
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

getUpdates();
