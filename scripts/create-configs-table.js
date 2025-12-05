const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carregar .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ Não encontrado');

async function createConfigsTable() {
  console.log('🔧 Criando tabela configs...\n');

  try {
    // Executar SQL para criar a tabela
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS configs (
          id SERIAL PRIMARY KEY,
          chave VARCHAR(255) UNIQUE NOT NULL,
          valor TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_configs_chave ON configs(chave);

        COMMENT ON TABLE configs IS 'Tabela de configurações do sistema';
        COMMENT ON COLUMN configs.chave IS 'Chave única da configuração';
        COMMENT ON COLUMN configs.valor IS 'Valor da configuração';
      `
    });

    if (error) {
      // Se não tiver a função exec_sql, tentar direto
      console.log('⚠️  Tentando criar tabela diretamente...');

      const { error: directError } = await supabase
        .from('configs')
        .select('id')
        .limit(1);

      if (directError && directError.message.includes('does not exist')) {
        console.error('\n❌ ERRO: Você precisa criar a tabela manualmente no Supabase!');
        console.log('\n📋 Execute este SQL no Editor SQL do Supabase:\n');
        console.log(`
CREATE TABLE IF NOT EXISTS configs (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(255) UNIQUE NOT NULL,
  valor TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_configs_chave ON configs(chave);
        `);
        console.log('\n🌐 Acesse: https://supabase.com/dashboard/project/[seu-projeto]/editor\n');
        process.exit(1);
      }
    }

    console.log('✅ Tabela configs criada/verificada com sucesso!');

    // Inserir configurações padrão
    console.log('\n📝 Inserindo configurações padrão...\n');

    const defaultConfigs = [
      { chave: 'bot_auto_cadastro_entrar', valor: 'false' },
      { chave: 'bot_auto_cadastro_mensagem', valor: 'false' },
      { chave: 'bot_comando_registrar', valor: 'true' },
      { chave: 'bot_mensagem_boas_vindas', valor: '' },
      { chave: 'bot_remocao_automatica', valor: 'true' },
      { chave: 'bot_horario_remocao', valor: '03:00' },
      { chave: 'bot_grupo_principal', valor: '-1002242190548' },
      { chave: 'bot_webhook_url', valor: '' },
    ];

    for (const config of defaultConfigs) {
      const { error } = await supabase
        .from('configs')
        .upsert(config, { onConflict: 'chave' });

      if (error) {
        console.log(`⚠️  ${config.chave}: ${error.message}`);
      } else {
        console.log(`✅ ${config.chave}`);
      }
    }

    console.log('\n✅ Configurações padrão inseridas!');
    console.log('\n🎉 Migração concluída com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro ao criar tabela:', error.message);
    console.log('\n📋 Crie a tabela manualmente no Supabase com este SQL:\n');
    console.log(`
CREATE TABLE IF NOT EXISTS configs (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(255) UNIQUE NOT NULL,
  valor TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_configs_chave ON configs(chave);
    `);
    process.exit(1);
  }
}

createConfigsTable();
