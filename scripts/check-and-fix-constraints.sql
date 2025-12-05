-- Script para verificar e corrigir constraints e triggers
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar triggers existentes na tabela members
SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name,
  tgtype,
  tgenabled
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'members'::regclass
  AND tgisinternal = false;

-- 2. Verificar constraints atuais
SELECT
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
WHERE conname LIKE '%member_id%' OR conname LIKE '%email%';

-- 3. DESATIVAR temporariamente triggers que possam estar causando problema
-- (apenas desativa, não remove)
ALTER TABLE members DISABLE TRIGGER ALL;
ALTER TABLE logs DISABLE TRIGGER ALL;
ALTER TABLE payments DISABLE TRIGGER ALL;

-- 4. Modificar as foreign keys para CASCADE
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_member_id_fkey;
ALTER TABLE logs
  ADD CONSTRAINT logs_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_member_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;

-- 5. Adicionar constraint de email único
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_email_unique;
ALTER TABLE members ADD CONSTRAINT members_email_unique UNIQUE (email);

-- 6. RE-ATIVAR triggers
ALTER TABLE members ENABLE TRIGGER ALL;
ALTER TABLE logs ENABLE TRIGGER ALL;
ALTER TABLE payments ENABLE TRIGGER ALL;

-- 7. Verificar constraints após a alteração
SELECT
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
