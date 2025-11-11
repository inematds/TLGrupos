-- Migration: Adicionar coluna no_grupo para rastrear se membro está no grupo

ALTER TABLE members ADD COLUMN IF NOT EXISTS no_grupo BOOLEAN DEFAULT false;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_members_no_grupo ON members(no_grupo);

COMMENT ON COLUMN members.no_grupo IS 'Indica se o membro está atualmente no grupo do Telegram';
