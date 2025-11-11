/**
 * Script para remover membros vencidos
 * Executar diariamente via cron: 0 0 * * * (meia-noite)
 */

import { removeExpiredMembers } from '../src/services/cron-service';

async function main() {
  console.log('🔍 Verificando membros vencidos...');
  console.log(`⏰ Executado em: ${new Date().toISOString()}`);

  try {
    const result = await removeExpiredMembers();

    console.log('✅ Processamento concluído!');
    console.log(`📊 Total de membros processados: ${result.count}`);

    if (result.results) {
      console.log(`✅ Sucesso: ${result.results.success}`);
      console.log(`❌ Falhas: ${result.results.failed}`);

      if (result.results.errors.length > 0) {
        console.log('\n❌ Erros encontrados:');
        result.results.errors.forEach((err) => {
          console.log(`  - Membro ${err.memberId}: ${err.error}`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  }
}

main();
