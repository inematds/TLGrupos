# 📧 CONFIGURAR EMAIL PERSONALIZADO

## ⚙️ Como Usar Seu Próprio Domínio

Atualmente o sistema usa: `onboarding@resend.dev` (domínio de teste)

Para usar seu próprio email (ex: `noreply@seudominio.com`):

---

## 🔧 PASSO 1: Configurar Domínio no Resend

1. Acesse: https://resend.com/domains
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `seudominio.com`)
4. Siga as instruções para adicionar registros DNS:
   - SPF
   - DKIM
   - DMARC
5. Aguarde validação (pode levar até 48h)

---

## 🔧 PASSO 2: Atualizar .env.local

Edite o arquivo `.env.local` e altere:

```bash
# Antes:
EMAIL_FROM=onboarding@resend.dev

# Depois:
EMAIL_FROM=noreply@seudominio.com
# ou
EMAIL_FROM=contato@seudominio.com
# ou qualquer email do seu domínio
```

---

## 🔧 PASSO 3: Reiniciar o Servidor

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente:
PORT=3020 npm run dev
```

---

## ✅ PRONTO!

Agora os emails sairão do seu domínio personalizado.

---

## 🆓 Usar Domínio de Teste (Atual)

Se você quer manter `onboarding@resend.dev`:

✅ **Vantagens:**
- Já está funcionando
- Não precisa configurar DNS
- 100 emails/dia grátis

⚠️ **Desvantagens:**
- Não é seu domínio
- Pode cair em spam
- Menos profissional

---

## 💰 Limites do Resend

**Plano Gratuito:**
- 100 emails/dia
- 3.000 emails/mês
- Domínio de teste incluído

**Se precisar mais:**
- Upgrade no Resend: https://resend.com/pricing
- Ou trocar para SendGrid (já tem suporte no código)

---

## 📊 Ver Logs de Email

Para verificar se os emails foram enviados:

1. Acesse: https://resend.com/emails
2. Veja histórico de todos os emails
3. Status: Delivered / Bounced / Complained

---

## 🔄 Alternativa: SendGrid

Se preferir usar SendGrid em vez de Resend:

1. Crie conta: https://sendgrid.com
2. Gere API Key
3. Edite `.env.local`:

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@seudominio.com
```

O código já suporta ambos!
