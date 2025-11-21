-- Tabela de Pagamentos
-- Registra todos os pagamentos feitos pelos membros

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento com membro
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Relacionamento com plano
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,

  -- Relacionamento com forma de pagamento
  payment_method_id UUID REFERENCES formas_pagamento(id) ON DELETE SET NULL,

  -- Informações do pagamento
  valor DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, aprovado, rejeitado, cancelado

  -- Comprovante
  comprovante_url TEXT, -- URL do comprovante (se enviado)
  comprovante_hash TEXT, -- Hash do arquivo para verificação

  -- Detalhes do pagamento
  descricao TEXT,
  observacoes TEXT,

  -- Informações PIX (se aplicável)
  pix_chave TEXT, -- Chave PIX usada
  pix_txid TEXT, -- ID da transação PIX
  pix_e2eid TEXT, -- End-to-end ID do PIX

  -- Datas
  data_pagamento TIMESTAMP, -- Quando foi pago
  data_vencimento TIMESTAMP, -- Quando vence
  data_aprovacao TIMESTAMP, -- Quando foi aprovado
  data_expiracao TIMESTAMP, -- Quando expira o acesso concedido

  -- Dias de acesso concedidos
  dias_acesso INTEGER DEFAULT 30,

  -- Auditoria
  aprovado_por TEXT, -- Quem aprovou
  rejeitado_por TEXT, -- Quem rejeitou
  motivo_rejeicao TEXT, -- Por que foi rejeitado

  -- Metadados
  metadata JSONB DEFAULT '{}', -- Dados extras

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_plan ON payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_data_pagamento ON payments(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Comentários
COMMENT ON TABLE payments IS 'Registros de pagamentos dos membros';
COMMENT ON COLUMN payments.member_id IS 'ID do membro que fez o pagamento';
COMMENT ON COLUMN payments.plan_id IS 'ID do plano adquirido';
COMMENT ON COLUMN payments.payment_method_id IS 'ID da forma de pagamento utilizada';
COMMENT ON COLUMN payments.status IS 'Status do pagamento: pendente, aprovado, rejeitado, cancelado';
COMMENT ON COLUMN payments.comprovante_url IS 'URL do comprovante de pagamento';
COMMENT ON COLUMN payments.dias_acesso IS 'Quantidade de dias de acesso concedidos após aprovação';

-- RLS (Row Level Security)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver seus próprios pagamentos
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política: Service role pode fazer tudo
CREATE POLICY "Service role can do everything"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');
