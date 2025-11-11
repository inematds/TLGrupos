#!/usr/bin/env tsx

/**
 * Script para descobrir o ID de grupos do Telegram
 *
 * USO: npm run get-group-id
 *
 * Este script lista todos os chats/grupos onde o bot está presente
 * e mostra os IDs para você escolher o correto
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { Telegraf } from 'telegraf';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ Erro: TELEGRAM_BOT_TOKEN não encontrado no .env.local');
  console.error('\nVerifique se você tem o token do bot configurado em .env.local');
  console.error('Exemplo: TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log('🔍 Descobrindo ID do Grupo Telegram\n');
console.log('═'.repeat(60));

async function getGroupId() {
  try {
    // Obter informações do bot
    const botInfo = await bot.telegram.getMe();
    console.log(`\n✅ Bot conectado: @${botInfo.username}`);
    console.log(`   Nome: ${botInfo.first_name}`);
    console.log(`   ID do Bot: ${botInfo.id}`);

    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 MÉTODO 1: Enviar mensagem de teste\n');
    console.log('Este método envia uma mensagem em TODOS os chats onde o bot está');
    console.log('e captura o ID do chat automaticamente.\n');
    console.log('⚠️  AVISO: Isso enviará uma mensagem em todos os grupos!');
    console.log('Digite "sim" para continuar ou "nao" para usar outro método.\n');

    // Aguardar confirmação do usuário
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Continuar? (sim/nao): ', async (answer: string) => {
      rl.close();

      if (answer.toLowerCase() === 'sim' || answer.toLowerCase() === 's') {
        console.log('\n📤 Configurando bot para capturar IDs...\n');
        console.log('Agora, envie QUALQUER mensagem no grupo do Telegram.');
        console.log('O bot vai responder com o ID do grupo.\n');
        console.log('⌛ Aguardando mensagem... (Pressione Ctrl+C para cancelar)\n');

        // Handler para capturar mensagens
        bot.on('message', async (ctx) => {
          const chatId = ctx.chat.id;
          const chatType = ctx.chat.type;
          const chatTitle = 'title' in ctx.chat ? ctx.chat.title : 'Conversa Privada';
          const from = ctx.from;

          console.log('═'.repeat(60));
          console.log('✅ MENSAGEM RECEBIDA!\n');
          console.log(`📊 Tipo: ${chatType}`);
          console.log(`💬 Nome: ${chatTitle}`);
          console.log(`🆔 ID: ${chatId}`);
          console.log(`👤 De: ${from.first_name}${from.last_name ? ' ' + from.last_name : ''}`);

          if (chatType === 'group' || chatType === 'supergroup') {
            console.log('\n✅ Este é um grupo!');
            console.log(`\n🎯 Use este ID no .env.local:`);
            console.log(`   TELEGRAM_GROUP_ID=${chatId}\n`);
          } else if (chatType === 'private') {
            console.log('\n⚠️  Esta é uma conversa privada, não um grupo.');
            console.log('   Envie uma mensagem NO GRUPO para obter o ID do grupo.\n');
          }

          console.log('═'.repeat(60));
          console.log('\n💡 Dica: Você pode enviar mensagens em vários grupos');
          console.log('   para descobrir o ID de cada um.\n');
          console.log('⌛ Aguardando mais mensagens... (Ctrl+C para sair)\n');
        });

        // Iniciar bot
        await bot.launch();

        // Graceful stop
        process.once('SIGINT', () => {
          console.log('\n\n👋 Encerrando...');
          bot.stop('SIGINT');
        });
        process.once('SIGTERM', () => {
          bot.stop('SIGTERM');
        });
      } else {
        console.log('\n📋 MÉTODO 2: Usar @RawDataBot (Recomendado)\n');
        console.log('1. Adicione o bot @RawDataBot ao seu grupo');
        console.log('2. O bot enviará automaticamente as informações do grupo');
        console.log('3. Procure por "id": -1001234567890');
        console.log('4. Copie o ID (com o sinal negativo!)');
        console.log('5. Remova o @RawDataBot do grupo\n');

        console.log('📋 MÉTODO 3: Usar @getidsbot\n');
        console.log('1. Adicione o bot @getidsbot ao seu grupo');
        console.log('2. O bot responde com o ID do grupo');
        console.log('3. Remova o bot\n');

        console.log('📋 MÉTODO 4: Inspecionar atualizações\n');
        console.log('Execute: npm run get-updates');
        console.log('E veja as últimas atualizações recebidas pelo bot\n');

        process.exit(0);
      }
    });
  } catch (error: any) {
    console.error('\n❌ Erro ao conectar com o bot:', error.message);

    if (error.message.includes('401')) {
      console.error('\n💡 O token do bot está inválido.');
      console.error('   Verifique o TELEGRAM_BOT_TOKEN no .env.local');
    }

    process.exit(1);
  }
}

getGroupId();
