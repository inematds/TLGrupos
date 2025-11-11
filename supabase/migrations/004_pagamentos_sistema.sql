-- Migration: Sistema de pagamentos com confirmação
-- Data: 2025-01-10
-- Motivo: Controle de pagamentos PIX com confirmação manual e envio automático de link

-- Tabela de cadastros pendentes (aguardando pagamento)
CREATE TABLE IF NOT EXISTS cadastros_pendentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  telegram_username TEXT,
  plano_dias INTEGER NOT NULL,
  valor_pago DECIMAL(10,2) NOT NULL,
  metodo_pagamento TEXT CHECK (metodo_pagamento IN ('pix', 'cartao')) DEFAULT 'pix',
  status TEXT CHECK (status IN ('aguardando_pagamento', 'pago', 'expirado', 'cancelado')) DEFAULT 'aguardando_pagamento',
  link_enviado BOOLEAN DEFAULT FALSE,
  invite_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expira_em TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Tabela de pagamentos do banco (importados via CSV ou API)
CREATE TABLE IF NOT EXISTS pagamentos_banco (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_pagamento TIMESTAMP WITH TIME ZONE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  nome_pagador TEXT,
  documento_pagador TEXT, -- CPF/CNPJ
  descricao TEXT,
  referencia TEXT, -- ID da transação
  processado BOOLEAN DEFAULT FALSE,
  cadastro_pendente_id UUID REFERENCES cadastros_pendentes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de logs de email
CREATE TABLE IF NOT EXISTS emails_enviados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cadastro_pendente_id UUID REFERENCES cadastros_pendentes(id),
  destinatario TEXT NOT NULL,
  assunto TEXT NOT NULL,
  corpo TEXT,
  status TEXT CHECK (status IN ('enviado', 'erro', 'pendente')) DEFAULT 'pendente',
  erro TEXT,
  tentativas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cadastros_pendentes_status ON cadastros_pendentes(status);
CREATE INDEX IF NOT EXISTS idx_cadastros_pendentes_email ON cadastros_pendentes(email);
CREATE INDEX IF NOT EXISTS idx_cadastros_pendentes_expira ON cadastros_pendentes(expira_em);
CREATE INDEX IF NOT EXISTS idx_pagamentos_banco_processado ON pagamentos_banco(processado);
CREATE INDEX IF NOT EXISTS idx_pagamentos_banco_valor ON pagamentos_banco(valor);
CREATE INDEX IF NOT EXISTS idx_pagamentos_banco_data ON pagamentos_banco(data_pagamento DESC);
CREATE INDEX IF NOT EXISTS idx_emails_enviados_status ON emails_enviados(status);

-- Trigger para updated_at
CREATE TRIGGER cadastros_pendentes_updated_at
BEFORE UPDATE ON cadastros_pendentes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- View para dashboard de pagamentos pendentes
CREATE OR REPLACE VIEW dashboard_pagamentos_pendentes AS
SELECT
  cp.id,
  cp.nome,
  cp.email,
  cp.telefone,
  cp.plano_dias,
  cp.valor_pago,
  cp.metodo_pagamento,
  cp.status,
  cp.link_enviado,
  cp.created_at,
  cp.expira_em,
  EXTRACT(EPOCH FROM (cp.expira_em - NOW())) / 3600 AS horas_restantes,
  (SELECT COUNT(*) FROM pagamentos_banco pb WHERE pb.valor = cp.valor_pago AND pb.processado = FALSE AND pb.data_pagamento >= cp.created_at) as pagamentos_possiveis
FROM cadastros_pendentes cp
WHERE cp.status = 'aguardando_pagamento'
  AND cp.expira_em > NOW()
ORDER BY cp.created_at DESC;

-- View para pagamentos não processados
CREATE OR REPLACE VIEW pagamentos_nao_processados AS
SELECT
  pb.id,
  pb.data_pagamento,
  pb.valor,
  pb.nome_pagador,
  pb.descricao,
  pb.referencia,
  pb.created_at,
  (SELECT COUNT(*) FROM cadastros_pendentes cp
   WHERE cp.valor_pago = pb.valor
   AND cp.status = 'aguardando_pagamento'
   AND cp.created_at <= pb.data_pagamento
   AND pb.data_pagamento <= cp.expira_em
  ) as cadastros_compativeis
FROM pagamentos_banco pb
WHERE pb.processado = FALSE
ORDER BY pb.data_pagamento DESC;

-- Comentários
COMMENT ON TABLE cadastros_pendentes IS 'Cadastros aguardando confirmação de pagamento';
COMMENT ON TABLE pagamentos_banco IS 'Pagamentos importados do extrato bancário';
COMMENT ON TABLE emails_enviados IS 'Log de emails enviados com links de acesso';
COMMENT ON COLUMN cadastros_pendentes.expira_em IS 'Data/hora de expiração do cadastro (24h após criação)';
COMMENT ON COLUMN pagamentos_banco.processado IS 'Indica se o pagamento já foi associado a um cadastro';
