-- ===============================================
-- MIGRAÇÕES CONSOLIDADAS - TLGrupos
-- ===============================================
-- IMPORTANTE: Este arquivo foi gerado com ordem
-- corrigida de dependências
-- ===============================================


-- ===============================================
-- MIGRAÇÃO 01: 001_initial_schema.sql
-- ===============================================

-- TLGrupos - Initial Database Schema
-- Criado para gerenciar membros de grupos Telegram com controle de vencimento

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela principal de membros
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_user_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
  notificado_7dias BOOLEAN DEFAULT FALSE,
  notificado_3dias BOOLEAN DEFAULT FALSE,
  notificado_1dia BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('ativo', 'vencido', 'removido', 'pausado')) DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de ações
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  acao TEXT NOT NULL, -- 'adicao', 'remocao', 'notificacao', 'renovacao', 'edicao', 'pause', 'resume'
  detalhes JSONB,
  telegram_user_id BIGINT,
  telegram_username TEXT,
  executado_por TEXT, -- 'sistema', 'admin', 'cron'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO config (chave, valor, descricao) VALUES
  ('dias_notificacao', '{"7": true, "3": true, "1": true}', 'Dias antes do vencimento para enviar notificações'),
  ('mensagem_notificacao_7dias', '{"texto": "Olá {nome}! Seu acesso ao grupo vence em 7 dias ({data}). Entre em contato para renovar."}', 'Template de mensagem 7 dias antes'),
  ('mensagem_notificacao_3dias', '{"texto": "Atenção {nome}! Seu acesso ao grupo vence em 3 dias ({data}). Renove agora!"}', 'Template de mensagem 3 dias antes'),
  ('mensagem_notificacao_1dia', '{"texto": "URGENTE {nome}! Seu acesso ao grupo vence amanhã ({data}). Renove para não perder o acesso!"}', 'Template de mensagem 1 dia antes'),
  ('telegram_group_info', '{"id": null, "nome": null}', 'Informações do grupo Telegram');

-- Índices para melhorar performance
CREATE INDEX idx_members_vencimento ON members(data_vencimento);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_telegram_id ON members(telegram_user_id);
CREATE INDEX idx_members_notificacoes ON members(notificado_7dias, notificado_3dias, notificado_1dia);
CREATE INDEX idx_logs_member_id ON logs(member_id);
CREATE INDEX idx_logs_acao ON logs(acao);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para members
CREATE TRIGGER members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para config
CREATE TRIGGER config_updated_at
BEFORE UPDATE ON config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function para registrar logs automaticamente
CREATE OR REPLACE FUNCTION log_member_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO logs (member_id, acao, detalhes, telegram_user_id, telegram_username, executado_por)
    VALUES (NEW.id, 'adicao', row_to_json(NEW), NEW.telegram_user_id, NEW.telegram_username, 'sistema');
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO logs (member_id, acao, detalhes, telegram_user_id, telegram_username, executado_por)
    VALUES (NEW.id, 'edicao', jsonb_build_object('antes', row_to_json(OLD), 'depois', row_to_json(NEW)), NEW.telegram_user_id, NEW.telegram_username, 'sistema');
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO logs (member_id, acao, detalhes, telegram_user_id, telegram_username, executado_por)
    VALUES (OLD.id, 'remocao', row_to_json(OLD), OLD.telegram_user_id, OLD.telegram_username, 'sistema');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para logar mudanças
CREATE TRIGGER members_changes_log
AFTER INSERT OR UPDATE OR DELETE ON members
FOR EACH ROW
EXECUTE FUNCTION log_member_changes();

-- View para membros próximos do vencimento
CREATE OR REPLACE VIEW members_expiring_soon AS
SELECT
  *,
  EXTRACT(DAY FROM (data_vencimento - NOW())) as dias_restantes
FROM members
WHERE
  status = 'ativo'
  AND data_vencimento > NOW()
  AND data_vencimento <= NOW() + INTERVAL '7 days'
ORDER BY data_vencimento ASC;

-- View para membros vencidos
CREATE OR REPLACE VIEW members_expired AS
SELECT
  *,
  EXTRACT(DAY FROM (NOW() - data_vencimento)) as dias_vencidos
