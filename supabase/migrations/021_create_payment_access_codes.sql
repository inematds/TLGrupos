-- Migration: Sistema de códigos de acesso por pagamento
-- Tabela: payment_access_codes
-- Descrição: Armazena links de acesso gerados após aprovação de pagamentos
-- Data: 2025-12-04

-- Criar tabela payment_access_codes
CREATE TABLE IF NOT EXISTS payment_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link único gerado pelo Telegram (identificador principal)
  invite_link TEXT UNIQUE NOT NULL,

  -- Tipo de acesso
  tipo TEXT NOT NULL DEFAULT 'pagamento',

  -- Relacionamentos (TODOS obrigatórios)
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES telegram_groups(id) ON DELETE CASCADE,

  -- Dados do usuário (snapshot no momento da geração)
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT,
  usuario_telefone TEXT,
  usuario_telegram_id BIGINT,

  -- Datas (COPIADAS da tabela payments, NÃO calculadas)
  data_geracao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_vencimento_acesso TIMESTAMP NOT NULL,  -- CÓPIA de payments.data_vencimento
  dias_acesso INTEGER NOT NULL,               -- CÓPIA de payments.dias_acesso

  -- Controle de uso
  usado BOOLEAN DEFAULT FALSE,
  data_acesso TIMESTAMP,                      -- APENAS registra quando usuário entra
  telegram_user_id_acesso BIGINT,             -- ID do Telegram de quem usou o link

  -- Status e controle
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'usado', 'expirado', 'revogado')),
  revogado BOOLEAN DEFAULT FALSE,
  data_revogacao TIMESTAMP,
  revogado_por TEXT,
  motivo_revogacao TEXT,

  -- Snapshot de informações do pagamento
  valor_pago DECIMAL(10,2),
  forma_pagamento TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_access_codes_invite_link ON payment_access_codes(invite_link);
CREATE INDEX IF NOT EXISTS idx_payment_access_codes_member_id ON payment_access_codes(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_access_codes_payment_id ON payment_access_codes(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_access_codes_group_id ON payment_access_codes(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_access_codes_status ON payment_access_codes(status);
CREATE INDEX IF NOT EXISTS idx_payment_access_codes_usado ON payment_access_codes(usado);
CREATE INDEX IF NOT EXISTS idx_payment_access_codes_data_vencimento ON payment_access_codes(data_vencimento_acesso);
CREATE INDEX IF NOT EXISTS idx_payment_access_codes_telegram_user_id ON payment_access_codes(telegram_user_id_acesso);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_payment_access_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_access_codes_updated_at
  BEFORE UPDATE ON payment_access_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_access_codes_updated_at();

-- Adicionar colunas à tabela payments para rastreamento de acesso
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_acessado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS data_acesso TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS entrada_confirmada BOOLEAN DEFAULT FALSE;

-- Adicionar colunas à tabela members para histórico de acessos
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_primeiro_acesso TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_ultimo_acesso TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_acessos INTEGER DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_valor DECIMAL(10,2);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_data TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_forma TEXT;

-- Comentários
COMMENT ON TABLE payment_access_codes IS 'Links de acesso gerados após aprovação de pagamentos';
COMMENT ON COLUMN payment_access_codes.invite_link IS 'Link único gerado pelo Telegram Bot API (identificador principal)';
COMMENT ON COLUMN payment_access_codes.data_vencimento_acesso IS 'CÓPIA de payments.data_vencimento - quando o acesso expira';
COMMENT ON COLUMN payment_access_codes.dias_acesso IS 'CÓPIA de payments.dias_acesso - quantidade de dias de acesso';
COMMENT ON COLUMN payment_access_codes.data_acesso IS 'Quando o usuário efetivamente entrou no grupo (APENAS registro)';
COMMENT ON COLUMN payment_access_codes.usado IS 'Se o link já foi utilizado para entrada';
COMMENT ON COLUMN payment_access_codes.status IS 'Status: ativo, usado, expirado, revogado';

-- RLS (Row Level Security)
ALTER TABLE payment_access_codes ENABLE ROW LEVEL SECURITY;

-- Política: Service role pode fazer tudo
CREATE POLICY "Service role can do everything on payment_access_codes"
  ON payment_access_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Política: Usuários podem ver seus próprios códigos
CREATE POLICY "Users can view own payment_access_codes"
  ON payment_access_codes FOR SELECT
  USING (auth.uid() IS NOT NULL);
