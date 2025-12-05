-- Adicionar coluna invite_link na tabela payments
-- Execute este script no SQL Editor do Supabase

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS invite_link TEXT;

-- Criar índice para buscar por link (opcional, para performance)
CREATE INDEX IF NOT EXISTS idx_payments_invite_link ON payments(invite_link);

-- Verificar resultado
SELECT
  id,
  member_id,
  status,
  invite_link,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 5;