FROM members
WHERE
  status = 'ativo'
  AND data_vencimento < NOW()
ORDER BY data_vencimento ASC;

-- View para estatísticas
CREATE OR REPLACE VIEW stats AS
SELECT
  (SELECT COUNT(*) FROM members WHERE status = 'ativo') as total_ativos,
  (SELECT COUNT(*) FROM members WHERE status = 'vencido') as total_vencidos,
  (SELECT COUNT(*) FROM members WHERE status = 'removido') as total_removidos,
  (SELECT COUNT(*) FROM members WHERE status = 'ativo' AND data_vencimento <= NOW() + INTERVAL '7 days') as vencendo_7dias,
  (SELECT COUNT(*) FROM members WHERE status = 'ativo' AND data_vencimento < NOW()) as ativos_mas_vencidos;

-- Comentários nas tabelas
COMMENT ON TABLE members IS 'Membros do grupo Telegram com controle de vencimento';
COMMENT ON TABLE logs IS 'Registro de todas as ações realizadas no sistema';
COMMENT ON TABLE config IS 'Configurações do sistema';
COMMENT ON COLUMN members.notificado_7dias IS 'Se o membro já foi notificado 7 dias antes do vencimento';
COMMENT ON COLUMN members.notificado_3dias IS 'Se o membro já foi notificado 3 dias antes do vencimento';
COMMENT ON COLUMN members.notificado_1dia IS 'Se o membro já foi notificado 1 dia antes do vencimento';



-- ===============================================
-- MIGRAÇÃO 02: 002_make_telegram_user_id_nullable.sql
-- ===============================================

-- Migration: Tornar telegram_user_id nullable para suportar cadastro público
-- Data: 2025-01-10
-- Motivo: Permitir cadastro de membros sem telegram_user_id no registro público

-- Remover a constraint NOT NULL de telegram_user_id
ALTER TABLE members ALTER COLUMN telegram_user_id DROP NOT NULL;

-- Remover a constraint UNIQUE de telegram_user_id e recriar como UNIQUE apenas para valores não nulos
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_telegram_user_id_key;

-- Criar índice UNIQUE parcial (apenas para valores não nulos)
CREATE UNIQUE INDEX members_telegram_user_id_unique
ON members(telegram_user_id)
WHERE telegram_user_id IS NOT NULL;

-- Atualizar comentário da coluna
COMMENT ON COLUMN members.telegram_user_id IS 'ID do usuário no Telegram (opcional para cadastro público)';



-- ===============================================
-- MIGRAÇÃO 03: 003_add_invite_tokens.sql
-- ===============================================

-- Migration: Adicionar sistema de tokens de convite únicos
-- Data: 2025-01-10
-- Motivo: Permitir cadastro público com tokens únicos que só podem ser usados uma vez

-- Adicionar coluna de token único na tabela members
ALTER TABLE members ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS token_usado BOOLEAN DEFAULT FALSE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS token_usado_em TIMESTAMP WITH TIME ZONE;

-- Criar função para gerar token único
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sem caracteres confusos (I,O,0,1)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar token automaticamente ao criar membro
CREATE OR REPLACE FUNCTION set_invite_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_token IS NULL THEN
    NEW.invite_token := generate_invite_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_set_invite_token
BEFORE INSERT ON members
FOR EACH ROW
EXECUTE FUNCTION set_invite_token();

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_members_invite_token ON members(invite_token);

-- Comentários
COMMENT ON COLUMN members.invite_token IS 'Token único para entrada no grupo (gerado automaticamente)';
COMMENT ON COLUMN members.token_usado IS 'Indica se o token já foi utilizado para entrar no grupo';
COMMENT ON COLUMN members.token_usado_em IS 'Data e hora em que o token foi utilizado';



-- ===============================================
-- MIGRAÇÃO 04: 004_pagamentos_sistema.sql
-- ===============================================

-- Migration: Sistema de pagamentos com confirmação
-- Data: 2025-01-10
-- Motivo: Controle de pagamentos PIX com confirmação manual e envio automático de link

