# 📋 EXECUTAR SQL PARA CRIAR TABELA DE PLANOS

## ⚠️ IMPORTANTE

A tabela `plans` precisa ser criada manualmente no Supabase Dashboard.

## 🔗 ACESSE O SUPABASE

1. Abra: https://supabase.com/dashboard/project/xetowlvhhnxewvglxklo/editor
2. Clique em **SQL Editor** no menu lateral
3. Clique em **+ New Query**
4. Cole o SQL abaixo e clique em **Run**

---

## 📝 SQL PARA EXECUTAR

```sql
-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL,
    duracao_dias INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on ativo and ordem for faster queries
CREATE INDEX IF NOT EXISTS idx_plans_ativo_ordem ON public.plans(ativo, ordem);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policies (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'plans' AND policyname = 'Allow read access to all authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to all authenticated users"
            ON public.plans
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'plans' AND policyname = 'Allow full access to service role'
    ) THEN
        CREATE POLICY "Allow full access to service role"
            ON public.plans
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default plans
INSERT INTO public.plans (nome, descricao, valor, duracao_dias, ordem) VALUES
    ('Mensal', 'Acesso por 30 dias', 29.90, 30, 1),
    ('Trimestral', 'Acesso por 90 dias (economia de 15%)', 76.90, 90, 2),
    ('Semestral', 'Acesso por 180 dias (economia de 25%)', 134.90, 180, 3),
    ('Anual', 'Acesso por 365 dias (economia de 40%)', 215.00, 365, 4)
ON CONFLICT DO NOTHING;
```

---

## ✅ APÓS EXECUTAR

1. A tabela `plans` será criada com 4 planos padrão
2. Acesse: http://localhost:3020/dashboard/planos
3. Você verá os planos listados e poderá criar/editar novos

---

## 🎯 PLANOS PADRÃO CRIADOS

| Nome | Valor | Duração | Descrição |
|------|-------|---------|-----------|
| Mensal | R$ 29,90 | 30 dias | Acesso por 30 dias |
| Trimestral | R$ 76,90 | 90 dias | Acesso por 90 dias (economia de 15%) |
| Semestral | R$ 134,90 | 180 dias | Acesso por 180 dias (economia de 25%) |
| Anual | R$ 215,00 | 365 dias | Acesso por 365 dias (economia de 40%) |

---

## 🔍 VERIFICAR SE FUNCIONOU

Execute no SQL Editor:

```sql
SELECT * FROM public.plans ORDER BY ordem;
```

Deve retornar 4 planos.
