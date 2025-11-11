const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Construct connection string from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// For direct Postgres connection, we need the connection string
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

async function executeSQLDirect() {
  console.log('🔧 Executando SQL diretamente no Postgres...\n');

  // Read the SQL file
  const sql = fs.readFileSync('fix-stats-view.sql', 'utf8');

  console.log('📄 SQL a ser executado:');
  console.log('─'.repeat(50));
  console.log(sql);
  console.log('─'.repeat(50));
  console.log();

  // Try to connect using Supabase pooler
  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (!projectRef) {
    console.error('❌ Não foi possível extrair project ref da URL do Supabase');
    console.log('\n⚠️  Você precisa executar o SQL manualmente no Supabase SQL Editor:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/' + projectRef + '/sql');
    console.log('2. Cole o conteúdo de fix-stats-view.sql');
    console.log('3. Execute o SQL');
    return;
  }

  console.log('⚠️  Para executar este SQL, você tem duas opções:\n');
  console.log('OPÇÃO 1: Usar Supabase SQL Editor (Recomendado)');
  console.log('─────────────────────────────────────────────────');
  console.log('1. Acesse: https://supabase.com/dashboard');
  console.log('2. Entre no seu projeto TLGrupos');
  console.log('3. Vá em "SQL Editor" no menu lateral');
  console.log('4. Clique em "New Query"');
  console.log('5. Cole o conteúdo do arquivo fix-stats-view.sql');
  console.log('6. Clique em "Run" ou pressione Ctrl+Enter\n');

  console.log('OPÇÃO 2: Usar psql (Se tiver acesso)');
  console.log('─────────────────────────────────────────────────');
  console.log('Se você tiver a connection string do Postgres:');
  console.log('psql "sua-connection-string" < fix-stats-view.sql\n');

  console.log('📋 Conteúdo do arquivo fix-stats-view.sql está pronto para uso!');
}

executeSQLDirect().catch(console.error);