-- Tabela de cadastros pendentes (aguardando pagamento)
CREATE TABLE IF NOT EXISTS cadastros_pendentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  telegram_username TEXT,
  plano_dias INTEGER NOT NULL,
  valor_pago DECIMAL(10,2) NOT NULL,
  metodo_pagamento TEXT CHECK (metodo_pagamento IN ('pix', 'cartao')) DEFAULT 'pix',
  status TEXT CHECK (status IN ('aguardando_pagamento', 'pago', 'expirado', 'cancelado')) DEFAULT 'aguardando_pagamento',
  link_enviado BOOLEAN DEFAULT FALSE,
  invite_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expira_em TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Tabela de pagamentos do banco (importados via CSV ou API)
CREATE TABLE IF NOT EXISTS pagamentos_banco (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_pagamento TIMESTAMP WITH TIME ZONE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  nome_pagador TEXT,
  documento_pagador TEXT, -- CPF/CNPJ
  descricao TEXT,
  referencia TEXT, -- ID da transação
  processado BOOLEAN DEFAULT FALSE,
  cadastro_pendente_id UUID REFERENCES cadastros_pendentes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de logs de email
CREATE TABLE IF NOT EXISTS emails_enviados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cadastro_pendente_id UUID REFERENCES cadastros_pendentes(id),
  destinatario TEXT NOT NULL,
  assunto TEXT NOT NULL,
  corpo TEXT,
  status TEXT CHECK (status IN ('enviado', 'erro', 'pendente')) DEFAULT 'pendente',
  erro TEXT,
  tentativas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cadastros_pendentes_status ON cadastros_pendentes(status);
CREATE INDEX IF NOT EXISTS idx_cadastros_pendentes_email ON cadastros_pendentes(email);
CREATE INDEX IF NOT EXISTS idx_cadastros_pendentes_expira ON cadastros_pendentes(expira_em);
CREATE INDEX IF NOT EXISTS idx_pagamentos_banco_processado ON pagamentos_banco(processado);
CREATE INDEX IF NOT EXISTS idx_pagamentos_banco_valor ON pagamentos_banco(valor);
CREATE INDEX IF NOT EXISTS idx_pagamentos_banco_data ON pagamentos_banco(data_pagamento DESC);
CREATE INDEX IF NOT EXISTS idx_emails_enviados_status ON emails_enviados(status);

-- Trigger para updated_at
CREATE TRIGGER cadastros_pendentes_updated_at
BEFORE UPDATE ON cadastros_pendentes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- View para dashboard de pagamentos pendentes
CREATE OR REPLACE VIEW dashboard_pagamentos_pendentes AS
SELECT
  cp.id,
  cp.nome,
  cp.email,
  cp.telefone,
  cp.plano_dias,
  cp.valor_pago,
  cp.metodo_pagamento,
  cp.status,
  cp.link_enviado,
  cp.created_at,
  cp.expira_em,
  EXTRACT(EPOCH FROM (cp.expira_em - NOW())) / 3600 AS horas_restantes,
  (SELECT COUNT(*) FROM pagamentos_banco pb WHERE pb.valor = cp.valor_pago AND pb.processado = FALSE AND pb.data_pagamento >= cp.created_at) as pagamentos_possiveis
FROM cadastros_pendentes cp
WHERE cp.status = 'aguardando_pagamento'
  AND cp.expira_em > NOW()
ORDER BY cp.created_at DESC;

-- View para pagamentos não processados
CREATE OR REPLACE VIEW pagamentos_nao_processados AS
SELECT
  pb.id,
  pb.data_pagamento,
  pb.valor,
  pb.nome_pagador,
  pb.descricao,
  pb.referencia,
  pb.created_at,
  (SELECT COUNT(*) FROM cadastros_pendentes cp
   WHERE cp.valor_pago = pb.valor
   AND cp.status = 'aguardando_pagamento'
   AND cp.created_at <= pb.data_pagamento
   AND pb.data_pagamento <= cp.expira_em
  ) as cadastros_compativeis
FROM pagamentos_banco pb
WHERE pb.processado = FALSE
ORDER BY pb.data_pagamento DESC;

-- Comentários
COMMENT ON TABLE cadastros_pendentes IS 'Cadastros aguardando confirmação de pagamento';
COMMENT ON TABLE pagamentos_banco IS 'Pagamentos importados do extrato bancário';
COMMENT ON TABLE emails_enviados IS 'Log de emails enviados com links de acesso';
COMMENT ON COLUMN cadastros_pendentes.expira_em IS 'Data/hora de expiração do cadastro (24h após criação)';
COMMENT ON COLUMN pagamentos_banco.processado IS 'Indica se o pagamento já foi associado a um cadastro';



-- ===============================================
-- MIGRAÇÃO 05: 005_sistema_comprovantes.sql
-- ===============================================

-- Migration: Sistema de comprovantes de pagamento
-- Data: 2025-01-10
-- Motivo: Receber e validar comprovantes enviados pelos clientes

-- Adicionar coluna para armazenar comprovante
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS comprovante_url TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS comprovante_enviado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS validado_por TEXT;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS validado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE cadastros_pendentes ADD COLUMN IF NOT EXISTS qr_code_pix TEXT;

-- Adicionar novos status
ALTER TABLE cadastros_pendentes DROP CONSTRAINT IF EXISTS cadastros_pendentes_status_check;
ALTER TABLE cadastros_pendentes ADD CONSTRAINT cadastros_pendentes_status_check
CHECK (status IN ('aguardando_pagamento', 'comprovante_enviado', 'validado', 'pago', 'expirado', 'cancelado'));

-- Tabela para armazenar comprovantes recebidos por email
CREATE TABLE IF NOT EXISTS comprovantes_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_remetente TEXT NOT NULL,
  assunto TEXT,
  corpo TEXT,
  anexos JSONB, -- Array de URLs dos anexos
  data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processado BOOLEAN DEFAULT FALSE,
  cadastro_pendente_id UUID REFERENCES cadastros_pendentes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cadastros_comprovante ON cadastros_pendentes(comprovante_url) WHERE comprovante_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comprovantes_email_processado ON comprovantes_email(processado);
CREATE INDEX IF NOT EXISTS idx_comprovantes_email_remetente ON comprovantes_email(email_remetente);

-- View para dashboard de validação
CREATE OR REPLACE VIEW dashboard_validacao_pagamentos AS
SELECT
  cp.id,
  cp.nome,
  cp.email,
  cp.telefone,
  cp.plano_dias,
  cp.valor_pago,
  cp.status,
  cp.comprovante_url,
  cp.comprovante_enviado_em,
  cp.qr_code_pix,
  cp.created_at,
  cp.expira_em,
  EXTRACT(EPOCH FROM (NOW() - cp.comprovante_enviado_em)) / 3600 AS horas_desde_envio,
  (SELECT COUNT(*)
   FROM pagamentos_banco pb
   WHERE pb.valor = cp.valor_pago
   AND pb.processado = FALSE
   AND pb.data_pagamento >= cp.created_at
   AND pb.data_pagamento <= cp.expira_em
  ) as pagamentos_compativeis,
  (SELECT json_agg(json_build_object(
    'id', pb.id,
    'data_pagamento', pb.data_pagamento,
    'valor', pb.valor,
    'nome_pagador', pb.nome_pagador,
    'referencia', pb.referencia
  ))
  FROM pagamentos_banco pb
  WHERE pb.valor = cp.valor_pago
  AND pb.processado = FALSE
  AND pb.data_pagamento >= cp.created_at
  AND pb.data_pagamento <= cp.expira_em
  LIMIT 5
  ) as sugestoes_pagamento
FROM cadastros_pendentes cp
WHERE cp.status IN ('comprovante_enviado', 'validado')
  AND cp.expira_em > NOW()
ORDER BY cp.comprovante_enviado_em DESC NULLS LAST, cp.created_at DESC;

-- Comentários
COMMENT ON COLUMN cadastros_pendentes.comprovante_url IS 'URL do comprovante de pagamento enviado pelo cliente';
COMMENT ON COLUMN cadastros_pendentes.comprovante_enviado_em IS 'Data/hora que o comprovante foi enviado';
COMMENT ON COLUMN cadastros_pendentes.validado_por IS 'Admin que validou o pagamento';
COMMENT ON COLUMN cadastros_pendentes.validado_em IS 'Data/hora da validação';
COMMENT ON COLUMN cadastros_pendentes.qr_code_pix IS 'QR Code PIX gerado para o pagamento';
COMMENT ON TABLE comprovantes_email IS 'Comprovantes recebidos por email';



-- ===============================================
-- MIGRAÇÃO 06: 010_add_no_grupo_column.sql
-- ===============================================

-- Migration: Adicionar coluna no_grupo para rastrear se membro está no grupo

ALTER TABLE members ADD COLUMN IF NOT EXISTS no_grupo BOOLEAN DEFAULT false;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_members_no_grupo ON members(no_grupo);

COMMENT ON COLUMN members.no_grupo IS 'Indica se o membro está atualmente no grupo do Telegram';



-- ===============================================
-- MIGRAÇÃO 07: 006_status_erro_remocao.sql
-- ===============================================

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



-- ===============================================
-- MIGRAÇÃO 08: 007_remove_vencido_status.sql
-- ===============================================

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



-- ===============================================
-- MIGRAÇÃO 09: 008_add_sem_telegram_stats.sql
-- ===============================================

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



-- ===============================================
-- MIGRAÇÃO 10: 009_create_invites_table.sql
-- ===============================================

-- Migration: Criar tabela de convites
-- Armazena convites gerados para membros e status de envio

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  invite_link TEXT NOT NULL,

  -- Status de envio
  telegram_sent BOOLEAN DEFAULT false,
  telegram_sent_at TIMESTAMPTZ,
  telegram_error TEXT,

  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,

  -- Controle
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_invites_member_id ON invites(member_id);
CREATE INDEX idx_invites_used ON invites(used);
CREATE INDEX idx_invites_expires_at ON invites(expires_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invites_updated_at
  BEFORE UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION update_invites_updated_at();

COMMENT ON TABLE invites IS 'Convites gerados para entrada no grupo com status de envio';



-- ===============================================
-- MIGRAÇÃO 11: 011_create_plans_table.sql
-- ===============================================

-- Migration 011: Create Plans Table
-- Sistema de Planos de Acesso

-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL,
    duracao_dias INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on ativo and ordem for faster queries
CREATE INDEX idx_plans_ativo_ordem ON public.plans(ativo, ordem);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all authenticated users"
    ON public.plans
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow full access to service role"
    ON public.plans
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default plans
INSERT INTO public.plans (nome, descricao, valor, duracao_dias, ordem) VALUES
    ('Mensal', 'Acesso por 30 dias', 29.90, 30, 1),
    ('Trimestral', 'Acesso por 90 dias (economia de 15%)', 76.90, 90, 2),
    ('Semestral', 'Acesso por 180 dias (economia de 25%)', 134.90, 180, 3),
    ('Anual', 'Acesso por 365 dias (economia de 40%)', 215.00, 365, 4)
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE public.plans IS 'Planos de acesso disponíveis para membros';
COMMENT ON COLUMN public.plans.nome IS 'Nome do plano (ex: Mensal, Anual)';
COMMENT ON COLUMN public.plans.descricao IS 'Descrição do plano';
COMMENT ON COLUMN public.plans.valor IS 'Valor em reais do plano';
COMMENT ON COLUMN public.plans.duracao_dias IS 'Duração do plano em dias';
COMMENT ON COLUMN public.plans.ativo IS 'Se o plano está disponível para compra';
COMMENT ON COLUMN public.plans.ordem IS 'Ordem de exibição (menor = primeiro)';



-- ===============================================
-- MIGRAÇÃO 12: 012_add_plan_id_to_members.sql
-- ===============================================

-- Migration 012: Add plan_id to members table
-- Vincula membros aos planos de acesso

-- Add plan_id column to members
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_members_plan_id ON public.members(plan_id);

-- Add comment
COMMENT ON COLUMN public.members.plan_id IS 'Referência ao plano de acesso contratado pelo membro';

-- Update existing members to set a default plan (Mensal)
-- Only if they don't have a plan assigned yet
UPDATE public.members
SET plan_id = (SELECT id FROM public.plans WHERE nome = 'Mensal' LIMIT 1)
WHERE plan_id IS NULL
  AND status = 'ativo';



-- ===============================================
-- MIGRAÇÃO 13: 013_add_invite_link_tracking.sql
-- ===============================================

-- Migration: Add invite link tracking to members table
-- Created: 2025-01-10
-- Description: Adds columns to track generated invite links and their revocation status

-- Add invite_link column to store the generated Telegram invite link
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS invite_link TEXT;

-- Add invite_link_revoked column to track if link was revoked
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS invite_link_revoked BOOLEAN DEFAULT false;

-- Add invite_link_type column to differentiate between unique and generic links
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS invite_link_type TEXT CHECK (invite_link_type IN ('unique', 'generic'));

-- Add index for faster queries on invite links
CREATE INDEX IF NOT EXISTS idx_members_invite_link ON public.members(invite_link) WHERE invite_link IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.members.invite_link IS 'Link de convite do Telegram gerado para este membro';
COMMENT ON COLUMN public.members.invite_link_revoked IS 'Indica se o link de convite foi revogado após uso';
COMMENT ON COLUMN public.members.invite_link_type IS 'Tipo do link: unique (1 uso) ou generic (múltiplos usos)';



-- ===============================================
-- MIGRAÇÃO 14: 014_add_plan_id_to_cadastros_pendentes.sql
-- ===============================================

-- Migration: Add plan_id to cadastros_pendentes
-- Created: 2025-01-10
-- Description: Integra cadastros pendentes com sistema de planos

-- Add plan_id column
ALTER TABLE public.cadastros_pendentes
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cadastros_pendentes_plan_id ON public.cadastros_pendentes(plan_id);

-- Add comment
COMMENT ON COLUMN public.cadastros_pendentes.plan_id IS 'Referência ao plano selecionado (novo sistema)';
COMMENT ON COLUMN public.cadastros_pendentes.plano_dias IS 'Dias do plano (compatibilidade - usar plan_id quando disponível)';



-- ===============================================
-- MIGRAÇÃO 15: 015_create_forma_pagamentos_table.sql
-- ===============================================

-- Migration: Tabela de configuração de formas de pagamento
-- Data: 2025-01-19
-- Motivo: Centralizar configurações de PIX (chave, email, código de referência)

CREATE TABLE IF NOT EXISTS forma_pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('pix', 'cartao', 'boleto', 'outro')),
  nome TEXT NOT NULL, -- Ex: "PIX Principal", "PIX Secundário"
  ativo BOOLEAN DEFAULT TRUE,

  -- Configurações PIX
  chave_pix TEXT, -- Email, telefone, CPF ou chave aleatória
  tipo_chave TEXT CHECK (tipo_chave IN ('email', 'telefone', 'cpf', 'cnpj', 'aleatoria')),
  email_comprovantes TEXT, -- Email para onde cliente envia comprovante
  codigo_referencia TEXT, -- Código de referência para identificação

  -- Metadados
  descricao TEXT,
  ordem INTEGER DEFAULT 0, -- Ordem de exibição

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_forma_pagamentos_tipo ON forma_pagamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_forma_pagamentos_ativo ON forma_pagamentos(ativo);
CREATE INDEX IF NOT EXISTS idx_forma_pagamentos_ordem ON forma_pagamentos(ordem);

-- Trigger para updated_at
CREATE TRIGGER forma_pagamentos_updated_at
BEFORE UPDATE ON forma_pagamentos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão PIX
INSERT INTO forma_pagamentos (tipo, nome, ativo, chave_pix, tipo_chave, email_comprovantes, codigo_referencia, descricao, ordem)
VALUES (
  'pix',
  'PIX Principal',
  TRUE,
  'inemapix@gmail.com',
  'email',
  'comprovantes@tlgrupos.com',
  'TLGRUPOS',
  'Conta PIX principal para recebimento de pagamentos',
  1
)
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE forma_pagamentos IS 'Configurações centralizadas de formas de pagamento (PIX, cartão, etc)';
COMMENT ON COLUMN forma_pagamentos.chave_pix IS 'Chave PIX (email, telefone, CPF, CNPJ ou aleatória)';
COMMENT ON COLUMN forma_pagamentos.email_comprovantes IS 'Email onde cliente deve enviar comprovante de pagamento';
COMMENT ON COLUMN forma_pagamentos.codigo_referencia IS 'Código/prefixo para identificação de pagamentos';



-- ===============================================
-- MIGRAÇÃO 16: 016_create_telegram_groups_table.sql
-- ===============================================

-- Migration: Tabela de grupos Telegram
-- Data: 2025-01-19
-- Motivo: Suportar múltiplos grupos Telegram no sistema

CREATE TABLE IF NOT EXISTS telegram_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telegram_group_id TEXT NOT NULL UNIQUE, -- ID do grupo no Telegram (ex: -1002414487357)
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,

  -- Configurações do grupo
  auto_removal_enabled BOOLEAN DEFAULT TRUE, -- Habilitar remoção automática
  removal_schedule_hour INTEGER DEFAULT 0, -- Hora da remoção (0-23)
  removal_schedule_minute INTEGER DEFAULT 0, -- Minuto da remoção (0, 15, 30, 45)

  -- Estatísticas
  total_membros INTEGER DEFAULT 0,
  ultimo_sync TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_telegram_groups_ativo ON telegram_groups(ativo);
CREATE INDEX IF NOT EXISTS idx_telegram_groups_telegram_id ON telegram_groups(telegram_group_id);

-- Trigger para updated_at
CREATE TRIGGER telegram_groups_updated_at
BEFORE UPDATE ON telegram_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir grupo padrão (usando o ID atual do .env.local)
INSERT INTO telegram_groups (nome, telegram_group_id, descricao, ativo, auto_removal_enabled)
VALUES (
  'Grupo Principal',
  '-1002414487357',
  'Grupo principal de membros',
  TRUE,
  TRUE
)
ON CONFLICT (telegram_group_id) DO NOTHING;

-- Comentários
COMMENT ON TABLE telegram_groups IS 'Grupos Telegram gerenciados pelo sistema';
COMMENT ON COLUMN telegram_groups.telegram_group_id IS 'ID do grupo no Telegram (ex: -1002414487357)';
COMMENT ON COLUMN telegram_groups.auto_removal_enabled IS 'Se TRUE, remove membros vencidos automaticamente';
COMMENT ON COLUMN telegram_groups.removal_schedule_hour IS 'Hora da execução automática (0-23)';
COMMENT ON COLUMN telegram_groups.removal_schedule_minute IS 'Minuto da execução automática (0, 15, 30, 45)';



-- ===============================================
-- MIGRAÇÃO 17: 017_add_group_to_members.sql
-- ===============================================

-- Migration: Adicionar suporte a múltiplos grupos para membros
-- Data: 2025-01-19
-- Motivo: Permitir que um membro esteja em vários grupos

-- Adicionar coluna group_id na tabela members (opcional, para compatibilidade)
ALTER TABLE members ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES telegram_groups(id);

-- Criar tabela de relacionamento muitos-para-muitos
CREATE TABLE IF NOT EXISTS member_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES telegram_groups(id) ON DELETE CASCADE,

  -- Status específico deste membro neste grupo
  status_no_grupo TEXT DEFAULT 'ativo', -- 'ativo', 'removido', 'saiu'
  data_adicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_remocao TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id, group_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_member_groups_member ON member_groups(member_id);
CREATE INDEX IF NOT EXISTS idx_member_groups_group ON member_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_member_groups_status ON member_groups(status_no_grupo);

-- Trigger para updated_at
CREATE TRIGGER member_groups_updated_at
BEFORE UPDATE ON member_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Migrar dados existentes: associar todos os membros atuais ao grupo padrão
INSERT INTO member_groups (member_id, group_id, status_no_grupo)
SELECT
  m.id as member_id,
  tg.id as group_id,
  CASE
    WHEN m.status = 'ativo' THEN 'ativo'
    WHEN m.status = 'vencido' THEN 'removido'
    ELSE 'ativo'
  END as status_no_grupo
FROM members m
CROSS JOIN telegram_groups tg
WHERE tg.telegram_group_id = '-1002414487357' -- Grupo padrão
ON CONFLICT (member_id, group_id) DO NOTHING;

-- Comentários
COMMENT ON TABLE member_groups IS 'Relacionamento muitos-para-muitos entre membros e grupos';
COMMENT ON COLUMN member_groups.status_no_grupo IS 'Status do membro especificamente neste grupo';


