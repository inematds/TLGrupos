const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNotifications() {
  console.log('🔍 Verificando configurações de notificação...\n');

  const { data, error } = await supabase
    .from('system_config')
    .select('chave, valor')
    .in('chave', [
      'notif_vencimento_ativo',
      'notif_enviar_email',
      'notif_enviar_telegram',
      'notif_noticias_ativo',
      'notif_noticias_email',
      'notif_noticias_telegram'
    ])
    .order('chave');

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('📋 Configurações de Notificação:\n');
  data.forEach(config => {
    const status = config.valor === 'true' ? '✅ ATIVO' : '❌ INATIVO';
    console.log(`${status} - ${config.chave}: ${config.valor}`);
  });

  console.log('\n📧 Verificando configuração de email...');
  const emailConfigs = await supabase
    .from('system_config')
    .select('chave, valor')
    .in('chave', ['email_provider', 'email_from', 'gmail_user']);

  console.log('\nConfiguração de Email:');
  if (emailConfigs.data) {
    emailConfigs.data.forEach(c => {
      const display = c.valor || '(vazio)';
      console.log(`  ${c.chave}: ${display}`);
    });
  }
}

checkNotifications().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
