# 📋 EXECUTAR SQL PARA CADASTROS PENDENTES

## ⚠️ IMPORTANTE

Esta coluna integra o sistema de PIX com upload ao sistema de planos.

## 🔗 ACESSE O SUPABASE

1. Abra: https://supabase.com/dashboard/project/xetowlvhhnxewvglxklo/editor
2. Clique em **SQL Editor** no menu lateral
3. Clique em **+ New Query**
4. Cole o SQL abaixo e clique em **Run**

---

## 📝 SQL PARA EXECUTAR

```sql
-- Add plan_id to cadastros_pendentes

-- Add plan_id column
ALTER TABLE public.cadastros_pendentes
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cadastros_pendentes_plan_id ON public.cadastros_pendentes(plan_id);

-- Add comment
COMMENT ON COLUMN public.cadastros_pendentes.plan_id IS 'Referência ao plano selecionado (novo sistema)';
COMMENT ON COLUMN public.cadastros_pendentes.plano_dias IS 'Dias do plano (compatibilidade - usar plan_id quando disponível)';
```

---

## ✅ APÓS EXECUTAR

O sistema de PIX com upload estará integrado com os planos dinâmicos!

---

## 🔍 VERIFICAR SE FUNCIONOU

Execute no SQL Editor:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cadastros_pendentes'
AND column_name = 'plan_id';
```

Deve mostrar a coluna `plan_id`.
