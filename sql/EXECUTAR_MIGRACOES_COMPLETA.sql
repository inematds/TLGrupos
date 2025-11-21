-- =====================================================
-- MIGRAÇÃO COMPLETA: SISTEMA DE PAGAMENTOS
-- =====================================================
-- Este arquivo cria todas as tabelas e funções necessárias
-- para o sistema de pagamentos funcionar completamente
-- =====================================================

-- 1. CRIAR TABELA: formas_pagamento
-- =====================================================
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'pix', 'boleto', 'cartao', etc
  chave_pix TEXT,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para formas_pagamento
CREATE INDEX IF NOT EXISTS idx_formas_pagamento_ativo ON formas_pagamento(ativo);
CREATE INDEX IF NOT EXISTS idx_formas_pagamento_tipo ON formas_pagamento(tipo);

-- 2. CRIAR TABELA: payments
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES formas_pagamento(id) ON DELETE SET NULL,

  -- Valores
  valor DECIMAL(10,2) NOT NULL,
  dias_acesso INTEGER DEFAULT 30,

  -- Status e datas
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, aprovado, rejeitado, cancelado
  data_pagamento TIMESTAMP WITH TIME ZONE,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  data_rejeicao TIMESTAMP WITH TIME ZONE,
  data_expiracao TIMESTAMP WITH TIME ZONE, -- quando o acesso concedido expira

  -- Informações adicionais
  descricao TEXT,
  observacoes TEXT,
  comprovante_url TEXT,
  pix_chave TEXT,

  -- Auditoria
  aprovado_por TEXT,
  rejeitado_por TEXT,
  motivo_rejeicao TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_plan_id ON payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_data_pagamento ON payments(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 3. FUNÇÃO: approve_payment
-- =====================================================
-- Aprova um pagamento e estende o acesso do membro automaticamente
CREATE OR REPLACE FUNCTION approve_payment(
  p_payment_id UUID,
  p_approved_by TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_expiry_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_member_id UUID;
  v_dias_acesso INTEGER;
  v_current_expiry TIMESTAMP WITH TIME ZONE;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Buscar informações do pagamento
  SELECT member_id, dias_acesso
  INTO v_member_id, v_dias_acesso
  FROM payments
  WHERE id = p_payment_id AND status = 'pendente';

  -- Verificar se o pagamento existe e está pendente
  IF v_member_id IS NULL THEN
    RETURN QUERY SELECT false, 'Pagamento não encontrado ou já processado', NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  -- Buscar data de vencimento atual do membro
  SELECT data_vencimento INTO v_current_expiry
  FROM members
  WHERE id = v_member_id;

  -- Calcular nova data de vencimento
  -- Se o membro ainda tem acesso válido, adiciona os dias à data atual de vencimento
  -- Se o acesso já expirou, começa a contar a partir de hoje
  IF v_current_expiry IS NOT NULL AND v_current_expiry > v_now THEN
    v_new_expiry := v_current_expiry + (v_dias_acesso || ' days')::INTERVAL;
  ELSE
    v_new_expiry := v_now + (v_dias_acesso || ' days')::INTERVAL;
  END IF;

  -- Atualizar o pagamento
  UPDATE payments
  SET
    status = 'aprovado',
    data_aprovacao = v_now,
    aprovado_por = p_approved_by,
    data_expiracao = v_new_expiry,
    updated_at = v_now
  WHERE id = p_payment_id;

  -- Atualizar o membro
  UPDATE members
  SET
    data_vencimento = v_new_expiry,
    status = 'ativo',
    updated_at = v_now
  WHERE id = v_member_id;

  -- Log da operação (opcional - se você tiver tabela de logs)
  -- INSERT INTO payment_logs (payment_id, action, performed_by, created_at)
  -- VALUES (p_payment_id, 'approved', p_approved_by, v_now);

  -- Retornar sucesso
  RETURN QUERY SELECT true, 'Pagamento aprovado com sucesso', v_new_expiry;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO: reject_payment
-- =====================================================
-- Rejeita um pagamento
CREATE OR REPLACE FUNCTION reject_payment(
  p_payment_id UUID,
  p_rejected_by TEXT,
  p_motivo TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_payment_exists BOOLEAN;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Verificar se o pagamento existe e está pendente
  SELECT EXISTS(
    SELECT 1 FROM payments
    WHERE id = p_payment_id AND status = 'pendente'
  ) INTO v_payment_exists;

  IF NOT v_payment_exists THEN
    RETURN QUERY SELECT false, 'Pagamento não encontrado ou já processado';
    RETURN;
  END IF;

  -- Atualizar o pagamento
  UPDATE payments
  SET
    status = 'rejeitado',
    data_rejeicao = v_now,
    rejeitado_por = p_rejected_by,
    motivo_rejeicao = p_motivo,
    updated_at = v_now
  WHERE id = p_payment_id;

  -- Log da operação (opcional)
  -- INSERT INTO payment_logs (payment_id, action, performed_by, notes, created_at)
  -- VALUES (p_payment_id, 'rejected', p_rejected_by, p_motivo, v_now);

  -- Retornar sucesso
  RETURN QUERY SELECT true, 'Pagamento rejeitado';
END;
$$ LANGUAGE plpgsql;

-- 5. RLS (Row Level Security) - OPCIONAL
-- =====================================================
-- Descomente se você usar autenticação no Supabase

-- ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Permitir leitura de formas de pagamento ativas"
--   ON formas_pagamento FOR SELECT
--   USING (ativo = true);

-- CREATE POLICY "Admins podem gerenciar formas de pagamento"
--   ON formas_pagamento FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Admins podem gerenciar payments"
--   ON payments FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin');

-- 6. INSERIR FORMAS DE PAGAMENTO PADRÃO
-- =====================================================
INSERT INTO formas_pagamento (nome, tipo, chave_pix, descricao, ordem, ativo)
VALUES
  ('PIX - Chave Email', 'pix', 'seu-email@exemplo.com', 'Pagamento via PIX usando chave email', 1, true),
  ('PIX - Chave CPF', 'pix', '000.000.000-00', 'Pagamento via PIX usando chave CPF', 2, false),
  ('PIX - Chave Telefone', 'pix', '+55 (00) 00000-0000', 'Pagamento via PIX usando chave telefone', 3, false),
  ('PIX - Chave Aleatória', 'pix', 'sua-chave-aleatoria-aqui', 'Pagamento via PIX usando chave aleatória', 4, false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Para verificar se tudo foi criado corretamente, execute:
-- SELECT * FROM formas_pagamento;
-- SELECT * FROM payments LIMIT 10;
