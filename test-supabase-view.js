// Script para testar diretamente a view stats do Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStatsView() {
  console.log('🔍 Testando view stats do Supabase...\n');

  // Testar view stats
  console.log('📊 Consultando view stats:');
  const { data: statsData, error: statsError } = await supabase
    .from('stats')
    .select('*')
    .single();

  if (statsError) {
    console.error('❌ Erro ao consultar view stats:', statsError);
  } else {
    console.log('✅ View stats retornou:');
    console.log(`   Total Cadastros: ${statsData.total_cadastros}`);
    console.log(`   Total Ativos: ${statsData.total_ativos}`);
    console.log(`   Total Removidos: ${statsData.total_removidos}`);
    console.log(`   Ativos no Grupo: ${statsData.ativos_no_grupo}`);
  }

  console.log('\n📋 Consultando tabela members diretamente:');
  const { data: membersData, error: membersError } = await supabase
    .from('members')
    .select('id, status', { count: 'exact' });

  if (membersError) {
    console.error('❌ Erro ao consultar members:', membersError);
  } else {
    const totalCount = membersData.length;
    const ativosCount = membersData.filter(m => m.status === 'ativo').length;
    const removidosCount = membersData.filter(m => m.status === 'removido').length;

    console.log('✅ Tabela members retornou:');
    console.log(`   Total de Membros: ${totalCount}`);
    console.log(`   Ativos: ${ativosCount}`);
    console.log(`   Removidos: ${removidosCount}`);
  }

  console.log('\n🎯 Conclusão:');
  if (statsData && membersData) {
    if (statsData.total_cadastros === membersData.length) {
      console.log('   ✅ View stats está CORRETA (mesma quantidade da tabela)');
    } else {
      console.log('   ❌ View stats está DESATUALIZADA!');
      console.log(`      View: ${statsData.total_cadastros} | Tabela: ${membersData.length}`);
      console.log('   🔧 Execute o script: scripts/refresh-stats-view.sql no Supabase');
    }
  }
}

testStatsView().catch(console.error);
