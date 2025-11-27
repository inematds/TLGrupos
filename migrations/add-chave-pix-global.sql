-- Adiciona configuração de chave PIX global ao system_config

INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES (
  'chave_pix_global',
  '',
  'Chave PIX padrão do sistema',
  'text'
) ON CONFLICT (chave) DO NOTHING;
