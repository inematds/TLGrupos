const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔍 Verificando banco de dados do TLGrupos...\n');

// Verificar variáveis de ambiente
console.log('📋 Verificando configurações:');
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configurado' : '✗ NÃO configurado'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Configurado' : '✗ NÃO configurado'}`);
console.log('');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('   Verifique o arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  try {
    console.log('1️⃣  Verificando tabela MEMBERS...');
    const { data: members, error: membersError, count: membersCount } = await supabase
      .from('members')
      .select('*', { count: 'exact' });

    if (membersError) {
      console.error(`   ❌ Erro: ${membersError.message}`);
    } else {
      console.log(`   ✓ Total de registros: ${membersCount || 0}`);
      if (members && members.length > 0) {
        console.log(`   📊 Primeiros registros:`);
        members.slice(0, 5).forEach((m, i) => {
          console.log(`      ${i + 1}. ${m.nome} - Status: ${m.status} - Telegram ID: ${m.telegram_user_id || 'N/A'}`);
          console.log(`         Entrada: ${m.data_entrada} | Vencimento: ${m.data_vencimento}`);
        });
      } else {
        console.log('   ⚠️  Tabela vazia - nenhum membro encontrado');
      }
    }
    console.log('');

    console.log('2️⃣  Verificando tabela CADASTROS_PENDENTES...');
    const { data: pending, error: pendingError, count: pendingCount } = await supabase
      .from('cadastros_pendentes')
      .select('*', { count: 'exact' });

    if (pendingError) {
      console.error(`   ❌ Erro: ${pendingError.message}`);
    } else {
      console.log(`   ✓ Total de registros: ${pendingCount || 0}`);
      if (pending && pending.length > 0) {
        console.log(`   📊 Primeiros registros:`);
        pending.slice(0, 5).forEach((p, i) => {
          console.log(`      ${i + 1}. ${p.nome} - Status: ${p.status} - Plan: ${p.plan_id || 'N/A'}`);
          console.log(`         Criado: ${p.created_at}`);
        });
      } else {
        console.log('   ℹ️  Tabela vazia - nenhum cadastro pendente');
      }
    }
    console.log('');

    console.log('3️⃣  Verificando VIEW STATS...');
    const { data: stats, error: statsError } = await supabase
      .from('stats')
      .select('*')
      .single();

    if (statsError) {
      console.error(`   ❌ Erro: ${statsError.message}`);
    } else {
      console.log('   ✓ View stats funcionando');
      console.log('   📊 Dados da view:');
      console.log(JSON.stringify(stats, null, 6));
    }
    console.log('');

    console.log('4️⃣  Verificando tabela TELEGRAM_GROUPS...');
    const { data: groups, error: groupsError, count: groupsCount } = await supabase
      .from('telegram_groups')
      .select('*', { count: 'exact' });

    if (groupsError) {
      console.error(`   ❌ Erro: ${groupsError.message}`);
    } else {
      console.log(`   ✓ Total de grupos: ${groupsCount || 0}`);
      if (groups && groups.length > 0) {
        console.log(`   📊 Grupos cadastrados:`);
        groups.forEach((g, i) => {
          console.log(`      ${i + 1}. ${g.nome} (${g.telegram_group_id})`);
          console.log(`         Auto-removal: ${g.auto_removal_enabled ? 'Ativo' : 'Inativo'}`);
        });
      } else {
        console.log('   ⚠️  Nenhum grupo cadastrado');
      }
    }
    console.log('');

    console.log('5️⃣  Verificando tabela PLANS...');
    const { data: plans, error: plansError, count: plansCount } = await supabase
      .from('plans')
      .select('*', { count: 'exact' });

    if (plansError) {
      console.error(`   ❌ Erro: ${plansError.message}`);
    } else {
      console.log(`   ✓ Total de planos: ${plansCount || 0}`);
      if (plans && plans.length > 0) {
        console.log(`   📊 Planos disponíveis:`);
        plans.forEach((p, i) => {
          console.log(`      ${i + 1}. ${p.nome} - R$ ${p.valor} - ${p.duracao_dias} dias`);
        });
      } else {
        console.log('   ⚠️  Nenhum plano cadastrado');
      }
    }
    console.log('');

    // Resumo final
    console.log('=' .repeat(60));
    console.log('📊 RESUMO:');
    console.log('=' .repeat(60));
    console.log(`  Membros na tabela 'members': ${membersCount || 0}`);
    console.log(`  Cadastros pendentes: ${pendingCount || 0}`);
    console.log(`  Grupos Telegram cadastrados: ${groupsCount || 0}`);
    console.log(`  Planos disponíveis: ${plansCount || 0}`);
    console.log('');

    if ((membersCount || 0) === 0 && (pendingCount || 0) === 0) {
      console.log('⚠️  ATENÇÃO: Não há membros cadastrados em nenhuma tabela!');
      console.log('');
      console.log('Possíveis causas:');
      console.log('  1. O bot não está salvando os cadastros no banco');
      console.log('  2. As pessoas se cadastraram mas houve erro ao salvar');
      console.log('  3. Os dados estão em outro banco/ambiente');
      console.log('');
      console.log('Próximos passos:');
      console.log('  - Verifique os logs do bot Telegram');
      console.log('  - Tente cadastrar um membro manualmente em /dashboard/new');
      console.log('  - Execute este script novamente para verificar');
    } else if ((membersCount || 0) > 0) {
      console.log('✅ Tudo certo! Há membros cadastrados no banco.');
      console.log('   O dashboard deveria estar mostrando esses dados.');
      console.log('');
      console.log('Se o dashboard ainda mostra 0, tente:');
      console.log('  - Limpar o cache do navegador (Ctrl+Shift+R)');
      console.log('  - Restartar o servidor Next.js');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
    if (error.message.includes('fetch failed')) {
      console.error('');
      console.error('Problema de conexão com Supabase!');
      console.error('Verifique:');
      console.error('  - A URL do Supabase está correta?');
      console.error('  - A service role key está correta?');
      console.error('  - Há conexão com a internet?');
    }
  }
}

checkDatabase()
  .then(() => {
    console.log('');
    console.log('✓ Verificação concluída!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
