-- =====================================================
-- CORREÇÃO: Renomear tabelas para nomes corretos
-- =====================================================

-- Se a tabela foi criada como "forma_pagamentos" (errado)
-- Renomear para "formas_pagamento" (correto)
ALTER TABLE IF EXISTS forma_pagamentos RENAME TO formas_pagamento;

-- Se a tabela foi criada como "pagamentos_banco" (outro sistema)
-- Não vamos mexer, mas vamos criar a tabela "payments" se não existir

-- Verificar se já existe a tabela payments
-- Se não existir, executar o script completo novamente

-- Para verificar quais tabelas existem, execute:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%pagam%';
