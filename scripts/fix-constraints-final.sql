-- Script FINAL para corrigir constraints sem mexer em triggers
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar constraints atuais ANTES da alteração
SELECT
  'ANTES:' as momento,
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS on_delete_action
FROM pg_constraint
WHERE conname LIKE '%member_id_fkey%' OR conname LIKE '%email_unique%';

-- 2. Modificar as foreign keys para CASCADE na tabela LOGS
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_member_id_fkey CASCADE;
ALTER TABLE logs
  ADD CONSTRAINT logs_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;

-- 3. Modificar as foreign keys para CASCADE na tabela PAYMENTS
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_member_id_fkey CASCADE;
ALTER TABLE payments
  ADD CONSTRAINT payments_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;

-- 4. Adicionar constraint de email único (permite NULL)
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_email_unique;
ALTER TABLE members ADD CONSTRAINT members_email_unique UNIQUE (email);

-- 5. Verificar constraints DEPOIS da alteração
SELECT
  'DEPOIS:' as momento,
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS on_delete_action
FROM pg_constraint
WHERE conname LIKE '%member_id_fkey%' OR conname LIKE '%email_unique%';

-- 6. Mensagem de sucesso
SELECT 'Constraints atualizadas com sucesso!' as status,
       'Agora você pode deletar membros sem erros de foreign key' as mensagem;
