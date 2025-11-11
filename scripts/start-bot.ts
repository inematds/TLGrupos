#!/usr/bin/env tsx

/**
 * Script para iniciar o bot do Telegram
 * Monitora mensagens e auto-cadastra membros
 *
 * USO: npm run start:bot
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { bot } from '../src/lib/telegram-webhook';

console.log('🤖 Iniciando Bot do Telegram...\n');

async function startBot() {
  try {
    // Obter info do bot
    const botInfo = await bot.telegram.getMe();
    console.log(`✅ Bot conectado: @${botInfo.username}`);
    console.log(`   Nome: ${botInfo.first_name}`);
    console.log(`   ID: ${botInfo.id}\n`);

    console.log('📋 Funcionalidades ativas:');
    console.log('   • Auto-cadastro ao entrar no grupo');
    console.log('   • Auto-cadastro ao enviar mensagem');
    console.log('   • Comando /registrar');
    console.log('   • Comando /entrar TOKEN (usar código de acesso)');
    console.log('   • Comando /status\n');

    console.log('⚡ Bot está rodando...');
    console.log('   Pressione Ctrl+C para parar\n');

    // Iniciar bot
    await bot.launch();

    // Graceful stop
    process.once('SIGINT', () => {
      console.log('\n\n👋 Parando bot...');
      bot.stop('SIGINT');
    });

    process.once('SIGTERM', () => {
      bot.stop('SIGTERM');
    });
  } catch (error: any) {
    console.error('\n❌ Erro ao iniciar bot:', error.message);

    if (error.message.includes('401')) {
      console.error('\n💡 O token do bot está inválido.');
      console.error('   Verifique o TELEGRAM_BOT_TOKEN no .env.local');
    }

    process.exit(1);
  }
}

startBot();
