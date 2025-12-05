# Como Corrigir o Problema de Exclusão de Membros

## Problema
Ao tentar excluir um membro, aparece o erro:
```
insert or update on table "logs" violates foreign key constraint "logs_member_id_fkey"
```

## Solução

Execute o script SQL abaixo no **SQL Editor** do Supabase:

### Passo 1: Acesse o Supabase Dashboard
1. Vá para https://supabase.com
2. Entre no seu projeto
3. Clique em "SQL Editor" no menu lateral

### Passo 2: Execute o Script
Copie e cole o conteúdo do arquivo `fix-member-deletion.sql` ou o SQL abaixo:

```sql
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
```

### Passo 3: Clique em "Run"

Após executar, você verá uma confirmação das constraints criadas.

## O que isso faz?

1. **Email Único**: Adiciona constraint para que cada email seja único no sistema
2. **Deleção em Cascata para Logs**: Quando um membro for deletado, todos os logs relacionados serão automaticamente deletados
3. **Deleção em Cascata para Pagamentos**: Quando um membro for deletado, todos os pagamentos relacionados serão automaticamente deletados

## Testando

Após executar o script, tente deletar um membro novamente. Agora deve funcionar sem erros!

---

**IMPORTANTE**: Depois de executar esse script, quando você deletar um membro:
- ✅ O membro será excluído permanentemente
- ✅ Todos os logs do membro serão deletados automaticamente
- ✅ Todos os pagamentos do membro serão deletados automaticamente

Esta é uma ação **irreversível**!
