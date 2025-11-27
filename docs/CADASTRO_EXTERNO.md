# 📝 Sistema de Cadastro Externo

Este documento explica como configurar e usar o formulário de cadastro standalone que pode ser hospedado em qualquer servidor.

## 🎯 O que é?

O sistema permite que você:
1. **Configure uma URL personalizada** para o formulário de cadastro
2. **Baixe um arquivo HTML standalone** (`cadastro.html`) que funciona em qualquer servidor
3. **Hospede o formulário onde quiser** (mesmo domínio, CDN, outro servidor, etc.)
4. **O bot do Telegram envia automaticamente** a URL configurada

## 🚀 Como Funciona

### Fluxo Completo:

```
1. Usuário digita /cadastro no Telegram
   ↓
2. Bot busca URL configurada no banco (system_config)
   ↓
3. Bot envia a URL + parâmetros do Telegram
   ↓
4. Usuário clica no link e preenche o formulário
   ↓
5. Formulário envia dados para /api/cadastro do sistema
   ↓
6. Sistema cria membro e gera link do grupo
```

## ⚙️ Passo a Passo para Configurar

### 1. Criar a Tabela no Banco

Execute o SQL no Supabase Dashboard (SQL Editor):

```sql
-- Copie todo o conteúdo do arquivo:
-- migrations/create-system-config.sql
```

Ou simplesmente execute:

```bash
# No terminal do servidor
cat migrations/create-system-config.sql
# Copie o output e cole no SQL Editor do Supabase
```

### 2. Acessar as Configurações no Dashboard

1. Acesse: `http://157.180.72.42/dashboard/settings`
2. Vá até a seção **"URL do Formulário de Cadastro"**

### 3. Baixar o arquivo cadastro.html

1. Clique no botão **"Baixar cadastro.html"**
2. O arquivo será baixado para seu computador

### 4. Hospedar o arquivo

**Opção A: No mesmo servidor (Nginx)**

```bash
# Copiar para pasta pública do Nginx
sudo cp cadastro.html /var/www/html/cadastro.html

# Verificar permissões
sudo chmod 644 /var/www/html/cadastro.html

# Testar acesso
curl http://157.180.72.42/cadastro.html
```

**Opção B: Em outro servidor**

- Faça upload via FTP/SFTP para qualquer servidor web
- Exemplo: `http://meusite.com/cadastro.html`

**Opção C: Em um CDN**

- Faça upload para Cloudflare Pages, Netlify, Vercel, etc.
- Exemplo: `https://cadastro.netlify.app`

### 5. Configurar a URL no Dashboard

1. No dashboard em `/dashboard/settings`
2. Cole a URL onde você hospedou o arquivo
   - Exemplo: `http://157.180.72.42/cadastro.html`
   - Ou: `https://meusite.com/cadastro.html`
3. Ative o toggle **"Usar URL Externa"**
4. Clique em **"Salvar Alterações"**

### 6. Testar

1. Abra o Telegram
2. Digite `/cadastro` no grupo
3. Clique no link recebido
4. Verifique se abre o formulário correto

## 🔧 Configurações Disponíveis

### system_config (Tabela)

| Chave             | Valor Padrão                        | Descrição                                    |
|-------------------|-------------------------------------|----------------------------------------------|
| cadastro_url      | http://157.180.72.42/cadastro.html | URL completa do formulário                   |
| cadastro_externo  | true                                | Se true, usa URL configurada. Se false, usa /cadastro do sistema |
| nome_sistema      | TLGrupos                            | Nome exibido no formulário                   |

### Comportamento do Sistema:

- **cadastro_externo = true**: Bot envia a URL configurada em `cadastro_url`
- **cadastro_externo = false**: Bot envia `{NEXTAUTH_URL}/cadastro` (página Next.js interna)

## 📄 O que está no cadastro.html?

O arquivo HTML standalone contém:
- ✅ Formulário completo com todos os campos
- ✅ Estilos CSS inline (não precisa de arquivos externos)
- ✅ JavaScript para enviar dados via fetch para `/api/cadastro`
- ✅ Suporte a parâmetros do Telegram (`telegram_id`, `username`, `nome`)
- ✅ Badge mostrando "Telegram Conectado"
- ✅ Mensagens de sucesso/erro
- ✅ Exibição do link de convite após cadastro

