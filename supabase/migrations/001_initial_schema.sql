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
