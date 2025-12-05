-- ============================================
-- SCRIPT DEFINITIVO - Execute linha por linha
-- ============================================

-- Passo 1: Verificar estado ATUAL das constraints
SELECT
  conname,
  conrelid::regclass AS tabela,
  CASE confdeltype
    WHEN 'c' THEN 'CASCADE'
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'n' THEN 'SET NULL'
    ELSE 'OUTRO'
  END as on_delete
FROM pg_constraint
WHERE conname IN ('logs_member_id_fkey', 'payments_member_id_fkey');

-- Passo 2: CORRIGIR constraint da tabela LOGS
ALTER TABLE logs
  DROP CONSTRAINT IF EXISTS logs_member_id_fkey CASCADE;

ALTER TABLE logs
  ADD CONSTRAINT logs_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;

-- Passo 3: CORRIGIR constraint da tabela PAYMENTS
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_member_id_fkey CASCADE;

ALTER TABLE payments
  ADD CONSTRAINT payments_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;

-- Passo 4: Adicionar EMAIL ÚNICO
ALTER TABLE members
  DROP CONSTRAINT IF EXISTS members_email_unique;

ALTER TABLE members
  ADD CONSTRAINT members_email_unique
  UNIQUE (email);

-- Passo 5: VERIFICAR que ficou correto
SELECT
  conname,
  conrelid::regclass AS tabela,
  CASE confdeltype
    WHEN 'c' THEN 'CASCADE - OK!'
    WHEN 'a' THEN 'NO ACTION - ERRO'
    WHEN 'r' THEN 'RESTRICT - ERRO'
    WHEN 'n' THEN 'SET NULL - ERRO'
    ELSE 'OUTRO - ERRO'
  END as on_delete
FROM pg_constraint
WHERE conname IN ('logs_member_id_fkey', 'payments_member_id_fkey');

-- Se a coluna "on_delete" mostrar "CASCADE - OK!" está correto!
