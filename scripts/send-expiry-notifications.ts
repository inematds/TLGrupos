/**
 * Script para enviar notificações de vencimento
 * Executar diariamente via cron: 0 9 * * * (9h da manhã)
 */

import { sendAllScheduledNotifications } from '../src/services/notification-service';

async function main() {
  console.log('📨 Enviando notificações de vencimento...');
  console.log(`⏰ Executado em: ${new Date().toISOString()}`);

  try {
    const results = await sendAllScheduledNotifications();

    console.log('✅ Processamento concluído!');
    console.log('\n📊 Notificações 7 dias antes:');
    console.log(`  Total: ${results.day7.count}`);
    console.log(`  Sucesso: ${results.day7.results?.success || 0}`);
    console.log(`  Falhas: ${results.day7.results?.failed || 0}`);

    console.log('\n📊 Notificações 3 dias antes:');
    console.log(`  Total: ${results.day3.count}`);
    console.log(`  Sucesso: ${results.day3.results?.success || 0}`);
    console.log(`  Falhas: ${results.day3.results?.failed || 0}`);

    console.log('\n📊 Notificações 1 dia antes:');
    console.log(`  Total: ${results.day1.count}`);
    console.log(`  Sucesso: ${results.day1.results?.success || 0}`);
    console.log(`  Falhas: ${results.day1.results?.failed || 0}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  }
}

main();
