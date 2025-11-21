const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStats() {
  console.log('🔍 Verificando estatísticas do banco...\n');

  // Verificar total de membros
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('*');

  if (membersError) {
    console.error('❌ Erro ao buscar membros:', membersError.message);
  } else {
    console.log(`📊 Total de membros na tabela: ${members.length}`);
    if (members.length > 0) {
      console.log('\n👥 Membros encontrados:');
      members.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.nome} - Status: ${m.status} - Telegram ID: ${m.telegram_user_id || 'N/A'}`);
      });
    }
  }

  console.log('\n');

  // Verificar view stats
  const { data: stats, error: statsError } = await supabase
    .from('stats')
    .select('*')
    .single();

  if (statsError) {
    console.error('❌ Erro ao buscar stats view:', statsError.message);
    console.log('⚠️  A view "stats" pode não existir ou estar quebrada.');
  } else {
    console.log('📈 Dados da view stats:');
    console.log(JSON.stringify(stats, null, 2));
  }
}

checkStats()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });
