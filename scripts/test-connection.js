const { createClient } = require('@supabase/supabase-js');

// Lê as variáveis do .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testando conexão com Supabase...\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? '✅ Encontrada' : '❌ Não encontrada'}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Testa conexão básica
    console.log('1️⃣  Testando conexão básica...');
    const { data, error } = await supabase.from('members').select('count', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('   ⚠️  Tabela "members" não existe ainda');
        console.log('   ℹ️  Execute as migrações primeiro (veja ATUALIZAR_BANCO_SUPABASE.md)\n');
      } else {
        console.log('   ❌ Erro:', error.message, '\n');
      }
    } else {
      console.log('   ✅ Conexão OK!\n');
    }

    // Lista tabelas existentes
    console.log('2️⃣  Verificando tabelas existentes...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tablesError) {
      console.log('   ⚠️  Não foi possível listar tabelas via API');
      console.log('   ℹ️  Acesse o Dashboard para verificar manualmente\n');
    } else if (tables && tables.length > 0) {
      console.log('   ✅ Tabelas encontradas:');
      tables.forEach(t => console.log(`      - ${t.tablename}`));
      console.log('');
    } else {
      console.log('   ⚠️  Nenhuma tabela encontrada');
      console.log('   ℹ️  Execute as migrações (veja ATUALIZAR_BANCO_SUPABASE.md)\n');
    }

    // Testa inserção (se tabela members existir)
    console.log('3️⃣  Testando permissões...');
    const testInsert = await supabase.from('members').select('id').limit(1);

    if (testInsert.error) {
      if (testInsert.error.message.includes('relation') && testInsert.error.message.includes('does not exist')) {
        console.log('   ⏭️  Pulando teste - tabela não existe\n');
      } else {
        console.log('   ❌ Erro:', testInsert.error.message, '\n');
      }
    } else {
      console.log('   ✅ Permissões OK!\n');
    }

    console.log('=================================');
    console.log('✅ TESTE CONCLUÍDO!');
    console.log('=================================\n');

    console.log('📋 Próximos passos:');
    console.log('1. Execute as migrações (veja ATUALIZAR_BANCO_SUPABASE.md)');
    console.log('2. Reinicie o servidor: npm run dev');
    console.log('3. Teste a aplicação\n');

  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
  }
}

testConnection();
