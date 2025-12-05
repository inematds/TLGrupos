-- Script para corrigir a exclusão de membros
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar constraint de email único
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_email_unique;
ALTER TABLE members ADD CONSTRAINT members_email_unique UNIQUE (email);

-- 2. Modificar a constraint de foreign key na tabela logs
-- para deletar em cascata quando um membro for excluído
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_member_id_fkey;
ALTER TABLE logs
  ADD CONSTRAINT logs_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;

-- 3. Modificar a constraint de foreign key na tabela payments
-- para deletar em cascata quando um membro for excluído
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_member_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;

-- Verificar as constraints criadas
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table,
  confdeltype AS on_delete_action
FROM pg_constraint
WHERE conname LIKE '%member_id_fkey%'
  OR conname LIKE '%email_unique%';
