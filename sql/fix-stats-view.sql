
-- Script para recriar view de estatísticas
-- Execute este SQL diretamente no Supabase SQL Editor

DROP VIEW IF EXISTS stats CASCADE;


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


-- Verificar a view
SELECT * FROM stats;
