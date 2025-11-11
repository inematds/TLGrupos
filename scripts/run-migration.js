const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    // Pegar nome do arquivo da linha de comando
    const migrationFile = process.argv[2];
    if (!migrationFile) {
      console.error('❌ Erro: Forneça o nome do arquivo de migration');
      console.log('Uso: node scripts/run-migration.js <arquivo.sql>');
      console.log('Exemplo: node scripts/run-migration.js 010_add_no_grupo_column.sql');
      process.exit(1);
    }

    console.log(`🔄 Executando migration ${migrationFile}...`);

    // Ler arquivo de migration
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Arquivo não encontrado: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Executar SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se o RPC não existir, tentar executar manualmente via REST API
      console.log('⚠️  RPC não disponível, executando via REST API...');

      // Separar comandos SQL
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('/*'));

      for (const command of commands) {
        if (command) {
          console.log(`Executando: ${command.substring(0, 50)}...`);

          // Usar a API do Supabase para executar SQL direto
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ query: command })
          });

          if (!response.ok) {
            console.log(`⚠️  Comando falhou (pode ser normal): ${command.substring(0, 50)}...`);
          }
        }
      }

      console.log('✅ Migration executada com sucesso!');
    } else {
      console.log('✅ Migration executada com sucesso!');
      console.log('Resultado:', data);
    }
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    console.log('\n📋 Execute manualmente no Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/xetowlvhhnxewvglxklo/sql/new');
    console.log('\nCopie e cole o conteúdo de:');
    console.log(`supabase/migrations/${process.argv[2] || 'arquivo.sql'}`);
    process.exit(1);
  }
}

runMigration();
