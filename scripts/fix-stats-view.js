const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStatsView() {
  console.log('🔧 Recriando a view de estatísticas...\n');

  try {
    // Drop the existing view
    console.log('1️⃣ Removendo view antiga...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP VIEW IF EXISTS stats CASCADE;'
    });

    // Since rpc might not be available, let's use raw SQL
    const dropSQL = 'DROP VIEW IF EXISTS stats CASCADE;';

    // Create the new comprehensive view
    const createSQL = `
CREATE OR REPLACE VIEW stats AS
SELECT
  -- Total geral
  (SELECT COUNT(*) FROM members) AS total_cadastros,

  -- Por status
  (SELECT COUNT(*) FROM members WHERE status = 'ativo') AS total_ativos,
  (SELECT COUNT(*) FROM members WHERE status = 'vencido') AS total_vencidos,
  (SELECT COUNT(*) FROM members WHERE status = 'removido') AS total_removidos,
  (SELECT COUNT(*) FROM members WHERE status = 'erro_remocao') AS erro_remocao,
  (SELECT COUNT(*) FROM members WHERE status = 'pausado') AS total_pausados,

  -- Ativos que estão no grupo (tem telegram_user_id)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NOT NULL) AS ativos_no_grupo,

  -- Ativos que NÃO estão no grupo (sem telegram_user_id)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NULL) AS ativos_sem_grupo,

  -- Membros que vencem nos próximos 7 dias
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento < (CURRENT_DATE + INTERVAL '7 days')
   AND data_vencimento >= CURRENT_DATE) AS vencendo_7dias,

  -- Membros ativos mas com data de vencimento passada (precisa remover)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento < CURRENT_DATE) AS ativos_mas_vencidos;
`;

    console.log('2️⃣ Criando nova view com todos os campos...');
    console.log('\nSQL sendo executado:');
    console.log(createSQL);

    // We need to execute this directly in Supabase
    // Let's create a file that can be executed manually
    const fs = require('fs');
    const sqlFile = `
-- Script para recriar view de estatísticas
-- Execute este SQL diretamente no Supabase SQL Editor

${dropSQL}

${createSQL}

-- Verificar a view
SELECT * FROM stats;
`;

    fs.writeFileSync('fix-stats-view.sql', sqlFile);
    console.log('\n✅ Arquivo SQL criado: fix-stats-view.sql');
    console.log('📝 Execute este arquivo no Supabase SQL Editor');

    // Try to query the view after a moment
    console.log('\n3️⃣ Testando a view atual...');
    const { data, error } = await supabase
      .from('stats')
      .select('*')
      .single();

    if (error) {
      console.error('❌ Erro ao consultar view:', error.message);
      console.log('\n⚠️  Execute o arquivo fix-stats-view.sql no Supabase SQL Editor');
    } else {
      console.log('✅ Estatísticas atuais:');
      console.log(JSON.stringify(data, null, 2));

      // Check which fields are present
      const expectedFields = [
        'total_cadastros',
        'total_ativos',
        'total_vencidos',
        'total_removidos',
        'erro_remocao',
        'total_pausados',
        'ativos_no_grupo',
        'ativos_sem_grupo',
        'vencendo_7dias',
        'ativos_mas_vencidos'
      ];

      console.log('\n📊 Verificação de campos:');
      expectedFields.forEach(field => {
        const present = field in data;
        console.log(`  ${present ? '✅' : '❌'} ${field}: ${present ? data[field] : 'AUSENTE'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

fixStatsView();
