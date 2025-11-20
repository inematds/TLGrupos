const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Carregar .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🔄 Criando tabelas telegram_groups e member_groups...');

  try {
    // Testar se conseguimos inserir
    const { data: testData, error: testError } = await supabase
      .from('telegram_groups')
      .select('*')
      .limit(1);

    if (testError && testError.message.includes('does not exist')) {
      console.log('❌ Tabela não existe no banco.');
      console.log('\n📋 Execute o SQL abaixo no Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/xetowlvhhnxewvglxklo/sql/new');
      console.log('\n');
      console.log('--- COPIE E COLE ESTE SQL ---\n');

      const sql = `
-- Tabela de grupos Telegram
CREATE TABLE IF NOT EXISTS telegram_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telegram_group_id TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  auto_removal_enabled BOOLEAN DEFAULT TRUE,
  removal_schedule_hour INTEGER DEFAULT 0,
  removal_schedule_minute INTEGER DEFAULT 0,
  total_membros INTEGER DEFAULT 0,
  ultimo_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_groups_ativo ON telegram_groups(ativo);
CREATE INDEX IF NOT EXISTS idx_telegram_groups_telegram_id ON telegram_groups(telegram_group_id);

CREATE TRIGGER telegram_groups_updated_at
BEFORE UPDATE ON telegram_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir grupo padrão
INSERT INTO telegram_groups (nome, telegram_group_id, descricao, ativo, auto_removal_enabled)
VALUES (
  'Grupo Principal',
  '-1002414487357',
  'Grupo principal de membros',
  TRUE,
  TRUE
)
ON CONFLICT (telegram_group_id) DO NOTHING;

-- Tabela de relacionamento membro-grupo
CREATE TABLE IF NOT EXISTS member_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES telegram_groups(id) ON DELETE CASCADE,
  status_no_grupo TEXT DEFAULT 'ativo',
  data_adicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_remocao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_member_groups_member ON member_groups(member_id);
CREATE INDEX IF NOT EXISTS idx_member_groups_group ON member_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_member_groups_status ON member_groups(status_no_grupo);

CREATE TRIGGER member_groups_updated_at
BEFORE UPDATE ON member_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Migrar dados existentes
INSERT INTO member_groups (member_id, group_id, status_no_grupo)
SELECT
  m.id as member_id,
  tg.id as group_id,
  CASE
    WHEN m.status = 'ativo' THEN 'ativo'
    WHEN m.status = 'vencido' THEN 'removido'
    ELSE 'ativo'
  END as status_no_grupo
FROM members m
CROSS JOIN telegram_groups tg
WHERE tg.telegram_group_id = '-1002414487357'
ON CONFLICT (member_id, group_id) DO NOTHING;
`;

      console.log(sql);
      console.log('\n--- FIM DO SQL ---\n');
      process.exit(1);
    }

    console.log('✅ Tabela já existe!');

    // Verificar se tem o grupo padrão
    const { data: groups, error: groupError } = await supabase
      .from('telegram_groups')
      .select('*');

    if (groups && groups.length > 0) {
      console.log(`\n✅ ${groups.length} grupo(s) encontrado(s):`);
      groups.forEach(g => {
        console.log(`   - ${g.nome} (${g.telegram_group_id})`);
      });
    } else {
      console.log('\n⚠️  Nenhum grupo encontrado. Adicione um grupo no dashboard.');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createTables();
