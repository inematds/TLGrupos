-- Migration: Remover status 'vencido' - vencimento será calculado dinamicamente
-- Status agora representa apenas o estado do membro no sistema, não seu vencimento

-- 1. Atualizar todos os membros com status 'vencido' para 'ativo'
UPDATE members
SET status = 'ativo'
WHERE status = 'vencido';

-- 2. Remover o constraint antigo
ALTER TABLE members
DROP CONSTRAINT IF EXISTS members_status_check;

-- 3. Adicionar novo constraint sem 'vencido'
ALTER TABLE members
ADD CONSTRAINT members_status_check
CHECK (status IN ('ativo', 'removido', 'pausado', 'erro_remocao'));

-- 4. Atualizar view de estatísticas para calcular vencidos dinamicamente
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
  (SELECT COUNT(*) FROM members WHERE status = 'ativo' AND data_vencimento > NOW() AND (no_grupo = false OR no_grupo IS NULL)) as ativos_sem_grupo;

-- Comentários
COMMENT ON VIEW stats IS 'Estatísticas do sistema - vencidos calculados dinamicamente baseado em data_vencimento < NOW()';
COMMENT ON COLUMN members.status IS 'Status do membro no sistema: ativo (cadastrado), removido (excluído do grupo), pausado (temporariamente inativo), erro_remocao (falha ao remover do Telegram)';
