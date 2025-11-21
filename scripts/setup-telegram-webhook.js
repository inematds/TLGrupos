require('dotenv').config({ path: '.env.local' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function setupWebhook() {
  console.log('🤖 Configurando Webhook do Telegram...\n');
  console.log(`Bot Token: ${TELEGRAM_BOT_TOKEN ? '✅ Encontrado' : '❌ Não encontrado'}`);
  console.log(`Webhook URL: ${WEBHOOK_URL}/api/webhook\n`);

  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN não encontrado no .env.local');
    process.exit(1);
  }

  try {
    // 1. Verificar informações do bot
    console.log('1️⃣  Verificando informações do bot...');
    const meResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const meData = await meResponse.json();

    if (!meData.ok) {
      throw new Error(`Erro ao buscar info do bot: ${meData.description}`);
    }

    console.log(`   ✅ Bot: @${meData.result.username} (${meData.result.first_name})`);
    console.log(`   🆔 ID: ${meData.result.id}\n`);

    // 2. Deletar webhook existente (se houver)
    console.log('2️⃣  Removendo webhook antigo...');
    const deleteResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`
    );
    const deleteData = await deleteResponse.json();
    console.log(`   ${deleteData.ok ? '✅' : '⚠️'}  ${deleteData.description || 'Webhook removido'}\n`);

    // 3. Configurar novo webhook
    console.log('3️⃣  Configurando novo webhook...');
    const webhookUrl = `${WEBHOOK_URL}/api/webhook`;

    const setResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'edited_message', 'channel_post', 'callback_query', 'my_chat_member', 'chat_member'],
        }),
      }
    );

    const setData = await setResponse.json();

    if (!setData.ok) {
      throw new Error(`Erro ao configurar webhook: ${setData.description}`);
    }

    console.log(`   ✅ ${setData.description}`);
    console.log(`   🔗 URL: ${webhookUrl}\n`);

    // 4. Verificar webhook configurado
    console.log('4️⃣  Verificando webhook...');
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const infoData = await infoResponse.json();

    if (infoData.ok) {
      const info = infoData.result;
      console.log(`   ✅ URL: ${info.url}`);
      console.log(`   📊 Updates pendentes: ${info.pending_update_count}`);
      console.log(`   🕐 Última verificação: ${info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString('pt-BR') : 'Nunca'}`);

      if (info.last_error_message) {
        console.log(`   ⚠️  Último erro: ${info.last_error_message}`);
      }
    }

    console.log('\n=================================');
    console.log('✅ WEBHOOK CONFIGURADO COM SUCESSO!');
    console.log('=================================\n');

    console.log('📋 Próximos passos:');
    console.log('1. Certifique-se que o servidor está rodando (npm run dev)');
    console.log('2. Envie /cadastro no Telegram');
    console.log('3. Verifique se o bot responde\n');

    console.log('⚠️  IMPORTANTE:');
    console.log('- Se usar localhost, só funciona com ngrok/tunnel');
    console.log('- Em produção, use o domínio real no NEXTAUTH_URL\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

setupWebhook();
