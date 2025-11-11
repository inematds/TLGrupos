-- Migration 006: Adicionar status 'erro_remocao' e atualizar view de estatísticas
-- Criado em: 2025-11-10
-- Descrição: Adiciona novo status para membros que venceram mas não puderam ser removidos do Telegram

-- 1. Atualizar a view de estatísticas completa
DROP VIEW IF EXISTS stats;

CREATE OR REPLACE VIEW stats AS
SELECT
  -- Total geral
  (SELECT COUNT(*) FROM members) AS total_cadastros,

  -- Por status
  (SELECT COUNT(*) FROM members WHERE status = 'ativo') AS total_ativos,
  (SELECT COUNT(*) FROM members WHERE status = 'vencido') AS total_vencidos,
  (SELECT COUNT(*) FROM members WHERE status = 'removido') AS total_removidos,
  (SELECT COUNT(*) FROM members WHERE status = 'erro_remocao') AS erro_remocao,
  (SELECT COUNT(*) FROM members WHERE status = 'pausado') AS total_pausados,

  -- Ativos que estão no grupo (tem telegram_user_id)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NOT NULL) AS ativos_no_grupo,

  -- Ativos que NÃO estão no grupo (sem telegram_user_id)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NULL) AS ativos_sem_grupo,

  -- Membros que vencem nos próximos 7 dias
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento < (CURRENT_DATE + INTERVAL '7 days')
   AND data_vencimento >= CURRENT_DATE) AS vencendo_7dias,

  -- Membros ativos mas com data de vencimento passada (precisa remover)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento < CURRENT_DATE) AS ativos_mas_vencidos;

-- 2. Comentários explicativos
COMMENT ON VIEW stats IS 'View de estatísticas completas do sistema';
COMMENT ON COLUMN stats.total_cadastros IS 'Total de todos os cadastros no sistema';
COMMENT ON COLUMN stats.total_ativos IS 'Total de membros com status ativo';
COMMENT ON COLUMN stats.total_vencidos IS 'Total de membros vencidos e removidos do Telegram';
COMMENT ON COLUMN stats.total_removidos IS 'Total de membros removidos manualmente';
COMMENT ON COLUMN stats.erro_remocao IS 'Total de membros vencidos que NÃO puderam ser removidos do Telegram';
COMMENT ON COLUMN stats.total_pausados IS 'Total de membros pausados';
COMMENT ON COLUMN stats.ativos_no_grupo IS 'Membros ativos que estão no grupo Telegram';
COMMENT ON COLUMN stats.ativos_sem_grupo IS 'Membros ativos que ainda não entraram no grupo';
COMMENT ON COLUMN stats.vencendo_7dias IS 'Membros ativos que vencem nos próximos 7 dias';
COMMENT ON COLUMN stats.ativos_mas_vencidos IS 'Membros com status ativo mas data de vencimento passada';

-- 3. Verificar se existem registros com status antigo que precisam ser atualizados
-- (Não faz nada, apenas para referência futura)
-- UPDATE members SET status = 'erro_remocao'
-- WHERE status = 'ativo' AND data_vencimento < CURRENT_DATE;
