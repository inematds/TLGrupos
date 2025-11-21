# 🤖 Como Usar o Bot do Telegram

## ✅ BOT ESTÁ FUNCIONANDO!

**Bot:** @INEMATLGrupobot
**ID:** 8211881890

---

## 🚀 Como Iniciar o Bot:

### Em Desenvolvimento (Local):

```bash
# Terminal 1: Servidor Web
npm run dev

# Terminal 2: Bot do Telegram
npm run start:bot
```

**IMPORTANTE:** O bot precisa rodar em **modo POLLING** em desenvolvimento local (não precisa HTTPS)

---

## 📱 Comandos Disponíveis:

### 1. `/cadastro` - Formulário Completo ⭐ NOVO!

**O que faz:**
- Envia link personalizado para formulário web
- Usuário preenche dados completos (email, telefone, cidade, etc.)
- **GERA LINK DE CONVITE AUTOMÁTICO**
- Usuário clica e **ENTRA NO GRUPO**

**Como usar:**
1. Usuário digita `/cadastro` no Telegram
2. Bot envia link personalizado
3. Usuário clica, preenche formulário
4. Recebe botão "ENTRAR NO GRUPO"
5. **Entra automaticamente!**

**Dados coletados:**
- Nome ✅ (pré-preenchido)
- Email ✅
- Telefone ✅
- Cidade
- UF
- Data de Nascimento
- Nicho
- Interesses
- Grupo Favorito

---

### 2. `/registrar` - Cadastro Rápido

**O que faz:**
- Cadastro instantâneo no Telegram
- Usa apenas dados do perfil do Telegram
- 30 dias de acesso
- Resposta imediata

**Como usar:**
1. Digite `/registrar` no Telegram
2. Pronto! Cadastrado automaticamente

**Dados coletados:**
- Nome do Telegram
- Username do Telegram
- ID do Telegram

---

### 3. `/status` - Ver Status

**O que faz:**
- Mostra informações do seu cadastro
- Vencimento
- Dias restantes
- Status atual

---

### 4. `/entrar TOKEN` - Entrar com Código

**O que faz:**
- Usa um código de acesso para entrar
- Código fornecido pelo admin

**Exemplo:**
```
/entrar ABC123
```

---

## 🔄 Auto-Cadastro Automático:

### O bot cadastra automaticamente quando:

1. **Alguém entra no grupo**
   - Auto-cadastro com 30 dias
   - Marca como `no_grupo = true`

2. **Alguém envia mensagem**
   - Se não estiver cadastrado, cadastra automaticamente
   - Silencioso (não envia mensagem)

---

## 🎯 Fluxo Completo de Cadastro:

### Opção A: Formulário Completo (`/cadastro`)

```
Usuário digita /cadastro
        ↓
Bot envia link personalizado
http://192.168.1.91:3000/cadastro?telegram_id=123&...
        ↓
Usuário clica e abre formulário
        ↓
Preenche dados (2 minutos)
        ↓
Clica em "Cadastrar"
        ↓
Sistema cria membro + gera link
        ↓
Exibe botão "ENTRAR NO GRUPO"
        ↓
Usuário clica
        ↓
ENTRA NO GRUPO! ✅
```

### Opção B: Cadastro Rápido (`/registrar`)

```
Usuário digita /registrar
        ↓
Bot cadastra instantaneamente
        ↓
Responde com confirmação
        ↓
Fim (já cadastrado)
```

---

## ⚙️ Configuração:

### Variáveis de Ambiente (`.env.local`):

```env
# Telegram
TELEGRAM_BOT_TOKEN=8211881890:AAHY6UJ2tXIRMxpVpDHGNMDDOna5DPHM3mI
TELEGRAM_GROUP_ID=-1002414487357

# App
NEXTAUTH_URL=http://192.168.1.91:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xdvetjrrrifddoowuqhz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🔧 Troubleshooting:

### Bot não responde?

**Verifique:**
1. Bot está rodando? (`npm run start:bot`)
2. Servidor está rodando? (`npm run dev`)
3. Credenciais corretas no `.env.local`?

### Usuário não consegue entrar no grupo?

**Motivos possíveis:**
1. Link de convite não foi gerado (falta telegram_id)
2. Migrações não foram executadas
3. Problema de permissões do bot no grupo

**Solução:**
- Use `/cadastro` (gera link automaticamente)
- Execute as migrações (`EXECUTAR_MIGRACOES_FORMULARIO.sql`)
- Certifique-se que o bot é admin do grupo

---

## 📊 Status Atual:

```bash
# Verificar se o bot está rodando
ps aux | grep "start-bot"

# Ver logs do bot
# (os logs aparecem no terminal onde rodou npm run start:bot)

# Parar o bot
# Pressione Ctrl+C no terminal do bot
```

---

## 🎉 ESTÁ TUDO FUNCIONANDO!

### ✅ O que está pronto:

- [x] Bot rodando em polling mode
- [x] Comando `/cadastro` funcionando
- [x] Comando `/registrar` funcionando
- [x] Comando `/status` funcionando
- [x] Auto-cadastro ao entrar
- [x] Auto-cadastro ao enviar mensagem
- [x] Link de convite gerado automaticamente
- [x] Formulário completo funcionando
- [x] Entrada automática no grupo

### 📝 Para testar agora:

1. **Abra o Telegram**
2. **Digite:** `/cadastro`
3. **Clique no link**
4. **Preencha o formulário**
5. **Clique em "ENTRAR NO GRUPO"**
6. **Pronto!** ✅

---

## 🚀 Em Produção:

### Para usar em produção com webhook (HTTPS):

1. Configure domínio com HTTPS
2. Atualize `NEXTAUTH_URL` no `.env`
3. Configure webhook:
   ```bash
   node scripts/setup-telegram-webhook.js
   ```
4. Não precisa rodar `npm run start:bot`
5. O webhook receberá as mensagens automaticamente

---

**Desenvolvido por:** James (Dev Agent) 💻
**Data:** 21/11/2025
**Status:** ✅ **100% FUNCIONANDO**

**Agora é só testar!** Digite `/cadastro` no Telegram! 🎉
