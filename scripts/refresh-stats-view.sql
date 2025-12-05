-- Script para recriar a view stats
-- Execute no SQL Editor do Supabase

-- 1. Deletar a view antiga
DROP VIEW IF EXISTS stats CASCADE;

-- 2. Recriar a view com a estrutura correta
CREATE OR REPLACE VIEW stats AS
SELECT
  -- Total de cadastros (todos os membros)
  COUNT(*) AS total_cadastros,

  -- Totais por status
  COUNT(*) FILTER (WHERE status = 'ativo') AS total_ativos,
  COUNT(*) FILTER (WHERE status = 'vencido') AS total_vencidos,
  COUNT(*) FILTER (WHERE status = 'removido') AS total_removidos,
  COUNT(*) FILTER (WHERE status = 'erro_remocao') AS erro_remocao,
  COUNT(*) FILTER (WHERE status = 'pausado') AS total_pausados,

  -- Ativos no grupo vs fora do grupo
  COUNT(*) FILTER (WHERE status = 'ativo' AND no_grupo = true) AS ativos_no_grupo,
  COUNT(*) FILTER (WHERE status = 'ativo' AND no_grupo = false) AS ativos_sem_grupo,

  -- Membros ativos sem Telegram ID
  COUNT(*) FILTER (WHERE status = 'ativo' AND telegram_user_id IS NULL) AS ativos_sem_telegram,
  COUNT(*) FILTER (WHERE status = 'ativo' AND telegram_user_id IS NULL) AS sem_telegram_user_id,

  -- Vencendo em 7 dias (ativos com vencimento entre hoje e daqui 7 dias)
  COUNT(*) FILTER (
    WHERE status = 'ativo'
    AND data_vencimento >= NOW()
    AND data_vencimento <= NOW() + INTERVAL '7 days'
  ) AS vencendo_7dias,

  -- Ativos mas vencidos (status ativo mas data vencida)
  COUNT(*) FILTER (
    WHERE status = 'ativo'
    AND data_vencimento < NOW()
  ) AS ativos_mas_vencidos

FROM members;

-- 3. Dar permissão de leitura para o role anon e authenticated
GRANT SELECT ON stats TO anon;
GRANT SELECT ON stats TO authenticated;

-- 4. Verificar se funcionou
SELECT * FROM stats;
