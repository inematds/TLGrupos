-- =====================================================
-- SISTEMA DE RASTREAMENTO DE NOTIFICAÇÕES
-- =====================================================
-- Cria tabela para rastrear TODAS as notificações enviadas
-- com controle individual por canal (email/telegram)

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Tipo de notificação
  notification_type VARCHAR(50) NOT NULL, -- 'expiry_warning', 'payment_approved', 'payment_rejected', 'news', 'removal'

  -- Para avisos de vencimento
  days_before_expiry INTEGER, -- 5, 7, 30, etc
  warning_number INTEGER, -- 1, 2 ou 3 (qual dos 3 avisos configurados)

  -- Status do envio por canal
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_error TEXT,
  email_attempts INTEGER DEFAULT 0,

  telegram_sent BOOLEAN DEFAULT false,
  telegram_sent_at TIMESTAMP WITH TIME ZONE,
  telegram_error TEXT,
  telegram_attempts INTEGER DEFAULT 0,

  -- Dados da notificação
  subject TEXT, -- Para email
  message TEXT, -- Conteúdo da mensagem
  invite_link TEXT, -- Link de acesso (se aplicável)

  -- Metadados
  scheduled_for TIMESTAMP WITH TIME ZONE, -- Quando deveria ser enviada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notification_history_member_id ON notification_history(member_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_payment_id ON notification_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_history_scheduled ON notification_history(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_history_email_sent ON notification_history(email_sent);
CREATE INDEX IF NOT EXISTS idx_notification_history_telegram_sent ON notification_history(telegram_sent);

-- Índice composto para buscar notificações pendentes
CREATE INDEX IF NOT EXISTS idx_notification_pending
ON notification_history(member_id, notification_type, days_before_expiry)
WHERE (email_sent = false OR telegram_sent = false);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notification_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notification_history_updated_at_trigger ON notification_history;
CREATE TRIGGER update_notification_history_updated_at_trigger
  BEFORE UPDATE ON notification_history
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_history_updated_at();

-- =====================================================
-- VIEWS PARA RELATÓRIOS
-- =====================================================

-- View: Taxa de sucesso de notificações
CREATE OR REPLACE VIEW notification_success_rate AS
SELECT
  notification_type,
  COUNT(*) as total,
  SUM(CASE WHEN email_sent THEN 1 ELSE 0 END) as emails_sent,
  SUM(CASE WHEN telegram_sent THEN 1 ELSE 0 END) as telegrams_sent,
  ROUND(AVG(CASE WHEN email_sent THEN 1 ELSE 0 END) * 100, 2) as email_success_rate,
  ROUND(AVG(CASE WHEN telegram_sent THEN 1 ELSE 0 END) * 100, 2) as telegram_success_rate,
  DATE_TRUNC('day', created_at) as date
FROM notification_history
GROUP BY notification_type, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- View: Notificações pendentes (não enviadas)
CREATE OR REPLACE VIEW pending_notifications AS
SELECT
  nh.id,
  nh.member_id,
  m.nome as member_name,
  m.email,
  m.telegram_username,
  nh.notification_type,
  nh.days_before_expiry,
  nh.scheduled_for,
  nh.email_sent,
  nh.telegram_sent,
  nh.email_attempts,
  nh.telegram_attempts,
  nh.email_error,
  nh.telegram_error,
  nh.created_at
FROM notification_history nh
JOIN members m ON m.id = nh.member_id
WHERE (nh.email_sent = false OR nh.telegram_sent = false)
  AND nh.email_attempts < 3 -- Máximo 3 tentativas
  AND nh.telegram_attempts < 3
ORDER BY nh.scheduled_for ASC;

-- View: Notificações falhadas
CREATE OR REPLACE VIEW failed_notifications AS
SELECT
  nh.id,
  nh.member_id,
  m.nome as member_name,
  m.email,
  m.telegram_username,
  nh.notification_type,
  nh.email_sent,
  nh.telegram_sent,
  nh.email_attempts,
  nh.telegram_attempts,
  nh.email_error,
  nh.telegram_error,
  nh.created_at,
  nh.updated_at
FROM notification_history nh
JOIN members m ON m.id = nh.member_id
WHERE (
  (nh.email_sent = false AND nh.email_attempts >= 3) OR
  (nh.telegram_sent = false AND nh.telegram_attempts >= 3)
)
ORDER BY nh.created_at DESC;

-- =====================================================
-- FUNÇÃO: Verificar se notificação já foi enviada
-- =====================================================

CREATE OR REPLACE FUNCTION check_notification_already_sent(
  p_member_id UUID,
  p_notification_type VARCHAR(50),
  p_days_before_expiry INTEGER DEFAULT NULL
) RETURNS TABLE(
  already_sent BOOLEAN,
  email_sent BOOLEAN,
  telegram_sent BOOLEAN,
  last_sent_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(bool_or(nh.email_sent AND nh.telegram_sent), false) as already_sent,
    COALESCE(bool_or(nh.email_sent), false) as email_sent,
    COALESCE(bool_or(nh.telegram_sent), false) as telegram_sent,
    MAX(GREATEST(nh.email_sent_at, nh.telegram_sent_at)) as last_sent_at
  FROM notification_history nh
  WHERE nh.member_id = p_member_id
    AND nh.notification_type = p_notification_type
    AND (p_days_before_expiry IS NULL OR nh.days_before_expiry = p_days_before_expiry)
    AND nh.created_at > NOW() - INTERVAL '30 days'; -- Considerar apenas últimos 30 dias
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a tabela foi criada
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'notification_history'
  ) THEN
    RAISE NOTICE '✅ Tabela notification_history criada com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro: Tabela notification_history não foi criada';
  END IF;

  -- Verificar views
  IF EXISTS (
    SELECT FROM information_schema.views
    WHERE table_name = 'notification_success_rate'
  ) THEN
    RAISE NOTICE '✅ View notification_success_rate criada com sucesso!';
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.views
    WHERE table_name = 'pending_notifications'
  ) THEN
    RAISE NOTICE '✅ View pending_notifications criada com sucesso!';
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.views
    WHERE table_name = 'failed_notifications'
  ) THEN
    RAISE NOTICE '✅ View failed_notifications criada com sucesso!';
  END IF;

  -- Verificar função
  IF EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'check_notification_already_sent'
  ) THEN
    RAISE NOTICE '✅ Função check_notification_already_sent criada com sucesso!';
  END IF;

  RAISE NOTICE '🎉 Sistema de rastreamento de notificações instalado com sucesso!';
  RAISE NOTICE '📊 Acesse o dashboard em: /notificacoes';
END $$;
