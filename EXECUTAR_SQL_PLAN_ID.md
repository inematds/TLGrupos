# 📋 EXECUTAR SQL PARA ADICIONAR PLAN_ID

## ⚠️ IMPORTANTE

A coluna `plan_id` precisa ser adicionada manualmente na tabela `members`.

## 🔗 ACESSE O SUPABASE

1. Abra: https://supabase.com/dashboard/project/xetowlvhhnxewvglxklo/editor
2. Clique em **SQL Editor** no menu lateral
3. Clique em **+ New Query**
4. Cole o SQL abaixo e clique em **Run**

---

## 📝 SQL PARA EXECUTAR

```sql
-- Add plan_id column to members table
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_members_plan_id ON public.members(plan_id);

-- Add comment
COMMENT ON COLUMN public.members.plan_id IS 'Referência ao plano de acesso contratado pelo membro';

-- Update existing active members to set default plan (Mensal)
UPDATE public.members
SET plan_id = (SELECT id FROM public.plans WHERE nome = 'Mensal' LIMIT 1)
WHERE plan_id IS NULL
  AND status = 'ativo';
```

---

## ✅ APÓS EXECUTAR

A coluna `plan_id` será adicionada à tabela `members` e todos os membros ativos existentes serão vinculados ao plano "Mensal" por padrão.

---

## 🔍 VERIFICAR SE FUNCIONOU

Execute no SQL Editor:

```sql
SELECT id, nome, plan_id FROM public.members LIMIT 5;
```

Deve mostrar a coluna `plan_id` com valores ou NULL.
