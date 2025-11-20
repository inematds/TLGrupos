-- Migration: Adicionar suporte a múltiplos grupos para membros
-- Data: 2025-01-19
-- Motivo: Permitir que um membro esteja em vários grupos

-- Adicionar coluna group_id na tabela members (opcional, para compatibilidade)
ALTER TABLE members ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES telegram_groups(id);

-- Criar tabela de relacionamento muitos-para-muitos
CREATE TABLE IF NOT EXISTS member_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES telegram_groups(id) ON DELETE CASCADE,

  -- Status específico deste membro neste grupo
  status_no_grupo TEXT DEFAULT 'ativo', -- 'ativo', 'removido', 'saiu'
  data_adicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_remocao TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id, group_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_member_groups_member ON member_groups(member_id);
CREATE INDEX IF NOT EXISTS idx_member_groups_group ON member_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_member_groups_status ON member_groups(status_no_grupo);

-- Trigger para updated_at
CREATE TRIGGER member_groups_updated_at
BEFORE UPDATE ON member_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Migrar dados existentes: associar todos os membros atuais ao grupo padrão
INSERT INTO member_groups (member_id, group_id, status_no_grupo)
SELECT
  m.id as member_id,
  tg.id as group_id,
  CASE
    WHEN m.status = 'ativo' THEN 'ativo'
    WHEN m.status = 'vencido' THEN 'removido'
    ELSE 'ativo'
  END as status_no_grupo
FROM members m
CROSS JOIN telegram_groups tg
WHERE tg.telegram_group_id = '-1002414487357' -- Grupo padrão
ON CONFLICT (member_id, group_id) DO NOTHING;

-- Comentários
COMMENT ON TABLE member_groups IS 'Relacionamento muitos-para-muitos entre membros e grupos';
COMMENT ON COLUMN member_groups.status_no_grupo IS 'Status do membro especificamente neste grupo';
