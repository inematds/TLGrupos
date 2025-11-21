require('dotenv').config({ path: '.env.local' });
const { bot } = require('../src/lib/telegram-webhook');

console.log('🤖 Iniciando Bot do Telegram em modo POLLING...\n');
console.log('⚠️  Este modo é apenas para DESENVOLVIMENTO');
console.log('⚠️  Em produção use webhook com HTTPS\n');

async function startPolling() {
  try {
    // Remover webhook (se existir)
    await bot.telegram.deleteWebhook();
    console.log('✅ Webhook removido\n');

    // Obter informações do bot
    const me = await bot.telegram.getMe();
    console.log(`🤖 Bot conectado: @${me.username}`);
    console.log(`📛 Nome: ${me.first_name}`);
    console.log(`🆔 ID: ${me.id}\n`);

    console.log('🎯 Comandos disponíveis:');
    console.log('   • /cadastro - Link para formulário completo');
    console.log('   • /registrar - Cadastro rápido');
    console.log('   • /status - Ver status do cadastro\n');

    console.log('📡 Bot aguardando mensagens...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Iniciar polling
    await bot.launch();

    console.log('✅ Bot rodando em modo POLLING!');
    console.log('👋 Envie /cadastro no Telegram para testar\n');

    // Graceful stop
    process.once('SIGINT', () => {
      console.log('\n🛑 Parando bot...');
      bot.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      console.log('\n🛑 Parando bot...');
      bot.stop('SIGTERM');
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar bot:', error);
    process.exit(1);
  }
}

startPolling();
