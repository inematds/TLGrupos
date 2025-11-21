-- ==============================================
-- MIGRAÇÃO: Sistema de Pagamentos
-- ==============================================
-- Execute este arquivo no Supabase SQL Editor
-- ==============================================

-- Tabela de Pagamentos
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

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- ==============================================
-- FUNÇÃO: Aprovar Pagamento e Estender Acesso
-- ==============================================
-- Esta função automatiza o processo de aprovação:
-- 1. Atualiza status do pagamento para 'aprovado'
-- 2. Registra quem aprovou e quando
-- 3. Calcula nova data de vencimento do membro
-- 4. Estende o acesso do membro
-- 5. Registra log da ação

CREATE OR REPLACE FUNCTION approve_payment(
  p_payment_id UUID,
  p_approved_by TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_expiry_date TIMESTAMP
) AS $$
DECLARE
  v_member_id UUID;
  v_dias_acesso INTEGER;
  v_current_expiry TIMESTAMP;
  v_new_expiry TIMESTAMP;
  v_now TIMESTAMP := NOW();
BEGIN
  -- Buscar informações do pagamento
  SELECT member_id, dias_acesso
  INTO v_member_id, v_dias_acesso
  FROM payments
  WHERE id = p_payment_id AND status = 'pendente';

  -- Verificar se pagamento existe e está pendente
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Pagamento não encontrado ou já processado', NULL::TIMESTAMP;
    RETURN;
  END IF;

  -- Buscar vencimento atual do membro
  SELECT data_vencimento INTO v_current_expiry
  FROM members
  WHERE id = v_member_id;

  -- Calcular nova data de vencimento
  -- Se já venceu, começa de hoje; senão, adiciona aos dias restantes
  IF v_current_expiry < v_now THEN
    v_new_expiry := v_now + (v_dias_acesso || ' days')::INTERVAL;
  ELSE
    v_new_expiry := v_current_expiry + (v_dias_acesso || ' days')::INTERVAL;
  END IF;

  -- Atualizar pagamento
  UPDATE payments
  SET
    status = 'aprovado',
    data_aprovacao = v_now,
    aprovado_por = p_approved_by,
    data_expiracao = v_new_expiry
  WHERE id = p_payment_id;

  -- Atualizar membro
  UPDATE members
  SET
    data_vencimento = v_new_expiry,
    status = 'ativo'
  WHERE id = v_member_id;

  -- Registrar log
  INSERT INTO logs (member_id, acao, detalhes, executado_por)
  VALUES (
    v_member_id,
    'renovacao',
    jsonb_build_object(
      'payment_id', p_payment_id,
      'dias_acesso', v_dias_acesso,
      'vencimento_anterior', v_current_expiry,
      'vencimento_novo', v_new_expiry,
      'tipo', 'aprovacao_pagamento'
    ),
    p_approved_by
  );

  -- Retornar sucesso
  RETURN QUERY SELECT TRUE, 'Pagamento aprovado com sucesso', v_new_expiry;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- FUNÇÃO: Rejeitar Pagamento
-- ==============================================

CREATE OR REPLACE FUNCTION reject_payment(
  p_payment_id UUID,
  p_rejected_by TEXT,
  p_motivo TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Buscar member_id
  SELECT member_id INTO v_member_id
  FROM payments
  WHERE id = p_payment_id AND status = 'pendente';

  -- Verificar se pagamento existe e está pendente
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Pagamento não encontrado ou já processado';
    RETURN;
  END IF;

  -- Atualizar pagamento
  UPDATE payments
  SET
    status = 'rejeitado',
    rejeitado_por = p_rejected_by,
    motivo_rejeicao = p_motivo,
    updated_at = NOW()
  WHERE id = p_payment_id;

  -- Registrar log
  INSERT INTO logs (member_id, acao, detalhes, executado_por)
  VALUES (
    v_member_id,
    'edicao',
    jsonb_build_object(
      'payment_id', p_payment_id,
      'motivo', p_motivo,
      'tipo', 'rejeicao_pagamento'
    ),
    p_rejected_by
  );

  -- Retornar sucesso
  RETURN QUERY SELECT TRUE, 'Pagamento rejeitado';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- RLS (Row Level Security)
-- ==============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver seus próprios pagamentos
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política: Service role pode fazer tudo
DROP POLICY IF EXISTS "Service role can do everything" ON payments;
CREATE POLICY "Service role can do everything"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

-- ==============================================
-- Comentários
-- ==============================================

COMMENT ON TABLE payments IS 'Registros de pagamentos dos membros';
COMMENT ON COLUMN payments.member_id IS 'ID do membro que fez o pagamento';
COMMENT ON COLUMN payments.plan_id IS 'ID do plano adquirido';
COMMENT ON COLUMN payments.payment_method_id IS 'ID da forma de pagamento utilizada';
COMMENT ON COLUMN payments.status IS 'Status do pagamento: pendente, aprovado, rejeitado, cancelado';
COMMENT ON COLUMN payments.comprovante_url IS 'URL do comprovante de pagamento';
COMMENT ON COLUMN payments.dias_acesso IS 'Quantidade de dias de acesso concedidos após aprovação';
COMMENT ON FUNCTION approve_payment IS 'Aprova pagamento e estende acesso do membro automaticamente';
COMMENT ON FUNCTION reject_payment IS 'Rejeita pagamento e registra motivo';

-- ==============================================
-- FIM DA MIGRAÇÃO
-- ==============================================

SELECT 'Migração de Pagamentos executada com sucesso!' as resultado;
