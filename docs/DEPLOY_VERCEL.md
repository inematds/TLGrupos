# 🚀 DEPLOY NO VERCEL - GUIA COMPLETO

## 📋 Pré-requisitos

- ✅ Código no GitHub: https://github.com/inematds/TLGrupos
- ✅ Conta no Vercel: https://vercel.com
- ✅ Supabase configurado
- ✅ Bot do Telegram criado
- ✅ Conta Resend (para emails)

---

## 🎯 PASSO A PASSO

### 1️⃣ Importar Projeto no Vercel

1. Acesse: https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Selecione **"Import from GitHub"**
4. Procure por: `inematds/TLGrupos`
5. Clique em **"Import"**

---

### 2️⃣ Configurar Variáveis de Ambiente

Na tela de configuração do projeto, clique em **"Environment Variables"** e adicione:

#### 🔵 Supabase (OBRIGATÓRIO)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xetowlvhhnxewvglxklo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

**Onde encontrar:**
- URL: Supabase Dashboard → Settings → API
- Service Role Key: Supabase Dashboard → Settings → API → Service Role Key (secret)

#### 📱 Telegram Bot (OBRIGATÓRIO)
```bash
TELEGRAM_BOT_TOKEN=seu-bot-token
TELEGRAM_GROUP_ID=-1002414487357
```

**Onde encontrar:**
- Token: Fale com @BotFather no Telegram
- Group ID: Use o script `npm run get-updates`

#### 📧 Resend - Email (OBRIGATÓRIO)
```bash
RESEND_API_KEY=re_42VrdCj2_NY3ZZ1u1goDaawgTLjPJVrV9
EMAIL_FROM=onboarding@resend.dev
EMAIL_PROVIDER=resend
```

**Onde encontrar:**
- API Key: https://resend.com/api-keys
- Pode usar o domínio teste: `onboarding@resend.dev`

#### 🌐 URLs da Aplicação (OBRIGATÓRIO)
```bash
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
NEXTAUTH_URL=https://seu-projeto.vercel.app
```

**IMPORTANTE:**
- Deixe em branco inicialmente
- Após o deploy, edite e coloque a URL do Vercel
- Exemplo: `https://tl-grupos.vercel.app`

#### 🔒 Segurança (OBRIGATÓRIO)
```bash
NEXTAUTH_SECRET=gere-uma-chave-aleatoria-aqui
CRON_SECRET=outra-chave-aleatoria
```

**Como gerar chaves:**
```bash
# Execute no terminal
openssl rand -base64 32
```

#### 💳 PIX / Pagamentos (OPCIONAL)
```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu-token
MERCADOPAGO_PUBLIC_KEY=sua-chave

# PicPay
PICPAY_TOKEN=seu-token
PICPAY_SELLER_TOKEN=seu-seller-token

# Asaas
ASAAS_API_KEY=sua-key
```

**Nota:** Só adicione se for usar PIX automático (em desenvolvimento)

#### 🛠️ Node Environment
```bash
NODE_ENV=production
```

---

### 3️⃣ Configurar Build & Deploy

**Na tela de configuração:**

- **Framework Preset:** Next.js
- **Root Directory:** `./` (deixe padrão)
- **Build Command:** `npm run build` (padrão)
- **Output Directory:** `.next` (padrão)
- **Install Command:** `npm install` (padrão)
- **Node Version:** 18.x ou superior

Clique em **"Deploy"**

---

### 4️⃣ Configurar Cron Jobs (Opcional)

O arquivo `vercel.json` já está configurado com:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-notifications",
      "schedule": "0 9 * * *"  // Envia notificações às 9h
    },
    {
      "path": "/api/cron/remove-expired",
      "schedule": "0 0 * * *"  // Remove expirados à meia-noite
    },
    {
      "path": "/api/processar-pagamentos",
      "schedule": "*/30 * * * *"  // Processa pagamentos a cada 30min
    }
  ]
}
```

**⚠️ IMPORTANTE:**
- Cron Jobs só funcionam em planos **Vercel Pro** ou superior
- No plano Hobby (gratuito), você precisa usar um serviço externo
- Alternativa: Use cron-job.org ou EasyCron para chamar suas APIs

---

### 5️⃣ Atualizar URLs Após Deploy

Após o primeiro deploy, você receberá uma URL como:
```
https://tl-grupos.vercel.app
```

**ATUALIZE as variáveis de ambiente:**

1. Vá em **Settings → Environment Variables**
2. Edite:
   - `NEXT_PUBLIC_APP_URL` → `https://tl-grupos.vercel.app`
   - `NEXTAUTH_URL` → `https://tl-grupos.vercel.app`
