-- =====================================================
-- Adicionar Textos Configuráveis do Formulário de Cadastro
-- =====================================================

-- Inserir configurações de textos do formulário
INSERT INTO system_config (chave, valor, descricao, tipo)
VALUES
  -- Título e subtítulo
  ('cadastro_titulo', '📝 Cadastro de Membro', 'Título formulário cadastro', 'text'),
  ('cadastro_subtitulo', 'Preencha seus dados para se cadastrar', 'Subtítulo formulário cadastro', 'text'),

  -- Box de informações (acima do formulário)
  ('cadastro_info_titulo', 'ℹ️ Como Funciona o Sistema', 'Título caixa de informações', 'text'),
  ('cadastro_info_texto', 'Acesso Multi-Grupo: Ao se cadastrar, você terá acesso a TODOS os grupos do Telegram onde nosso bot está ativo.

• O mesmo cadastro funciona em todos os grupos
• A data de vencimento é compartilhada entre os grupos
• Use o comando /status no Telegram para verificar seu tempo restante

💡 Dica: Após o cadastro, você receberá um link para entrar nos grupos. Guarde esse link!', 'Texto informativo acima do formulário', 'textarea'),

  -- Box de renovação (abaixo do formulário)
  ('cadastro_aviso_titulo', '⚠️ Importante - Gerenciamento de Acesso', 'Título aviso de renovação', 'text'),
  ('cadastro_aviso_texto', '• Seu acesso possui uma data de vencimento
• Quando vencer, você será removido de TODOS os grupos simultaneamente
• Para renovar, entre em contato com os administradores antes do vencimento

💡 Use /status no Telegram para verificar sua data de vencimento!', 'Texto aviso de renovação', 'textarea')

ON CONFLICT (chave) DO NOTHING;

-- Verificar configurações criadas
SELECT chave, LEFT(valor, 50) as valor_preview, descricao
FROM system_config
WHERE chave LIKE 'cadastro_%'
ORDER BY chave;
