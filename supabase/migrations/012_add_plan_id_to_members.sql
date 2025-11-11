-- Migration 012: Add plan_id to members table
-- Vincula membros aos planos de acesso

-- Add plan_id column to members
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_members_plan_id ON public.members(plan_id);

-- Add comment
COMMENT ON COLUMN public.members.plan_id IS 'Referência ao plano de acesso contratado pelo membro';

-- Update existing members to set a default plan (Mensal)
-- Only if they don't have a plan assigned yet
UPDATE public.members
SET plan_id = (SELECT id FROM public.plans WHERE nome = 'Mensal' LIMIT 1)
WHERE plan_id IS NULL
  AND status = 'ativo';
