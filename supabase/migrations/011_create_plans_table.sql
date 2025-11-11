-- Migration 011: Create Plans Table
-- Sistema de Planos de Acesso

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
CREATE INDEX idx_plans_ativo_ordem ON public.plans(ativo, ordem);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all authenticated users"
    ON public.plans
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow full access to service role"
    ON public.plans
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Add comments
COMMENT ON TABLE public.plans IS 'Planos de acesso disponíveis para membros';
COMMENT ON COLUMN public.plans.nome IS 'Nome do plano (ex: Mensal, Anual)';
COMMENT ON COLUMN public.plans.descricao IS 'Descrição do plano';
COMMENT ON COLUMN public.plans.valor IS 'Valor em reais do plano';
COMMENT ON COLUMN public.plans.duracao_dias IS 'Duração do plano em dias';
COMMENT ON COLUMN public.plans.ativo IS 'Se o plano está disponível para compra';
COMMENT ON COLUMN public.plans.ordem IS 'Ordem de exibição (menor = primeiro)';
