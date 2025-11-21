const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco usando connection pooler
const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.xdvetjrrrifddoowuqhz',
  password: 'TLGroup',
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados!\n');

    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📦 Encontradas ${migrationFiles.length} migrações\n`);

    for (const file of migrationFiles) {
      console.log(`🔄 Executando: ${file}`);

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        await client.query(sql);
        console.log(`   ✅ Sucesso\n`);
      } catch (err) {
        console.error(`   ❌ Erro: ${err.message}`);

        // Se for erro de "já existe", é OK continuar
        if (err.message.includes('already exists') ||
            err.message.includes('duplicate key') ||
            err.message.includes('já existe')) {
          console.log(`   ⚠️  Objeto já existe - pulando\n`);
        } else {
          console.log(`   ⚠️  Continuando...\n`);
        }
      }
    }

    console.log('✅ Processo de migração concluído!');
    console.log('\n📋 VERIFICANDO TABELAS CRIADAS:');

    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
