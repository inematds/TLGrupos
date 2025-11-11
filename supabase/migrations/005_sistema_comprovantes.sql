-- Migration: Sistema de comprovantes de pagamento
-- Data: 2025-01-10
-- Motivo: Receber e validar comprovantes enviados pelos clientes

-- Adicionar coluna para armazenar comprovante
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS comprovante_url TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS comprovante_enviado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS validado_por TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS validado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS qr_code_pix TEXT;

-- Adicionar novos status
ALTER TABLE cadastros_pendentes DROP CONSTRAINT IF EXISTS cadastros_pendentes_status_check;
ALTER TABLE cadastros_pendentes ADD CONSTRAINT cadastros_pendentes_status_check
CHECK (status IN ('aguardando_pagamento', 'comprovante_enviado', 'validado', 'pago', 'expirado', 'cancelado'));

-- Tabela para armazenar comprovantes recebidos por email
CREATE TABLE IF NOT EXISTS comprovantes_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_remetente TEXT NOT NULL,
  assunto TEXT,
  corpo TEXT,
  anexos JSONB, -- Array de URLs dos anexos
  data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processado BOOLEAN DEFAULT FALSE,
  cadastro_pendente_id UUID REFERENCES cadastros_pendentes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cadastros_comprovante ON cadastros_pendentes(comprovante_url) WHERE comprovante_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comprovantes_email_processado ON comprovantes_email(processado);
CREATE INDEX IF NOT EXISTS idx_comprovantes_email_remetente ON comprovantes_email(email_remetente);

-- View para dashboard de validação
CREATE OR REPLACE VIEW dashboard_validacao_pagamentos AS
SELECT
  cp.id,
  cp.nome,
  cp.email,
  cp.telefone,
  cp.plano_dias,
  cp.valor_pago,
  cp.status,
  cp.comprovante_url,
  cp.comprovante_enviado_em,
  cp.qr_code_pix,
  cp.created_at,
  cp.expira_em,
  EXTRACT(EPOCH FROM (NOW() - cp.comprovante_enviado_em)) / 3600 AS horas_desde_envio,
  (SELECT COUNT(*)
   FROM pagamentos_banco pb
   WHERE pb.valor = cp.valor_pago
   AND pb.processado = FALSE
   AND pb.data_pagamento >= cp.created_at
   AND pb.data_pagamento <= cp.expira_em
  ) as pagamentos_compativeis,
  (SELECT json_agg(json_build_object(
    'id', pb.id,
    'data_pagamento', pb.data_pagamento,
    'valor', pb.valor,
    'nome_pagador', pb.nome_pagador,
    'referencia', pb.referencia
  ))
  FROM pagamentos_banco pb
  WHERE pb.valor = cp.valor_pago
  AND pb.processado = FALSE
  AND pb.data_pagamento >= cp.created_at
  AND pb.data_pagamento <= cp.expira_em
  LIMIT 5
  ) as sugestoes_pagamento
FROM cadastros_pendentes cp
WHERE cp.status IN ('comprovante_enviado', 'validado')
  AND cp.expira_em > NOW()
ORDER BY cp.comprovante_enviado_em DESC NULLS LAST, cp.created_at DESC;

-- Comentários
COMMENT ON COLUMN cadastros_pendentes.comprovante_url IS 'URL do comprovante de pagamento enviado pelo cliente';
COMMENT ON COLUMN cadastros_pendentes.comprovante_enviado_em IS 'Data/hora que o comprovante foi enviado';
COMMENT ON COLUMN cadastros_pendentes.validado_por IS 'Admin que validou o pagamento';
COMMENT ON COLUMN cadastros_pendentes.validado_em IS 'Data/hora da validação';
COMMENT ON COLUMN cadastros_pendentes.qr_code_pix IS 'QR Code PIX gerado para o pagamento';
COMMENT ON TABLE comprovantes_email IS 'Comprovantes recebidos por email';
