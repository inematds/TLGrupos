const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTables() {
  console.log('🔍 Verificando estrutura do banco...\n');

  const expectedTables = [
    'members',
    'logs',
    'config',
    'invite_tokens',
    'pagamentos',
    'comprovantes',
    'cadastros_pendentes',
    'invites',
    'plans',
    'forma_pagamentos',
    'telegram_groups',
    'member_groups'
  ];

  console.log('📋 Tabelas esperadas:\n');

  for (const table of expectedTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table.padEnd(25)} - ERRO: ${error.message}`);
      } else {
        console.log(`   ✅ ${table.padEnd(25)} - ${count || 0} registros`);
      }
    } catch (err) {
      console.log(`   ❌ ${table.padEnd(25)} - EXCEÇÃO: ${err.message}`);
    }
  }

  // Verificar colunas importantes
  console.log('\n🔍 Verificando colunas importantes...\n');

  try {
    const { data, error } = await supabase
      .from('members')
      .select('id, telegram_user_id, no_grupo, plan_id, telegram_group_id')
      .limit(0);

    if (error) {
      console.log('   ⚠️  Não foi possível verificar colunas:', error.message);
    } else {
      console.log('   ✅ members.no_grupo - Coluna existe!');
      console.log('   ✅ members.plan_id - Coluna existe!');
      console.log('   ✅ members.telegram_group_id - Coluna existe!');
    }
  } catch (err) {
    console.log('   ⚠️  Erro ao verificar colunas');
  }

  // Verificar view stats
  console.log('\n🔍 Verificando views...\n');

  try {
    const { data, error } = await supabase
      .from('stats')
      .select('*')
      .limit(1);

    if (error) {
      console.log('   ❌ View "stats" - ERRO:', error.message);
    } else {
      console.log('   ✅ View "stats" - Funcionando!');
      if (data && data.length > 0) {
        console.log('\n   📊 Estatísticas atuais:');
        Object.entries(data[0]).forEach(([key, value]) => {
          console.log(`      ${key}: ${value}`);
        });
      }
    }
  } catch (err) {
    console.log('   ⚠️  Erro ao verificar view stats');
  }

  console.log('\n=================================');
  console.log('✅ VERIFICAÇÃO CONCLUÍDA!');
  console.log('=================================\n');
}

verifyTables();
