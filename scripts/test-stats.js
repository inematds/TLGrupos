const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log('🔍 Testando acesso às tabelas...\n');

  // Test members table
  console.log('1️⃣ Testando tabela members:');
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, nome, no_grupo')
    .limit(1);

  if (membersError) {
    console.log('❌ Erro:', membersError.message);
  } else {
    console.log('✅ Tabela members acessível');
    console.log('   Exemplo:', members[0]);
  }

  // Test invites table
  console.log('\n2️⃣ Testando tabela invites:');
  const { data: invites, error: invitesError } = await supabase
    .from('invites')
    .select('*')
    .limit(1);

  if (invitesError) {
    console.log('❌ Erro:', invitesError.message);
    console.log('\n📋 A tabela invites não está acessível.');
    console.log('Possíveis causas:');
    console.log('  1. Tabela não foi criada');
    console.log('  2. RLS (Row Level Security) está bloqueando o acesso');
    console.log('\nPor favor, execute este SQL no Supabase:');
    console.log('----------------------------------------');
    console.log(`
-- Habilitar RLS mas permitir acesso com service_role
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Permitir todas operações para service_role
CREATE POLICY "Service role has full access to invites"
  ON invites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
    `);
  } else {
    console.log('✅ Tabela invites acessível');
    console.log('   Total de registros:', invites.length);
  }
}

testTables();
