# 📧 Sistema de Notificações e Automação - TLGrupos

## 🎯 Visão Geral

Sistema completo de notificações automáticas que integra aprovação de pagamentos, envio de links de acesso, notificações de vencimento e remoção automática de membros.

---

## 🔄 Fluxo Completo

### 1️⃣ PAGAMENTO APROVADO

**Quando um admin aprova um pagamento:**

```
PATCH /api/payments
{
  "payment_id": "uuid",
  "action": "approve",
  "approved_by": "Admin Nome"
}
```

**O que acontece automaticamente:**

1. ✅ **Atualiza data de vencimento** do membro (função `approve_payment()` do banco)
2. ✅ **Gera link de convite** do Telegram:
   - Link único se tiver `telegram_user_id`
   - Link genérico se não tiver
3. ✅ **Salva o link** na coluna `payments.invite_link`
4. ✅ **Envia notificações:**
   - 📧 **Email** com template bonito e link de acesso
   - 📱 **Telegram** mensagem privada com link
5. ✅ **Registra logs** no banco

**Código:** `/src/app/api/payments/route.ts` (linhas 228-318)

---

### 2️⃣ PAGAMENTO REJEITADO

**Quando um admin rejeita um pagamento:**

```
PATCH /api/payments
{
  "payment_id": "uuid",
  "action": "reject",
  "rejected_by": "Admin Nome",
  "motivo_rejeicao": "Comprovante ilegível"
}
```

**O que acontece automaticamente:**

1. ✅ **Marca pagamento** como rejeitado
2. ✅ **Envia notificações:**
   - 📧 **Email** explicando motivo da rejeição
   - 📱 **Telegram** com dicas para corrigir
3. ✅ **Registra logs** no banco

**Código:** `/src/app/api/payments/route.ts` (linhas 359-394)

---

### 3️⃣ NOTIFICAÇÕES DE VENCIMENTO

**Cron job diário que verifica membros próximos do vencimento.**

#### 📅 Configuração

No painel **Configurações > Notificações**, você pode configurar:

- ✅ **Até 3 avisos** diferentes (ex: 5, 7 e 30 dias antes)
- ✅ **Dias editáveis** (1-365 dias)
- ✅ **Toggles individuais** para ativar/desativar cada aviso
- ✅ **Canais:** Telegram e/ou Email
- ✅ **Template** da mensagem customizável

**Chaves no banco (`system_config`):**
```
notif_vencimento_ativo = true/false
notif_vencimento_1_ativo = true/false
notif_vencimento_1_dias = 5
notif_vencimento_2_ativo = true/false
notif_vencimento_2_dias = 7
notif_vencimento_3_ativo = true/false
notif_vencimento_3_dias = 30
notif_enviar_telegram = true/false
notif_enviar_email = true/false
notif_mensagem_vencimento = "Olá {nome}! Seu acesso expira em {dias} dias..."
```

#### 🔧 Como Executar

**Manualmente (teste):**
```bash
curl -X GET http://localhost:3000/api/cron/check-expirations \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

**Automático (configurar em cron-job.org ou Vercel Cron):**

Adicionar em `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-expirations",
    "schedule": "0 9 * * *"
  }]
}
```

Ou configurar em [cron-job.org](https://cron-job.org):
- URL: `https://seusite.com/api/cron/check-expirations`
- Header: `Authorization: Bearer SEU_CRON_SECRET`
- Schedule: Diariamente às 09:00

**Código:** `/src/app/api/cron/check-expirations/route.ts`

---

### 4️⃣ REMOÇÃO AUTOMÁTICA

**Cron job diário que remove membros vencidos dos grupos do Telegram.**

#### 📅 Configuração

No painel **Configurações > Bot**, você pode configurar:

- ✅ **Toggle** para ativar/desativar remoção automática
- ✅ **Horário** de execução diária (formato 24h)

**Chaves no banco (`system_config`):**
```
bot_remocao_automatica = true/false
bot_horario_remocao = 03:00
```

#### 🔧 Como Executar

**Manualmente (teste):**
```bash
curl -X GET http://localhost:3000/api/cron/remove-expired \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

**Automático:**

Adicionar em `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-expirations",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/remove-expired",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**O que acontece:**

1. ✅ Busca membros com `status='ativo'` e `data_vencimento < hoje`
2. ✅ Remove de **todos os grupos** do Telegram
3. ✅ Envia **notificação** informando a remoção
4. ✅ Atualiza `status='vencido'`
5. ✅ Registra **logs** detalhados

**Código:** `/src/app/api/cron/remove-expired/route.ts`

---

## 📁 Estrutura de Arquivos

```
src/
├── services/
│   ├── notification-service.ts      # Serviço centralizado de notificações
│   ├── email-service.ts              # Envio de emails (Resend/SendGrid/Gmail)
│   └── cron-service.ts               # Funções dos cron jobs
│
├── app/api/
│   ├── payments/route.ts             # Aprovação/Rejeição de pagamentos
│   └── cron/
│       ├── check-expirations/route.ts  # Verificar vencimentos
│       └── remove-expired/route.ts     # Remover vencidos
│
└── lib/
    ├── telegram.ts                   # Funções do Telegram
    └── email.ts                      # Configuração de email

scripts/
└── add-invite-link-to-payments.sql  # Adicionar coluna invite_link
```

