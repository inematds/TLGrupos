const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../supabase/migrations');

// Ordem correta respeitando dependências
const migrationOrder = [
  '001_initial_schema.sql',
  '002_make_telegram_user_id_nullable.sql',
  '003_add_invite_tokens.sql',
  '004_pagamentos_sistema.sql',
  '005_sistema_comprovantes.sql',
  '010_add_no_grupo_column.sql', // MOVIDA PARA ANTES da 006!
  '006_status_erro_remocao.sql',
  '007_remove_vencido_status.sql',
  '008_add_sem_telegram_stats.sql',
  '009_create_invites_table.sql',
  '011_create_plans_table.sql',
  '012_add_plan_id_to_members.sql',
  '013_add_invite_link_tracking.sql',
  '014_add_plan_id_to_cadastros_pendentes.sql',
  '015_create_forma_pagamentos_table.sql',
  '016_create_telegram_groups_table.sql',
  '017_add_group_to_members.sql',
];

console.log('🔧 Criando arquivo de migração com ordem corrigida...\n');

let consolidatedSql = `-- ===============================================
-- MIGRAÇÕES CONSOLIDADAS - TLGrupos
-- ===============================================
-- IMPORTANTE: Este arquivo foi gerado com ordem
-- corrigida de dependências
-- ===============================================

`;

migrationOrder.forEach((file, index) => {
  const filePath = path.join(migrationsDir, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
    return;
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  consolidatedSql += `
-- ===============================================
-- MIGRAÇÃO ${String(index + 1).padStart(2, '0')}: ${file}
-- ===============================================

${sql}

`;

  console.log(`✅ ${file}`);
});

const outputPath = path.join(__dirname, '../EXECUTAR_MIGRACOES_CORRIGIDO.sql');
fs.writeFileSync(outputPath, consolidatedSql);

console.log('\n✅ Arquivo criado: EXECUTAR_MIGRACOES_CORRIGIDO.sql');
console.log(`📊 Total: ${migrationOrder.length} migrações\n`);
console.log('🎯 Execute este arquivo no Supabase SQL Editor:');
console.log('   https://supabase.com/dashboard/project/xdvetjrrrifddoowuqhz/sql/new\n');
