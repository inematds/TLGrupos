const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTable() {
  console.log('🔍 Verificando se tabela invites existe...\n');

  // Tentar fazer uma query SQL direta para verificar
  try {
    // Tentar buscar informações da tabela usando information_schema
    const { data, error } = await supabase
      .from('invites')
      .select('count');

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        console.log('❌ Confirmado: A tabela invites NÃO existe no banco de dados\n');
        console.log('📋 Você DEVE executar este SQL no Supabase SQL Editor:\n');
        console.log('='.repeat(70));
        console.log(`
-- Criar tabela invites
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  invite_link TEXT NOT NULL,
  
  telegram_sent BOOLEAN DEFAULT false,
  telegram_sent_at TIMESTAMPTZ,
  telegram_error TEXT,
  
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_invites_member_id ON invites(member_id);
CREATE INDEX idx_invites_used ON invites(used);
CREATE INDEX idx_invites_expires_at ON invites(expires_at);
CREATE INDEX idx_invites_created_at ON invites(created_at DESC);

-- Habilitar RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Permitir acesso total para service_role
CREATE POLICY "Enable all access for service role"
  ON invites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Testar
SELECT COUNT(*) FROM invites;
        `);
        console.log('='.repeat(70));
        console.log('\n🔗 Link direto:');
        console.log('https://supabase.com/dashboard/project/xetowlvhhnxewvglxklo/sql/new\n');
      } else {
        console.log('❌ Erro desconhecido:', error.message);
      }
    } else {
      console.log('✅ A tabela invites existe!');
    }
  } catch (err) {
    console.log('❌ Erro ao verificar:', err.message);
  }
}

checkAndCreateTable();
