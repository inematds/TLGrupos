-- =====================================================
-- ATUALIZAR VIEW DE ESTATÍSTICAS
-- =====================================================
-- Execute este SQL no Supabase SQL Editor para atualizar a view stats
-- com todos os campos necessários para o dashboard

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

  -- Ativos sem telegram_user_id (mesmo campo, nome diferente para compatibilidade)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NULL) AS ativos_sem_telegram,

  -- Ativos sem telegram_user_id (campo adicional)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NULL) AS sem_telegram_user_id,

  -- Membros que vencem nos próximos 7 dias
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento <= (CURRENT_TIMESTAMP + INTERVAL '7 days')
   AND data_vencimento >= CURRENT_TIMESTAMP) AS vencendo_7dias,

  -- Membros ativos mas com data de vencimento passada (precisa remover)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento < CURRENT_TIMESTAMP) AS ativos_mas_vencidos;

-- Adicionar comentário na view
COMMENT ON VIEW stats IS 'View de estatísticas completas do sistema - Atualizada em 2025-11-21';

-- Verificar a view (para debug)
SELECT * FROM stats;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Se você tem 2 membros ativos cadastrados hoje, deve ver:
-- total_cadastros: 2
-- total_ativos: 2
-- ativos_no_grupo: 2 (se ambos têm telegram_user_id)
-- vencendo_7dias: 0 (pois vencem em 30 dias)
-- =====================================================
