-- Migration: Adicionar campos de perfil em cadastros_pendentes
-- Data: 2025-11-21

-- Adicionar novos campos à tabela cadastros_pendentes
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS nicho TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS interesse TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS grupo_favorito TEXT;

-- Comentários
COMMENT ON COLUMN cadastros_pendentes.cidade IS 'Cidade onde o candidato reside';
COMMENT ON COLUMN cadastros_pendentes.uf IS 'Estado (UF) onde o candidato reside';
COMMENT ON COLUMN cadastros_pendentes.data_nascimento IS 'Data de nascimento do candidato';
COMMENT ON COLUMN cadastros_pendentes.nicho IS 'Nicho de interesse/atuação do candidato';
COMMENT ON COLUMN cadastros_pendentes.interesse IS 'Principais interesses do candidato';
COMMENT ON COLUMN cadastros_pendentes.grupo_favorito IS 'Grupo favorito do candidato no Telegram';
