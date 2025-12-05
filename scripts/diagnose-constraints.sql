-- Script para diagnosticar o estado atual das constraints
-- Execute este script no SQL Editor do Supabase

-- Verificar TODAS as constraints de foreign key relacionadas a members
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS constraint_definition,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS on_delete_action
FROM pg_constraint
WHERE confrelid = 'members'::regclass
   OR conrelid IN ('logs'::regclass, 'payments'::regclass)
ORDER BY table_name, constraint_name;