3. Clique em **"Redeploy"** no dashboard

---

### 6️⃣ Configurar Domínio Personalizado (Opcional)

1. Vá em **Settings → Domains**
2. Adicione seu domínio: `seudominio.com`
3. Configure DNS conforme instruções do Vercel
4. Aguarde propagação (5-60 minutos)
5. Atualize as variáveis de ambiente com o novo domínio

---

## 🎯 CHECKLIST PÓS-DEPLOY

Após o deploy ser concluído, teste:

### ✅ Páginas Públicas
- [ ] https://seu-projeto.vercel.app (Landing page)
- [ ] https://seu-projeto.vercel.app/register (Registro direto)
- [ ] https://seu-projeto.vercel.app/register-pix-upload (PIX com upload)
- [ ] https://seu-projeto.vercel.app/register-pix-email (PIX com email)

### ✅ Dashboard
- [ ] https://seu-projeto.vercel.app/dashboard (Dashboard)
- [ ] https://seu-projeto.vercel.app/dashboard/members (Membros)
- [ ] https://seu-projeto.vercel.app/dashboard/validar-pagamentos (Validar)
- [ ] https://seu-projeto.vercel.app/dashboard/cadastros (Histórico)
- [ ] https://seu-projeto.vercel.app/dashboard/planos (Planos)

### ✅ APIs
- [ ] https://seu-projeto.vercel.app/api/plans (Ver planos)
- [ ] https://seu-projeto.vercel.app/api/members (Ver membros)
- [ ] https://seu-projeto.vercel.app/api/stats (Estatísticas)

### ✅ Funcionalidades
- [ ] Criar novo membro
- [ ] Gerar link do Telegram
- [ ] Enviar email de acesso
- [ ] Upload de comprovante
- [ ] Validar pagamento
- [ ] Aprovar pagamento

---

## ⚠️ PROBLEMAS COMUNS

### 1. Erro 500 ao acessar API
**Causa:** Variáveis de ambiente não configuradas
**Solução:** Verifique todas as variáveis obrigatórias

### 2. Email não enviado
**Causa:** RESEND_API_KEY inválida ou EMAIL_FROM incorreto
**Solução:**
- Verifique a chave em https://resend.com/api-keys
- Use domínio verificado ou `onboarding@resend.dev`

### 3. Link do Telegram não gerado
**Causa:** TELEGRAM_BOT_TOKEN ou TELEGRAM_GROUP_ID incorretos
**Solução:**
- Teste localmente: `npm run get-updates`
- Verifique se o bot é admin do grupo

### 4. Cron Jobs não executam
**Causa:** Plano Vercel Hobby (gratuito)
**Solução:**
- Upgrade para Pro ($20/mês)
- OU use serviço externo: https://cron-job.org

### 5. Erro de Build
**Causa:** Dependências faltando ou código TypeScript com erros
**Solução:**
- Veja logs no Vercel Dashboard
- Teste build local: `npm run build`

---

## 🔧 COMANDOS ÚTEIS

### Testar build localmente
```bash
npm run build
npm start
```

### Ver logs do Vercel
```bash
npm install -g vercel
vercel logs
```

### Fazer redeploy
```bash
vercel --prod
```

---

## 📊 MONITORAMENTO

### Vercel Dashboard
- **Analytics:** Ver acessos e performance
- **Logs:** Ver erros em tempo real
- **Deployments:** Histórico de deploys

### Supabase Dashboard
- **Database:** Ver dados em tempo real
- **Storage:** Ver comprovantes enviados
- **API Logs:** Ver chamadas à API

### Resend Dashboard
- **Emails:** Ver emails enviados
- **Logs:** Ver erros de envio
- **Webhooks:** Configurar notificações

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Deploy no Vercel concluído
2. ⏳ Configurar domínio personalizado (opcional)
3. ⏳ Configurar email com domínio próprio (opcional)
4. ⏳ Configurar PIX automático (futuro)
5. ⏳ Upgrade para Vercel Pro (se precisar cron jobs)

---

## 📞 SUPORTE

- **Vercel:** https://vercel.com/support
- **Supabase:** https://supabase.com/support
- **Telegram:** https://core.telegram.org/bots
- **Resend:** https://resend.com/support

---

## 🎯 LINKS RÁPIDOS

- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/inematds/TLGrupos
- **Supabase Dashboard:** https://app.supabase.com
- **Resend Dashboard:** https://resend.com/emails
- **Telegram BotFather:** https://t.me/BotFather

---

**Boa sorte com o deploy! 🚀**
