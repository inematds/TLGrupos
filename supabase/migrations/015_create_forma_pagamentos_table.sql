-- Migration: Tabela de configuração de formas de pagamento
-- Data: 2025-01-19
-- Motivo: Centralizar configurações de PIX (chave, email, código de referência)

CREATE TABLE IF NOT EXISTS forma_pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('pix', 'cartao', 'boleto', 'outro')),
  nome TEXT NOT NULL, -- Ex: "PIX Principal", "PIX Secundário"
  ativo BOOLEAN DEFAULT TRUE,

  -- Configurações PIX
  chave_pix TEXT, -- Email, telefone, CPF ou chave aleatória
  tipo_chave TEXT CHECK (tipo_chave IN ('email', 'telefone', 'cpf', 'cnpj', 'aleatoria')),
  email_comprovantes TEXT, -- Email para onde cliente envia comprovante
  codigo_referencia TEXT, -- Código de referência para identificação

  -- Metadados
  descricao TEXT,
  ordem INTEGER DEFAULT 0, -- Ordem de exibição

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_forma_pagamentos_tipo ON forma_pagamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_forma_pagamentos_ativo ON forma_pagamentos(ativo);
CREATE INDEX IF NOT EXISTS idx_forma_pagamentos_ordem ON forma_pagamentos(ordem);

-- Trigger para updated_at
CREATE TRIGGER forma_pagamentos_updated_at
BEFORE UPDATE ON forma_pagamentos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão PIX
INSERT INTO forma_pagamentos (tipo, nome, ativo, chave_pix, tipo_chave, email_comprovantes, codigo_referencia, descricao, ordem)
VALUES (
  'pix',
  'PIX Principal',
  TRUE,
  'inemapix@gmail.com',
  'email',
  'comprovantes@tlgrupos.com',
  'TLGRUPOS',
  'Conta PIX principal para recebimento de pagamentos',
  1
)
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE forma_pagamentos IS 'Configurações centralizadas de formas de pagamento (PIX, cartão, etc)';
COMMENT ON COLUMN forma_pagamentos.chave_pix IS 'Chave PIX (email, telefone, CPF, CNPJ ou aleatória)';
COMMENT ON COLUMN forma_pagamentos.email_comprovantes IS 'Email onde cliente deve enviar comprovante de pagamento';
COMMENT ON COLUMN forma_pagamentos.codigo_referencia IS 'Código/prefixo para identificação de pagamentos';