---

## 🔑 Variáveis de Ambiente Necessárias

```env
# Telegram
TELEGRAM_BOT_TOKEN=bot123456:ABC...
TELEGRAM_GROUP_ID=-1002414487357

# Email (escolha um)
EMAIL_PROVIDER=gmail  # ou "resend" ou "sendgrid"

# Gmail
GMAIL_USER=seuemail@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxx

# OU Resend
RESEND_API_KEY=re_...

# OU SendGrid
SENDGRID_API_KEY=SG....

EMAIL_FROM=noreply@seudominio.com

# Cron Security
CRON_SECRET=uma_senha_secreta_aleatoria
```

---

## 📊 Templates de Email

### ✅ Pagamento Aprovado

Email bonito com:
- 🎉 Header com gradiente
- 📅 Informações do plano
- 🔗 Botão com link de acesso
- ⚠️ Avisos importantes

**Template:** `/src/services/email-service.ts` (linhas 141-231)

### ❌ Pagamento Rejeitado

Email com:
- ❌ Header informativo
- 📝 Motivo da rejeição
- 💡 Dicas para corrigir

**Template:** `/src/services/email-service.ts` (linhas 317-437)

### ⚠️ Aviso de Vencimento

Email customizável via painel de configurações.

**Template:** `/src/services/notification-service.ts` (sendExpirationWarning)

---

## 🛠️ Configuração Pós-Deploy

### 1. **Executar Migration do Banco**

No SQL Editor do Supabase:
```sql
-- Adicionar coluna invite_link
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS invite_link TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_invite_link
ON payments(invite_link);
```

**Arquivo:** `/scripts/add-invite-link-to-payments.sql`

### 2. **Configurar Email**

Escolha um provedor e configure as variáveis de ambiente.

**Gmail (mais fácil para teste):**
1. Ativar verificação em 2 etapas
2. Gerar senha de app em https://myaccount.google.com/apppasswords
3. Adicionar ao `.env.local`

### 3. **Configurar Cron Jobs**

**Opção A: Vercel Cron (recomendado para Vercel)**

Criar `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-expirations",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/remove-expired",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Opção B: cron-job.org (funciona em qualquer host)**

1. Criar conta em https://cron-job.org
2. Adicionar dois cron jobs:
   - URL: `https://seusite.com/api/cron/check-expirations`
   - Header: `Authorization: Bearer SEU_CRON_SECRET`
   - Schedule: `0 9 * * *` (diariamente às 09:00)

   - URL: `https://seusite.com/api/cron/remove-expired`
   - Header: `Authorization: Bearer SEU_CRON_SECRET`
   - Schedule: `0 3 * * *` (diariamente às 03:00)

### 4. **Configurar no Painel**

Acessar **Configurações** e configurar:

**Aba Bot:**
- ✅ Remoção Automática: Ativado
- ⏰ Horário: 03:00

**Aba Notificações:**
- ✅ Notificações de Vencimento: Ativado
- 📅 Aviso 1: 5 dias antes (ativo)
- 📅 Aviso 2: 7 dias antes (ativo)
- 📅 Aviso 3: 30 dias antes (ativo)
- 📧 Canais: Telegram + Email
- ✏️ Mensagem customizada

---

## 🧪 Testar o Sistema

### 1. **Testar Aprovação de Pagamento**

1. Criar um pagamento pendente
2. Aprovar via painel
3. Verificar:
   - ✅ Link gerado no banco
   - ✅ Email recebido
   - ✅ Mensagem no Telegram
   - ✅ Logs registrados

### 2. **Testar Notificações de Vencimento**

Criar membro com data de vencimento em 5 dias e executar:
```bash
curl http://localhost:3000/api/cron/check-expirations
```

### 3. **Testar Remoção Automática**

Criar membro com data de vencimento no passado e executar:
```bash
curl http://localhost:3000/api/cron/remove-expired
```

---

## 📈 Monitoramento

Todos os eventos são registrados na tabela `logs`:

```sql
SELECT *
FROM logs
WHERE acao IN ('notificacao', 'remocao_automatica', 'broadcast')
ORDER BY created_at DESC
LIMIT 50;
```

**Tipos de log:**
- `notificacao` → Envio de notificações
- `remocao_automatica` → Remoção de membros vencidos
- `broadcast` → Envio em massa

---

## ❓ Troubleshooting

### Email não está enviando

1. Verificar variáveis de ambiente
2. Verificar logs do servidor
3. Testar provedor manualmente
4. Para Gmail: verificar senha de app (não a senha normal!)

### Telegram não está enviando

1. Verificar `TELEGRAM_BOT_TOKEN`
2. Verificar se bot tem permissão no grupo
3. Verificar `telegram_user_id` do membro
4. Ver logs em `/api/payments` ou `/api/cron/*`

### Cron jobs não estão executando

1. Verificar se configurou corretamente
2. Verificar `CRON_SECRET`
3. Ver logs do serviço de cron (Vercel ou cron-job.org)
4. Testar manualmente com curl

---

## 🚀 Próximos Passos

- [ ] Dashboard de monitoramento de notificações
- [ ] Relatórios de envio (taxa de sucesso)
- [ ] A/B testing de templates
- [ ] Notificações via WhatsApp
- [ ] SMS para casos críticos

---

**Documentação atualizada em:** 05/12/2024
