/**
 * Cria tabela de configurações do sistema
 * Permite configurar URL do cadastro e outras configurações globais
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltam variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createConfigTable() {
  console.log('🔧 Criando tabela de configurações...\n');

  try {
    // Executar SQL para criar tabela
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Tabela de configurações do sistema
        CREATE TABLE IF NOT EXISTS system_config (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chave VARCHAR(100) UNIQUE NOT NULL,
          valor TEXT,
          descricao TEXT,
          tipo VARCHAR(50) DEFAULT 'text',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Índice para busca rápida por chave
        CREATE INDEX IF NOT EXISTS idx_system_config_chave ON system_config(chave);

        -- Inserir configuração padrão para URL do cadastro
        INSERT INTO system_config (chave, valor, descricao, tipo)
        VALUES
          ('cadastro_url', 'http://157.180.72.42/cadastro', 'URL completa da página de cadastro (pode ser externa)', 'url'),
          ('cadastro_externo', 'false', 'Se true, usa URL externa. Se false, usa URL do sistema', 'boolean'),
          ('nome_sistema', 'TLGrupos', 'Nome do sistema exibido nos formulários', 'text')
        ON CONFLICT (chave) DO NOTHING;

        COMMENT ON TABLE system_config IS 'Configurações globais do sistema';
        COMMENT ON COLUMN system_config.chave IS 'Chave única da configuração';
        COMMENT ON COLUMN system_config.valor IS 'Valor da configuração em formato texto';
        COMMENT ON COLUMN system_config.tipo IS 'Tipo de dado: text, url, boolean, number, json';
      `
    });

    if (createError) {
      // Tentar método alternativo (SQL direto via API REST não funciona em Supabase)
      // Vamos criar via query SQL simples
      console.log('⚠️  Método RPC não disponível, criando manualmente...');

      // Como não temos RPC, vamos criar a estrutura via código
      const sqlStatements = [
        `CREATE TABLE IF NOT EXISTS system_config (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chave VARCHAR(100) UNIQUE NOT NULL,
          valor TEXT,
          descricao TEXT,
          tipo VARCHAR(50) DEFAULT 'text',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        `CREATE INDEX IF NOT EXISTS idx_system_config_chave ON system_config(chave)`,
      ];

      console.log('📝 Execute os seguintes comandos SQL no Supabase Dashboard (SQL Editor):\n');
      console.log('─'.repeat(80));
      sqlStatements.forEach(sql => console.log(sql + ';\n'));
      console.log(`INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES
  ('cadastro_url', 'http://157.180.72.42/cadastro', 'URL completa da página de cadastro (pode ser externa)', 'url'),
  ('cadastro_externo', 'false', 'Se true, usa URL externa. Se false, usa URL do sistema', 'boolean'),
  ('nome_sistema', 'TLGrupos', 'Nome do sistema exibido nos formulários', 'text')
ON CONFLICT (chave) DO NOTHING;`);
      console.log('─'.repeat(80));
      console.log('\n');
    }

    // Inserir configurações padrão via insert direto
    const configs = [
      {
        chave: 'cadastro_url',
        valor: 'http://157.180.72.42/cadastro',
        descricao: 'URL completa da página de cadastro (pode ser externa)',
        tipo: 'url'
      },
      {
        chave: 'cadastro_externo',
        valor: 'false',
        descricao: 'Se true, usa URL externa. Se false, usa URL do sistema',
        tipo: 'boolean'
      },
      {
        chave: 'nome_sistema',
        valor: 'TLGrupos',
        descricao: 'Nome do sistema exibido nos formulários',
        tipo: 'text'
      }
    ];

    console.log('📝 Inserindo configurações padrão...\n');

    for (const config of configs) {
      const { data, error } = await supabase
        .from('system_config')
        .upsert(config, { onConflict: 'chave', ignoreDuplicates: false })
        .select();

      if (error) {
        console.log(`⚠️  ${config.chave}: ${error.message}`);
      } else {
        console.log(`✅ ${config.chave}: ${config.valor}`);
      }
    }

    console.log('\n✅ Tabela de configurações criada com sucesso!\n');

    // Verificar configurações criadas
    const { data: allConfigs, error: selectError } = await supabase
      .from('system_config')
      .select('*')
      .order('chave');

    if (!selectError && allConfigs) {
      console.log('📋 Configurações atuais:');
      console.log('─'.repeat(80));
      allConfigs.forEach(cfg => {
        console.log(`${cfg.chave.padEnd(25)} = ${cfg.valor}`);
        console.log(`${''.padEnd(25)}   (${cfg.descricao})`);
      });
      console.log('─'.repeat(80));
    }

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    process.exit(1);
  }
}

createConfigTable();
