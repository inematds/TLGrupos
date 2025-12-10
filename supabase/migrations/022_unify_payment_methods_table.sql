-- Migration: Unificar tabelas de formas de pagamento
-- Data: 2025-12-10
-- Motivo: Remover tabela duplicada formas_pagamento, manter apenas forma_pagamentos

-- 1. Migrar dados de formas_pagamento para forma_pagamentos (se existirem e não duplicados)
INSERT INTO forma_pagamentos (id, tipo, nome, ativo, chave_pix, descricao, ordem, created_at, updated_at)
SELECT
  fp.id,
  fp.tipo,
  fp.nome,
  fp.ativo,
  fp.chave_pix,
  fp.descricao,
  fp.ordem,
  fp.created_at,
  fp.updated_at
FROM formas_pagamento fp
WHERE NOT EXISTS (
  SELECT 1 FROM forma_pagamentos fpa WHERE fpa.id = fp.id
)
ON CONFLICT (id) DO NOTHING;

-- 2. Remover a constraint FK antiga em payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_id_fkey;

-- 3. Adicionar nova constraint FK referenciando forma_pagamentos
ALTER TABLE payments
ADD CONSTRAINT payments_payment_method_id_fkey
FOREIGN KEY (payment_method_id)
REFERENCES forma_pagamentos(id)
ON DELETE SET NULL;

-- 4. Remover índices da tabela antiga
DROP INDEX IF EXISTS idx_formas_pagamento_ativo;
DROP INDEX IF EXISTS idx_formas_pagamento_tipo;

-- 5. Remover a tabela antiga
DROP TABLE IF EXISTS formas_pagamento CASCADE;

-- Comentário
COMMENT ON TABLE forma_pagamentos IS 'Configurações centralizadas de formas de pagamento (PIX, cartão, etc) - tabela unificada';
