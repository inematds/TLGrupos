-- Migration: Adicionar campos de perfil completo do usuário
-- Data: 2025-11-21

-- Adicionar novos campos à tabela members
ALTER TABLE members ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS nicho TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS interesse TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS grupo_favorito TEXT;

-- Criar índices para melhor performance em buscas
CREATE INDEX IF NOT EXISTS idx_members_cidade ON members(cidade);
CREATE INDEX IF NOT EXISTS idx_members_uf ON members(uf);
CREATE INDEX IF NOT EXISTS idx_members_nicho ON members(nicho);

-- Adicionar comentários para documentação
COMMENT ON COLUMN members.cidade IS 'Cidade onde o membro reside';
COMMENT ON COLUMN members.uf IS 'Estado (UF) onde o membro reside';
COMMENT ON COLUMN members.data_nascimento IS 'Data de nascimento do membro';
COMMENT ON COLUMN members.nicho IS 'Nicho de interesse/atuação do membro';
COMMENT ON COLUMN members.interesse IS 'Principais interesses do membro';
COMMENT ON COLUMN members.grupo_favorito IS 'Grupo favorito do membro no Telegram';
