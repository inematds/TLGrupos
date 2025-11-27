# 🚀 SETUP: Sistema de Cadastro Externo

## ⚠️ IMPORTANTE: Execute PRIMEIRO antes de usar!

A seção de configuração do cadastro só aparecerá funcionando após criar a tabela no banco.

---

## 📋 PASSO 1: Criar Tabela no Supabase

### Opção A: Via Supabase Dashboard (RECOMENDADO)

1. **Abra o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → **SQL Editor**
   - Ou acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql

3. **Cole o SQL abaixo** e clique em **RUN**:

```sql
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
```

4. **Verificar se foi criado**:

Execute este SELECT para confirmar:

```sql
SELECT * FROM system_config;
```

Deve retornar 3 linhas:
- cadastro_url
- cadastro_externo
- nome_sistema

---

### Opção B: Via Script Node.js (se preferir)

```bash
node scripts/create-config-table.js
```

Depois execute o SQL manualmente no Supabase conforme instruções que aparecerem.

---

## 📋 PASSO 2: Acessar Dashboard

Depois que a tabela for criada:

1. Acesse: **http://157.180.72.42/dashboard/settings**

2. Você verá uma nova seção no TOPO da página:

```
┌─────────────────────────────────────────────────────┐
│ 🔗 URL do Formulário de Cadastro                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ URL Completa do Cadastro                           │
│ ┌─────────────────────────────────────────────┐   │
│ │ http://157.180.72.42/cadastro.html          │   │
│ └─────────────────────────────────────────────┘   │
│ Esta URL será enviada pelo bot no /cadastro       │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Usar URL Externa                   [ON] ●   │   │
│ │ Se ativado, usa URL acima...               │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ 💡 Baixe o cadastro.html e hospede onde quiser    │
│                                                     │
│ ┌──────────────────────┐  ┌──────────────────┐   │
│ │ ⬇️ Baixar cadastro.html│  │ 🔗 Testar URL    │   │
│ └──────────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 📋 PASSO 3: Baixar o cadastro.html

1. Na página de settings, clique em **"Baixar cadastro.html"**
2. O arquivo será baixado para seu computador
3. Este é um arquivo HTML standalone (não precisa de nada mais!)

---

## 📋 PASSO 4: Hospedar o arquivo

### Opção A: No mesmo servidor (Nginx)

```bash
# Copiar arquivo para pasta pública
sudo cp cadastro.html /var/www/html/cadastro.html

# Ajustar permissões
sudo chmod 644 /var/www/html/cadastro.html

# Testar
curl http://157.180.72.42/cadastro.html
```

### Opção B: Em outro servidor/CDN

- Faça upload via FTP/SFTP
- Ou use Cloudflare Pages, Netlify, Vercel, etc.

---

## 📋 PASSO 5: Configurar URL

1. No dashboard `/dashboard/settings`
2. Cole a URL onde você hospedou:
   - Exemplo: `http://157.180.72.42/cadastro.html`
3. Ative o toggle **"Usar URL Externa"** (deve ficar verde)
4. Clique em **"Salvar Alterações"**
5. Aguarde mensagem de sucesso ✅

---

## 📋 PASSO 6: Testar

### No Telegram:

1. Abra o grupo onde o bot está
2. Digite: `/cadastro`
3. O bot deve enviar um link com a URL configurada
4. Clique no link
5. Deve abrir o formulário de cadastro

### Verificar nos Logs:

```bash
# Se estiver usando PM2
pm2 logs

# Procure por:
[Cadastro] URL gerada: http://157.180.72.42/cadastro.html?telegram_id=...
```

---

## ❓ Problemas Comuns

### Problema 1: Não vejo a seção no dashboard

**Causa:** Tabela `system_config` não existe

**Solução:** Execute o SQL do PASSO 1

**Verificar:**
```bash
# No console do navegador (F12):
fetch('/api/config').then(r => r.json()).then(console.log)

# Se retornar erro 500, a tabela não existe
```

### Problema 2: Erro ao salvar configurações

**Causa:** Políticas RLS muito restritivas

**Solução:** Execute este SQL:
```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir escrita de configurações para service_role" ON system_config;

-- Criar política permissiva
CREATE POLICY "Permitir tudo para service_role"
  ON system_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Problema 3: Link do bot está errado

**Verificar configuração:**
```sql
SELECT chave, valor FROM system_config WHERE chave IN ('cadastro_url', 'cadastro_externo');
```

**Deve retornar:**
```
cadastro_url       | http://157.180.72.42/cadastro.html
cadastro_externo   | true
```

### Problema 4: Formulário não envia dados

**Causa:** URL da API errada no HTML

**Solução:** Baixe o cadastro.html novamente (a API URL é gerada automaticamente)

---

## ✅ Checklist Completo

- [ ] Executei o SQL no Supabase Dashboard
- [ ] Verifiquei que a tabela `system_config` foi criada
- [ ] Acessei http://157.180.72.42/dashboard/settings
- [ ] Vejo a seção "URL do Formulário de Cadastro" no topo
- [ ] Baixei o arquivo `cadastro.html`
- [ ] Hospedei o arquivo em `/var/www/html/cadastro.html`
- [ ] Testei acesso: `curl http://157.180.72.42/cadastro.html`
- [ ] Configurei a URL no dashboard
- [ ] Ativei toggle "Usar URL Externa"
- [ ] Salvei as configurações com sucesso
- [ ] Testei `/cadastro` no Telegram
- [ ] Link funciona e abre o formulário
- [ ] Fiz um cadastro de teste completo

---

## 🎯 Resultado Final

Quando tudo estiver configurado:

1. Usuário digita `/cadastro` no Telegram
2. Bot envia: `http://157.180.72.42/cadastro.html?telegram_id=123&username=joao&nome=João`
3. Usuário clica e preenche formulário
4. Formulário envia para: `http://157.180.72.42/api/cadastro`
5. Sistema cria membro e retorna link do grupo
6. Usuário entra no grupo! 🎉

---

**Dúvidas?** Leia a documentação completa em: `docs/CADASTRO_EXTERNO.md`
