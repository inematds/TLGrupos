# 🚀 Guia de Setup Rápido - TLGrupos

## Checklist de Configuração

### ☐ 1. Instalar Dependências

```bash
npm install
```

### ☐ 2. Criar Bot no Telegram

1. Abra o Telegram
2. Procure por `@BotFather`
3. Envie: `/newbot`
4. Escolha um nome: `Meu Bot de Grupos`
5. Escolha um username: `meu_bot_grupos_bot`
6. **Copie o token** fornecido (formato: `123456:ABC-DEF...`)

### ☐ 3. Obter ID do Grupo

1. Adicione `@RawDataBot` ao seu grupo privado
2. Ele enviará as informações, procure por: `"chat":{"id":-1001234567890`
3. **Copie o número negativo** (exemplo: `-1001234567890`)
4. Remova o `@RawDataBot` do grupo

### ☐ 4. Adicionar Bot ao Grupo como Admin

1. Adicione seu bot ao grupo (procure pelo username escolhido)
2. Vá em: **Configurações do Grupo** > **Administradores**
3. Clique em **Adicionar Administrador**
4. Selecione seu bot
5. Ative as permissões:
   - ✅ **Adicionar usuários**
   - ✅ **Banir usuários**
6. Salve

### ☐ 5. Criar Projeto no Supabase

1. Acesse: https://supabase.com
2. Clique em **New Project**
3. Preencha:
   - Nome: `TLGrupos`
   - Password: (escolha uma senha forte)
   - Region: (escolha a mais próxima)
4. Aguarde a criação (1-2 minutos)

### ☐ 6. Obter Credenciais do Supabase

1. No projeto criado, vá em: **Settings** (ícone de engrenagem)
2. Clique em **API**
3. **Copie**:
   - `Project URL` (exemplo: `https://abc123.supabase.co`)
   - `anon/public` key (começa com `eyJ...`)
   - `service_role` key (começa com `eyJ...` - clique em "Reveal" para ver)

### ☐ 7. Executar Migration SQL

1. No Supabase Dashboard, vá em: **SQL Editor** (ícone de banco de dados)
2. Clique em **New Query**
3. Abra o arquivo: `supabase/migrations/001_initial_schema.sql`
4. **Copie todo o conteúdo**
5. **Cole** no SQL Editor
6. Clique em **Run** ou pressione `Ctrl+Enter`
7. Aguarde aparecer: ✅ **Success**

### ☐ 8. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

2. Edite `.env.local`:
```env
# Supabase (cole as chaves copiadas)
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Telegram Bot (cole o token e ID do grupo)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_GROUP_ID=-1001234567890

# Cron Secret (gere uma chave aleatória)
CRON_SECRET=minha-chave-secreta-aleatoria-123

# Environment
NODE_ENV=development
```

💡 **Dica**: Para gerar uma chave aleatória para CRON_SECRET:
```bash
openssl rand -hex 32
```

### ☐ 9. Testar Configuração do Bot

```bash
npm run setup:bot
```

**Saída esperada**:
```
✅ Bot conectado com sucesso!
✅ Grupo encontrado!
✅ Bot é administrador do grupo!
✅ Tudo configurado corretamente!
```

Se aparecer ❌, revise os passos anteriores.

### ☐ 10. Iniciar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

Você verá o dashboard (ainda vazio, sem membros).

---

## 🎉 Pronto! Agora você pode:

### Adicionar seu Primeiro Membro

Use o terminal ou Postman/Insomnia:

```bash
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "telegram_username": "joaosilva",
    "data_vencimento": "2025-12-31"
  }'
```

### Testar Notificações (Manual)

```bash
npm run cron:send-notifications
```

### Testar Remoção de Vencidos (Manual)

```bash
npm run cron:check-expired
```

---

## ❓ Problemas Comuns

### Bot não é admin do grupo
- ❌ **Erro**: "Bot is not an administrator"
- ✅ **Solução**: Revise o passo 4, certifique-se de dar as permissões corretas

### Grupo não encontrado
- ❌ **Erro**: "Chat not found"
- ✅ **Solução**: Verifique se o ID do grupo está correto e começa com `-100`

### Erro de conexão com Supabase
- ❌ **Erro**: "Invalid API key"
- ✅ **Solução**: Verifique se copiou as chaves corretas (URL e anon key)

### Tabelas não existem
- ❌ **Erro**: "relation members does not exist"
- ✅ **Solução**: Execute a migration SQL (passo 7)

---

## 📚 Próximos Passos

1. Configurar cron jobs para automação (ver README.md)
2. Adicionar mais membros
3. Testar fluxo completo de notificações
4. Fazer deploy em produção (Vercel recomendado)
5. Configurar backup do Supabase

---

✅ **Tudo funcionando?** Consulte o `README.md` para documentação completa!
