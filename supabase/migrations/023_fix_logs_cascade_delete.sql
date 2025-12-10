-- Migration: Fix logs foreign key to cascade delete
-- Quando um membro é deletado, todos os logs relacionados devem ser deletados automaticamente

-- 1. Dropar a constraint existente
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_member_id_fkey;

-- 2. Recriar com ON DELETE CASCADE
ALTER TABLE logs
  ADD CONSTRAINT logs_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;

-- 3. Fazer o mesmo para payments se existir
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_member_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;

-- 4. Fazer o mesmo para invites se existir
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_member_id_fkey;
ALTER TABLE invites
  ADD CONSTRAINT invites_member_id_fkey
  FOREIGN KEY (member_id)
  REFERENCES members(id)
  ON DELETE CASCADE;