**URL da API hardcoded:**
```javascript
const API_URL = 'http://157.180.72.42'; // Ou o que estiver em NEXTAUTH_URL
```

## 🔐 Segurança

- O formulário HTML pode ser público (sem autenticação)
- A API `/api/cadastro` valida todos os dados com Zod
- O arquivo é estático (não contém secrets ou chaves)
- CORS: A API aceita requisições de qualquer origem

## 🌍 Exemplos de Uso

### Exemplo 1: Hospedagem no mesmo servidor

```bash
# URL configurada:
http://157.180.72.42/cadastro.html

# Bot envia:
http://157.180.72.42/cadastro.html?telegram_id=123&username=joao&nome=Jo%C3%A3o
```

### Exemplo 2: Hospedagem em CDN

```bash
# URL configurada:
https://cadastro.meusite.com

# Bot envia:
https://cadastro.meusite.com?telegram_id=123&username=joao&nome=Jo%C3%A3o
```

### Exemplo 3: Usando formulário interno do Next.js

```bash
# Desativar "Usar URL Externa"
cadastro_externo = false

# Bot envia:
http://157.180.72.42/cadastro?telegram_id=123&username=joao&nome=Jo%C3%A3o
```

## 🐛 Troubleshooting

### Problema: Link não funciona

**Solução:**
1. Verifique se o arquivo está acessível: `curl http://sua-url/cadastro.html`
2. Verifique permissões do arquivo (chmod 644)
3. Verifique se o Nginx está servindo arquivos HTML

### Problema: Formulário não envia dados

**Solução:**
1. Abra o Console do navegador (F12)
2. Verifique erros de CORS
3. Verifique se a URL da API está correta no HTML
4. Teste manualmente: `curl -X POST http://157.180.72.42/api/cadastro -d '{"nome":"Teste",...}'`

### Problema: Bot envia URL errada

**Solução:**
1. Verifique configuração no banco:
   ```sql
   SELECT * FROM system_config WHERE chave IN ('cadastro_url', 'cadastro_externo');
   ```
2. Verifique se salvou as configurações no dashboard
3. Reinicie o bot se necessário

### Problema: Tabela system_config não existe

**Solução:**
```bash
# Execute o SQL manualmente no Supabase Dashboard
cat migrations/create-system-config.sql
```

## 📊 Monitoramento

Para ver qual URL está sendo usada:

```bash
# Logs do bot ao processar /cadastro
tail -f /var/log/tlgrupos/bot.log | grep "URL gerada"

# Deve aparecer:
[Cadastro] URL gerada: http://157.180.72.42/cadastro.html?telegram_id=...
```

## 🔄 Atualizar o cadastro.html

Se precisar regenerar o arquivo:

1. Acesse `/dashboard/settings`
2. Clique em **"Baixar cadastro.html"** novamente
3. Substitua o arquivo no servidor:
   ```bash
   sudo cp cadastro.html /var/www/html/cadastro.html
   ```

## 📚 Arquivos Relacionados

- **Migração SQL**: `migrations/create-system-config.sql`
- **API de Config**: `src/app/api/config/route.ts`
- **API Gerar HTML**: `src/app/api/generate-cadastro-html/route.ts`
- **Dashboard Settings**: `src/app/dashboard/settings/page.tsx`
- **Webhook Telegram**: `src/lib/telegram-webhook.ts` (função `getCadastroUrl()`)

## ✅ Checklist de Configuração

- [ ] Executar SQL de criação da tabela `system_config`
- [ ] Baixar `cadastro.html` pelo dashboard
- [ ] Hospedar o arquivo em um servidor acessível
- [ ] Configurar URL no dashboard `/dashboard/settings`
- [ ] Ativar toggle "Usar URL Externa"
- [ ] Salvar configurações
- [ ] Testar comando `/cadastro` no Telegram
- [ ] Verificar se o link abre o formulário correto
- [ ] Fazer um cadastro de teste
- [ ] Verificar se recebe o link do grupo

---

**Pronto!** 🎉 Agora você tem um formulário de cadastro totalmente flexível que pode ser hospedado em qualquer lugar!
