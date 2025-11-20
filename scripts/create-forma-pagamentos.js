const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Carregar .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('🔄 Criando tabela forma_pagamentos...');

  try {
    // Criar a tabela
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS forma_pagamentos (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tipo TEXT NOT NULL CHECK (tipo IN ('pix', 'cartao', 'boleto', 'outro')),
          nome TEXT NOT NULL,
          ativo BOOLEAN DEFAULT TRUE,
          chave_pix TEXT,
          tipo_chave TEXT CHECK (tipo_chave IN ('email', 'telefone', 'cpf', 'cnpj', 'aleatoria')),
          email_comprovantes TEXT,
          codigo_referencia TEXT,
          descricao TEXT,
          ordem INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.log('⚠️  Tentando criar via query direta...');
      // Tentar inserir um registro para testar
      const { data: testData, error: testError } = await supabase
        .from('forma_pagamentos')
        .select('*')
        .limit(1);

      if (testError && testError.message.includes('does not exist')) {
        console.error('❌ Tabela não existe e não conseguimos criar.');
        console.log('\n📋 Execute manualmente no Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/xetowlvhhnxewvglxklo/sql/new');
        console.log('\nSQL:');
        console.log(`
CREATE TABLE IF NOT EXISTS forma_pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('pix', 'cartao', 'boleto', 'outro')),
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  chave_pix TEXT,
  tipo_chave TEXT CHECK (tipo_chave IN ('email', 'telefone', 'cpf', 'cnpj', 'aleatoria')),
  email_comprovantes TEXT,
  codigo_referencia TEXT,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forma_pagamentos_tipo ON forma_pagamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_forma_pagamentos_ativo ON forma_pagamentos(ativo);

INSERT INTO forma_pagamentos (tipo, nome, ativo, chave_pix, tipo_chave, email_comprovantes, codigo_referencia, descricao, ordem)
VALUES (
  'pix',
  'PIX Principal',
  TRUE,
  'inemapix@gmail.com',
  'email',
  'comprovantes@tlgrupos.com',
  'TLGRUPOS',
  'Conta PIX principal para recebimento de pagamentos',
  1
)
ON CONFLICT DO NOTHING;
        `);
        process.exit(1);
      }

      console.log('✅ Tabela já existe!');
    } else {
      console.log('✅ Tabela criada com sucesso!');
    }

    // Inserir registro padrão
    const { data: existing, error: checkError } = await supabase
      .from('forma_pagamentos')
      .select('*')
      .eq('tipo', 'pix')
      .single();

    if (!existing) {
      console.log('🔄 Inserindo configuração padrão...');
      const { error: insertError } = await supabase
        .from('forma_pagamentos')
        .insert([{
          tipo: 'pix',
          nome: 'PIX Principal',
          ativo: true,
          chave_pix: 'inemapix@gmail.com',
          tipo_chave: 'email',
          email_comprovantes: 'comprovantes@tlgrupos.com',
          codigo_referencia: 'TLGRUPOS',
          descricao: 'Conta PIX principal para recebimento de pagamentos',
          ordem: 1
        }]);

      if (insertError) {
        console.error('❌ Erro ao inserir:', insertError.message);
      } else {
        console.log('✅ Configuração padrão inserida!');
      }
    } else {
      console.log('✅ Configuração PIX já existe!');
    }

    console.log('\n✨ Pronto! Tabela configurada.');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createTable();
