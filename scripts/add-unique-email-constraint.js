const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addUniqueEmailConstraint() {
  try {
    console.log('🔧 Adicionando constraint de email único na tabela members...');

    // Executar SQL diretamente para adicionar a constraint
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Remover constraint se já existir
        ALTER TABLE members DROP CONSTRAINT IF EXISTS members_email_unique;

        -- Adicionar constraint de email único (permitindo NULL)
        ALTER TABLE members ADD CONSTRAINT members_email_unique UNIQUE (email);
      `
    });

    if (error) {
      console.error('❌ Erro ao adicionar constraint:', error.message);

      // Tentar método alternativo
      console.log('⚠️  Tentando método alternativo...');
      console.log('Execute manualmente no SQL Editor do Supabase:');
      console.log(`
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_email_unique;
ALTER TABLE members ADD CONSTRAINT members_email_unique UNIQUE (email);
      `);

      return;
    }

    console.log('✅ Constraint de email único adicionada com sucesso!');
    console.log('   Agora o campo email deve ser único para cada membro.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

addUniqueEmailConstraint();
