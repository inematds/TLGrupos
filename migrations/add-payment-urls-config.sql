-- Adiciona configurações de URLs de pagamento ao system_config

-- Flag para usar URLs externas de pagamento
INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES (
  'payment_externo',
  'false',
  'Usar URLs externas para pagamentos',
  'boolean'
) ON CONFLICT (chave) DO NOTHING;

-- URL externa para página de pagamento PIX
INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES (
  'payment_pix_url',
  '',
  'URL externa pagamento PIX',
  'url'
) ON CONFLICT (chave) DO NOTHING;

-- URL externa para página de pagamento com cartão
INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES (
  'payment_card_url',
  '',
  'URL externa pagamento cartão',
  'url'
) ON CONFLICT (chave) DO NOTHING;

-- Textos configuráveis para página de pagamento PIX
INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES (
  'payment_pix_titulo',
  '💰 Pagamento via PIX',
  'Título página pagamento PIX',
  'text'
) ON CONFLICT (chave) DO NOTHING;

INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES (
  'payment_pix_subtitulo',
  'Faça o pagamento e envie o comprovante',
  'Subtítulo página pagamento PIX',
  'text'
) ON CONFLICT (chave) DO NOTHING;

INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES (
  'payment_pix_instrucoes',
  '1️⃣ Copie a chave PIX abaixo
2️⃣ Faça o pagamento no seu banco
3️⃣ Envie o comprovante (foto ou PDF)
4️⃣ Aguarde a confirmação',
  'Instruções pagamento PIX',
  'textarea'
) ON CONFLICT (chave) DO NOTHING;

-- Textos configuráveis para página de pagamento com cartão
INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES (
  'payment_card_titulo',
  '💳 Pagamento com Cartão',
  'Título página pagamento cartão',
  'text'
) ON CONFLICT (chave) DO NOTHING;

INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES (
  'payment_card_subtitulo',
  'Preencha os dados do seu cartão',
  'Subtítulo página pagamento cartão',
  'text'
) ON CONFLICT (chave) DO NOTHING;

INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES (
  'payment_card_instrucoes',
  '🔒 Seus dados estão seguros
✅ Pagamento processado instantaneamente
📱 Você receberá acesso imediato aos grupos',
  'Instruções pagamento cartão',
  'textarea'
) ON CONFLICT (chave) DO NOTHING;
