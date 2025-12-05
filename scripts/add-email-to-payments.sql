-- Script para adicionar colunas de email e data_vencimento na tabela payments
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna email na tabela payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Adicionar coluna data_vencimento na tabela payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS data_vencimento TIMESTAMP WITH TIME ZONE;

-- 3. Preencher a coluna email com os emails dos membros existentes
UPDATE payments
SET email = members.email
FROM members
WHERE payments.member_id = members.id
  AND payments.email IS NULL;

-- 4. Preencher a coluna data_vencimento com as datas dos membros existentes
UPDATE payments
SET data_vencimento = members.data_vencimento
FROM members
WHERE payments.member_id = members.id
  AND payments.data_vencimento IS NULL;

-- 5. Verificar resultado
SELECT
  id,
  member_id,
  email,
  data_vencimento,
  valor,
  dias_acesso,
  status,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 10;
