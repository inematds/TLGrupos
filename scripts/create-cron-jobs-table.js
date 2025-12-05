/**
 * Script para criar a tabela cron_jobs no Supabase
 * Execução: node scripts/create-cron-jobs-table.js
 */

const sql = `
-- Tabela para gerenciar cron jobs via web
CREATE TABLE IF NOT EXISTS cron_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  endpoint VARCHAR(255) NOT NULL,
  frequencia VARCHAR(50) NOT NULL, -- Cron expression (ex: "*/15 * * * *")
  ativo BOOLEAN DEFAULT true,
  ultimo_exec TIMESTAMP,
  proximo_exec TIMESTAMP,
  total_execucoes INTEGER DEFAULT 0,
  total_sucessos INTEGER DEFAULT 0,
  total_erros INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cron_jobs_ativo ON cron_jobs(ativo);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_proximo_exec ON cron_jobs(proximo_exec);

-- Inserir os 4 cron jobs padrão do sistema
INSERT INTO cron_jobs (nome, descricao, endpoint, frequencia, ativo) VALUES
(
  'Processar Pagamentos',
  'Gera links de convite para pagamentos aprovados sem link',
  '/api/cron/process-approved-payments',
  '*/15 * * * *',
  true
),
(
  'Verificar Expirações',
  'Verifica membros com data de vencimento próxima',
  '/api/cron/check-expirations',
  '0 * * * *',
  true
),
(
  'Enviar Notificações',
  'Envia avisos de vencimento por email e Telegram',
  '/api/cron/send-notifications',
  '0 8 * * *',
  true
),
(
  'Remover Expirados',
  'Remove automaticamente membros com vencimento expirado',
  '/api/cron/remove-expired',
  '0 3 * * *',
  true
)
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE cron_jobs IS 'Gerenciamento de processos automáticos (cron jobs)';
COMMENT ON COLUMN cron_jobs.frequencia IS 'Expressão cron (ex: */15 * * * * = a cada 15 minutos)';
COMMENT ON COLUMN cron_jobs.ativo IS 'Se false, o cron roda mas não executa a ação';
`;

console.log('═══════════════════════════════════════════════════════════');
console.log('📋 SQL para criar tabela cron_jobs');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Execute este SQL no Supabase Dashboard:');
console.log('');
console.log('1. Acesse: https://supabase.com/dashboard');
console.log('2. Selecione seu projeto TLGrupos');
console.log('3. Vá em "SQL Editor"');
console.log('4. Cole o SQL abaixo e execute:');
console.log('');
console.log('─────────────────────────────────────────────────────────────');
console.log(sql);
console.log('─────────────────────────────────────────────────────────────');
console.log('');
console.log('✅ Após executar, a tabela estará pronta para uso!');
console.log('');
