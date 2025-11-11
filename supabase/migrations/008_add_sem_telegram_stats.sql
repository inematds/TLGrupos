-- Migration: Adicionar estatística de membros sem Telegram User ID

DROP VIEW IF EXISTS stats;
CREATE OR REPLACE VIEW stats AS
SELECT
  (SELECT COUNT(*) FROM members) as total_cadastros,
  (SELECT COUNT(*) FROM members WHERE status = 'ativo') as total_ativos,
  (SELECT COUNT(*) FROM members WHERE status = 'ativo' AND data_vencimento < NOW()) as total_vencidos,
  (SELECT COUNT(*) FROM members WHERE status = 'removido') as total_removidos,
  (SELECT COUNT(*) FROM members WHERE status = 'pausado') as total_pausados,
  (SELECT COUNT(*) FROM members WHERE status = 'erro_remocao') as erro_remocao,
  (SELECT COUNT(*) FROM members WHERE status = 'ativo' AND data_vencimento > NOW() AND data_vencimento <= NOW() + INTERVAL '7 days') as vencendo_7dias,
  (SELECT COUNT(*) FROM members WHERE status = 'ativo' AND data_vencimento < NOW()) as ativos_mas_vencidos,
  (SELECT COUNT(*) FROM members WHERE status = 'ativo' AND data_vencimento > NOW() AND no_grupo = true) as ativos_no_grupo,
  (SELECT COUNT(*) FROM members WHERE status = 'ativo' AND data_vencimento > NOW() AND (no_grupo = false OR no_grupo IS NULL)) as ativos_sem_grupo,
  (SELECT COUNT(*) FROM members WHERE telegram_user_id IS NULL) as sem_telegram_user_id,
  (SELECT COUNT(*) FROM members WHERE status = 'ativo' AND telegram_user_id IS NULL) as ativos_sem_telegram;

COMMENT ON VIEW stats IS 'Estatísticas do sistema - inclui contagem de membros sem telegram_user_id';
