-- Migration: Tornar telegram_user_id nullable para suportar cadastro público
-- Data: 2025-01-10
-- Motivo: Permitir cadastro de membros sem telegram_user_id no registro público

-- Remover a constraint NOT NULL de telegram_user_id
ALTER TABLE members ALTER COLUMN telegram_user_id DROP NOT NULL;

-- Remover a constraint UNIQUE de telegram_user_id e recriar como UNIQUE apenas para valores não nulos
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_telegram_user_id_key;

-- Criar índice UNIQUE parcial (apenas para valores não nulos)
CREATE UNIQUE INDEX members_telegram_user_id_unique
ON members(telegram_user_id)
WHERE telegram_user_id IS NOT NULL;

-- Atualizar comentário da coluna
COMMENT ON COLUMN members.telegram_user_id IS 'ID do usuário no Telegram (opcional para cadastro público)';
