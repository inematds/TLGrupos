-- Migration: Add plan_id to cadastros_pendentes
-- Created: 2025-01-10
-- Description: Integra cadastros pendentes com sistema de planos

-- Add plan_id column
ALTER TABLE public.cadastros_pendentes
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cadastros_pendentes_plan_id ON public.cadastros_pendentes(plan_id);

-- Add comment
COMMENT ON COLUMN public.cadastros_pendentes.plan_id IS 'Referência ao plano selecionado (novo sistema)';
COMMENT ON COLUMN public.cadastros_pendentes.plano_dias IS 'Dias do plano (compatibilidade - usar plan_id quando disponível)';
