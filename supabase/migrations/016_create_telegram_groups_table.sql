-- Migration: Tabela de grupos Telegram
-- Data: 2025-01-19
-- Motivo: Suportar múltiplos grupos Telegram no sistema

CREATE TABLE IF NOT EXISTS telegram_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telegram_group_id TEXT NOT NULL UNIQUE, -- ID do grupo no Telegram (ex: -1002414487357)
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,

  -- Configurações do grupo
  auto_removal_enabled BOOLEAN DEFAULT TRUE, -- Habilitar remoção automática
  removal_schedule_hour INTEGER DEFAULT 0, -- Hora da remoção (0-23)
  removal_schedule_minute INTEGER DEFAULT 0, -- Minuto da remoção (0, 15, 30, 45)

  -- Estatísticas
  total_membros INTEGER DEFAULT 0,
  ultimo_sync TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_telegram_groups_ativo ON telegram_groups(ativo);
CREATE INDEX IF NOT EXISTS idx_telegram_groups_telegram_id ON telegram_groups(telegram_group_id);

-- Trigger para updated_at
CREATE TRIGGER telegram_groups_updated_at
BEFORE UPDATE ON telegram_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir grupo padrão (usando o ID atual do .env.local)
INSERT INTO telegram_groups (nome, telegram_group_id, descricao, ativo, auto_removal_enabled)
VALUES (
  'Grupo Principal',
  '-1002414487357',
  'Grupo principal de membros',
  TRUE,
  TRUE
)
ON CONFLICT (telegram_group_id) DO NOTHING;

-- Comentários
COMMENT ON TABLE telegram_groups IS 'Grupos Telegram gerenciados pelo sistema';
COMMENT ON COLUMN telegram_groups.telegram_group_id IS 'ID do grupo no Telegram (ex: -1002414487357)';
COMMENT ON COLUMN telegram_groups.auto_removal_enabled IS 'Se TRUE, remove membros vencidos automaticamente';
COMMENT ON COLUMN telegram_groups.removal_schedule_hour IS 'Hora da execução automática (0-23)';
COMMENT ON COLUMN telegram_groups.removal_schedule_minute IS 'Minuto da execução automática (0, 15, 30, 45)';
