-- =====================================================
-- Tabela de Configurações do Sistema
-- =====================================================
-- Permite configurar URL do cadastro e outras settings

CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  descricao TEXT,
  tipo VARCHAR(50) DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por chave
CREATE INDEX IF NOT EXISTS idx_system_config_chave ON system_config(chave);

-- Inserir configurações padrão
INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES
  ('cadastro_url', 'http://157.180.72.42/cadastro.html', 'URL completa da página de cadastro (pode ser externa ao sistema)', 'url'),
  ('cadastro_externo', 'true', 'Se true, usa URL externa. Se false, usa URL do sistema (/cadastro)', 'boolean'),
  ('nome_sistema', 'TLGrupos', 'Nome do sistema exibido nos formulários', 'text')
ON CONFLICT (chave) DO NOTHING;

-- Comentários
COMMENT ON TABLE system_config IS 'Configurações globais do sistema';
COMMENT ON COLUMN system_config.chave IS 'Chave única da configuração';
COMMENT ON COLUMN system_config.valor IS 'Valor da configuração em formato texto';
COMMENT ON COLUMN system_config.tipo IS 'Tipo de dado: text, url, boolean, number, json';

-- Habilitar RLS (Row Level Security)
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Policy: permitir leitura para todos autenticados
CREATE POLICY "Permitir leitura de configurações"
  ON system_config
  FOR SELECT
  USING (true);

-- Policy: permitir escrita apenas para service_role
CREATE POLICY "Permitir escrita de configurações para service_role"
  ON system_config
  FOR ALL
  USING (auth.role() = 'service_role');
