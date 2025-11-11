-- ====================================================================
-- ATUALIZAÇÃO DA VIEW DE ESTATÍSTICAS
-- Execute este SQL no Supabase SQL Editor
-- ====================================================================

-- 1. Remover a view antiga
DROP VIEW IF EXISTS stats CASCADE;

-- 2. Criar nova view com TODOS os campos
CREATE OR REPLACE VIEW stats AS
SELECT
  -- Total geral de cadastros
  (SELECT COUNT(*) FROM members)::bigint AS total_cadastros,

  -- Estatísticas por status
  (SELECT COUNT(*) FROM members WHERE status = 'ativo')::bigint AS total_ativos,
  (SELECT COUNT(*) FROM members WHERE status = 'vencido')::bigint AS total_vencidos,
  (SELECT COUNT(*) FROM members WHERE status = 'removido')::bigint AS total_removidos,
  (SELECT COUNT(*) FROM members WHERE status = 'erro_remocao')::bigint AS erro_remocao,
  (SELECT COUNT(*) FROM members WHERE status = 'pausado')::bigint AS total_pausados,

  -- Membros ativos que ESTÃO no grupo (têm telegram_user_id)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NOT NULL)::bigint AS ativos_no_grupo,

  -- Membros ativos que NÃO ESTÃO no grupo (sem telegram_user_id)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NULL)::bigint AS ativos_sem_grupo,

  -- Membros que vencem nos próximos 7 dias
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento < (CURRENT_DATE + INTERVAL '7 days')
   AND data_vencimento >= CURRENT_DATE)::bigint AS vencendo_7dias,

  -- Membros ativos mas com data vencida (precisa atenção)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento < CURRENT_DATE)::bigint AS ativos_mas_vencidos;

-- 3. Verificar se funcionou
SELECT * FROM stats;

-- ====================================================================
-- VALORES ESPERADOS (baseado nos dados atuais):
-- ====================================================================
-- total_cadastros: 11
-- total_ativos: 9
-- total_vencidos: 1
-- total_removidos: 1
-- erro_remocao: 0
-- total_pausados: 0
-- ativos_no_grupo: 6 (ativos que entraram no grupo)
-- ativos_sem_grupo: 3 (ativos que não entraram ainda)
-- vencendo_7dias: 1
-- ativos_mas_vencidos: 0
-- ====================================================================
