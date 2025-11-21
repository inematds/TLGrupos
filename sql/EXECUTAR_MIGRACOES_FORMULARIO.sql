-- ===============================================
-- MIGRAÇÕES PARA FORMULÁRIO DE CADASTRO COMPLETO
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xdvetjrrrifddoowuqhz/sql/new
-- ===============================================

-- ===============================================
-- MIGRAÇÃO 018: Adicionar campos de perfil em members
-- ===============================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS nicho TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS interesse TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS grupo_favorito TEXT;

CREATE INDEX IF NOT EXISTS idx_members_cidade ON members(cidade);
CREATE INDEX IF NOT EXISTS idx_members_uf ON members(uf);
CREATE INDEX IF NOT EXISTS idx_members_nicho ON members(nicho);

COMMENT ON COLUMN members.cidade IS 'Cidade onde o membro reside';
COMMENT ON COLUMN members.uf IS 'Estado (UF) onde o membro reside';
COMMENT ON COLUMN members.data_nascimento IS 'Data de nascimento do membro';
COMMENT ON COLUMN members.nicho IS 'Nicho de interesse/atuação do membro';
COMMENT ON COLUMN members.interesse IS 'Principais interesses do membro';
COMMENT ON COLUMN members.grupo_favorito IS 'Grupo favorito do membro no Telegram';

-- ===============================================
-- MIGRAÇÃO 019: Adicionar campos em cadastros_pendentes
-- ===============================================

ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS nicho TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS interesse TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS grupo_favorito TEXT;

COMMENT ON COLUMN cadastros_pendentes.cidade IS 'Cidade onde o candidato reside';
COMMENT ON COLUMN cadastros_pendentes.uf IS 'Estado (UF) onde o candidato reside';
COMMENT ON COLUMN cadastros_pendentes.data_nascimento IS 'Data de nascimento do candidato';
COMMENT ON COLUMN cadastros_pendentes.nicho IS 'Nicho de interesse/atuação do candidato';
COMMENT ON COLUMN cadastros_pendentes.interesse IS 'Principais interesses do candidato';
COMMENT ON COLUMN cadastros_pendentes.grupo_favorito IS 'Grupo favorito do candidato no Telegram';

-- ===============================================
-- FIM DAS MIGRAÇÕES
-- ===============================================
