# 📊 Sistema de Controle de Notificações - TLGrupos

## 🎯 Visão Geral

Sistema robusto de rastreamento e controle de notificações que garante:

✅ **Nenhuma notificação duplicada**
✅ **Controle por canal** (email/telegram separadamente)
✅ **Respeita configurações** (só envia se canal estiver ativo)
✅ **Histórico completo** de todas as tentativas
✅ **Sistema de retry** automático para falhas
✅ **Dashboards e relatórios** de performance

---

## 🔍 Como o Sistema Funciona

### 1. Verificações Antes de Enviar

Antes de enviar qualquer notificação, o sistema verifica:

```typescript
// 1. Canais ativos nas configurações
const activeChannels = await getActiveChannels();
// Retorna: { email: true/false, telegram: true/false }

// 2. Se já foi enviada essa notificação
const alreadySent = await checkNotificationSent(memberId, 'payment_approved');
// Retorna: { alreadySent: true/false, emailSent: true/false, telegramSent: true/false }
```

**Exemplo prático:**
- Se `notif_enviar_email = false` → Não envia email
- Se `notif_enviar_telegram = true` → Envia telegram
- Se membro não tem email → Não tenta enviar email
- Se já enviou antes → Não envia de novo

### 2. Registro de Notificação

Cada notificação é registrada na tabela `notification_history`:

```sql
{
  id: uuid,
  member_id: uuid,
  notification_type: 'payment_approved' | 'payment_rejected' | 'expiry_warning' | 'news',

  -- Status por canal
  email_sent: false → true,
  email_sent_at: timestamp,
  email_error: null | 'erro',
  email_attempts: 0 → 1 → 2,

  telegram_sent: false → true,
  telegram_sent_at: timestamp,
  telegram_error: null | 'erro',
  telegram_attempts: 0 → 1 → 2,

  -- Conteúdo
  message: 'texto da mensagem',
  invite_link: 'https://t.me/...'
}
```

### 3. Fluxo de Envio

```
┌─────────────────────────────────────────────────────────────┐
│ 1. VERIFICAR CANAIS ATIVOS                                   │
│    ✓ notif_enviar_email = true?                             │
│    ✓ notif_enviar_telegram = true?                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 2. VERIFICAR SE JÁ FOI ENVIADA                              │
│    ✓ Busca no notification_history                          │
│    ✓ Se já enviou ambos canais → PULAR                      │
│    ✓ Se enviou só 1 canal → Enviar o que falta              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 3. CRIAR REGISTRO                                            │
│    INSERT INTO notification_history (...)                   │
│    email_sent = false, telegram_sent = false                │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│  SE EMAIL ATIVO │    │ SE TELEGRAM ATIVO│
│  E MEMBRO TEM   │    │  E MEMBRO TEM    │
│     EMAIL       │    │  TELEGRAM_USER_ID│
└────────┬────────┘    └────────┬─────────┘
         │                      │
┌────────▼────────┐    ┌────────▼─────────┐
│  ENVIAR EMAIL   │    │ ENVIAR TELEGRAM  │
│                 │    │                  │
│  ✓ Sucesso →    │    │  ✓ Sucesso →     │
│    email_sent=t │    │    telegram_sent=t│
│                 │    │                  │
│  ✗ Erro →       │    │  ✗ Erro →        │
│    email_error  │    │    telegram_error│
│    attempts++   │    │    attempts++    │
└─────────────────┘    └──────────────────┘
```

---

## 📊 Tabela: notification_history

### Estrutura

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único da notificação |
| `member_id` | UUID | ID do membro |
| `payment_id` | UUID | ID do pagamento (se aplicável) |
| `notification_type` | VARCHAR | Tipo: `payment_approved`, `payment_rejected`, `expiry_warning`, `news`, `removal` |
| `days_before_expiry` | INTEGER | Para avisos de vencimento (5, 7, 30) |
| `warning_number` | INTEGER | Qual aviso (1, 2 ou 3) |
| **Email** | | |
| `email_sent` | BOOLEAN | Email enviado com sucesso? |
| `email_sent_at` | TIMESTAMP | Quando foi enviado |
| `email_error` | TEXT | Mensagem de erro (se houver) |
| `email_attempts` | INTEGER | Número de tentativas |
| **Telegram** | | |
| `telegram_sent` | BOOLEAN | Telegram enviado com sucesso? |
| `telegram_sent_at` | TIMESTAMP | Quando foi enviado |
| `telegram_error` | TEXT | Mensagem de erro (se houver) |
| `telegram_attempts` | INTEGER | Número de tentativas |
| **Dados** | | |
| `subject` | TEXT | Assunto (para email) |
| `message` | TEXT | Conteúdo da mensagem |
| `invite_link` | TEXT | Link de acesso (se aplicável) |
| `scheduled_for` | TIMESTAMP | Quando deveria ser enviada |
| `created_at` | TIMESTAMP | Criado em |
| `updated_at` | TIMESTAMP | Atualizado em |

### Índices

```sql
-- Performance
idx_notification_history_member_id
idx_notification_history_type
idx_notification_history_scheduled

-- Buscar notificações pendentes (email OU telegram não enviado)
idx_notification_pending
WHERE (email_sent = false OR telegram_sent = false)
```

---

## 📈 Views para Relatórios

### 1. Taxa de Sucesso (`notification_success_rate`)

```sql
SELECT * FROM notification_success_rate
WHERE date > NOW() - INTERVAL '30 days'
ORDER BY date DESC;
```

**Resultado:**
| notification_type | total | emails_sent | telegrams_sent | email_success_rate | telegram_success_rate | date |
|-------------------|-------|-------------|----------------|--------------------|-----------------------|------|
| payment_approved | 150 | 145 | 148 | 96.67% | 98.67% | 2024-12-05 |
| expiry_warning | 85 | 80 | 83 | 94.12% | 97.65% | 2024-12-05 |

### 2. Notificações Pendentes (`pending_notifications`)

```sql
SELECT * FROM pending_notifications LIMIT 10;
```

Mostra notificações que:
- Email OU telegram não foi enviado
- Menos de 3 tentativas (não desistiu ainda)

### 3. Notificações Falhadas (`failed_notifications`)

```sql
SELECT * FROM failed_notifications LIMIT 10;
```

Mostra notificações que falharam após 3 tentativas.

---

## 🔧 Funções Principais

### `getActiveChannels()`

**Objetivo:** Verificar quais canais estão ativos nas configurações

```typescript
const channels = await getActiveChannels();
// { email: true, telegram: false }
```

**Consulta:**
```sql
SELECT chave, valor FROM config
WHERE chave IN ('notif_enviar_email', 'notif_enviar_telegram')
```

### `checkNotificationSent()`

**Objetivo:** Verificar se notificação já foi enviada

```typescript
const status = await checkNotificationSent(
  'uuid-membro',
  'payment_approved'
);
// { alreadySent: false, emailSent: false, telegramSent: false }
```

**Consulta:**
```sql
SELECT * FROM check_notification_already_sent(
  'uuid-membro',
  'payment_approved',
  NULL -- dias antes (opcional)
)
```

### `createNotificationRecord()`

**Objetivo:** Criar registro de notificação

```typescript
const notificationId = await createNotificationRecord({
  memberId: 'uuid',
  notificationType: 'payment_approved',
  message: 'Seu pagamento foi aprovado!',
  inviteLink: 'https://t.me/...'
});
```

### `updateEmailStatus()` / `updateTelegramStatus()`

**Objetivo:** Atualizar status após tentativa de envio

```typescript
await updateEmailStatus(notificationId, true); // Sucesso
await updateTelegramStatus(notificationId, false, 'Bot bloqueado'); // Falha
```

---

## 🎛️ Configurações do Sistema

### Canais de Notificação

**Localização:** Configurações > Notificações

| Chave | Valor | Descrição |
|-------|-------|-----------|
| `notif_enviar_email` | true/false | Ativar envio de emails |
| `notif_enviar_telegram` | true/false | Ativar envio de mensagens Telegram |

### Avisos de Vencimento

| Chave | Valor | Descrição |
|-------|-------|-----------|
| `notif_vencimento_ativo` | true/false | Sistema de avisos ativo |
| `notif_vencimento_1_ativo` | true/false | Aviso 1 ativo |
| `notif_vencimento_1_dias` | 5 | Dias antes (Aviso 1) |
| `notif_vencimento_2_ativo` | true/false | Aviso 2 ativo |
| `notif_vencimento_2_dias` | 7 | Dias antes (Aviso 2) |
| `notif_vencimento_3_ativo` | true/false | Aviso 3 ativo |
| `notif_vencimento_3_dias` | 30 | Dias antes (Aviso 3) |

---

## 🧪 Exemplos Práticos

### Exemplo 1: Aprovação de Pagamento

**Cenário:** Admin aprova pagamento, sistema deve notificar membro

```typescript
// 1. Verificar canais ativos
// config: notif_enviar_email = true, notif_enviar_telegram = true

// 2. Verificar se já notificou
// Resultado: não notificou ainda

// 3. Criar registro
// INSERT INTO notification_history (...)

// 4. Enviar email (ativo + membro tem email)
// ✓ Sucesso → email_sent = true

// 5. Enviar telegram (ativo + membro tem telegram_user_id)
// ✓ Sucesso → telegram_sent = true
```

**Registro Final:**
```json
{
  "notification_type": "payment_approved",
  "email_sent": true,
  "email_sent_at": "2024-12-05 10:30:00",
  "telegram_sent": true,
  "telegram_sent_at": "2024-12-05 10:30:01"
}
```

### Exemplo 2: Email Desativado

**Cenário:** Telegram ativo, Email desativado

```typescript
// config: notif_enviar_email = false, notif_enviar_telegram = true

// 1. Verificar canais → { email: false, telegram: true }
// 2. Criar registro
// 3. Pular email (desativado)
// 4. Enviar telegram → ✓ Sucesso
```

**Registro Final:**
```json
{
  "notification_type": "payment_approved",
  "email_sent": false,  // Não tentou enviar (desativado)
  "email_sent_at": null,
  "telegram_sent": true,
  "telegram_sent_at": "2024-12-05 10:30:00"
}
```

### Exemplo 3: Membro Sem Email

**Cenário:** Membro não cadastrou email

```typescript
// membro: { email: null, telegram_user_id: '123456' }

// 1. Verificar canais → { email: true, telegram: true }
// 2. Criar registro
// 3. Pular email (membro não tem)
// 4. Enviar telegram → ✓ Sucesso
```

**Log:**
```
[Notification] Email desativado ou membro sem email
[Notification] Telegram para 123456: ✓ Sucesso
```

### Exemplo 4: Falha no Telegram

**Cenário:** Membro bloqueou o bot

```typescript
// 1. Tentar enviar telegram
// ✗ Erro: "Bot bloqueado pelo usuário"

// 2. Atualizar registro
// telegram_sent = false
// telegram_error = "Bot bloqueado pelo usuário"
// telegram_attempts = 1
```

**Sistema de Retry:**
- Tentativa 1: Falha → `attempts = 1`
- Tentativa 2: Falha → `attempts = 2`
- Tentativa 3: Falha → `attempts = 3` (Desiste)

---

## 📊 Queries Úteis

### Verificar Notificações Recentes

```sql
SELECT
  nh.created_at,
  nh.notification_type,
  m.nome,
  nh.email_sent,
  nh.telegram_sent
FROM notification_history nh
JOIN members m ON m.id = nh.member_id
WHERE nh.created_at > NOW() - INTERVAL '24 hours'
ORDER BY nh.created_at DESC;
```

### Ver Taxa de Sucesso Geral

```sql
SELECT
  COUNT(*) as total,
  ROUND(AVG(CASE WHEN email_sent THEN 1 ELSE 0 END) * 100, 2) as taxa_email,
  ROUND(AVG(CASE WHEN telegram_sent THEN 1 ELSE 0 END) * 100, 2) as taxa_telegram
FROM notification_history
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Identificar Problemas

```sql
-- Emails com mais de 2 tentativas falhadas
SELECT
  m.nome,
  m.email,
  nh.email_attempts,
  nh.email_error,
  nh.created_at
FROM notification_history nh
JOIN members m ON m.id = nh.member_id
WHERE nh.email_sent = false
  AND nh.email_attempts >= 2
ORDER BY nh.created_at DESC;
```

---

## ✅ Garantias do Sistema

### 1. Sem Duplicações

✓ Antes de enviar, verifica no histórico se já enviou
✓ Função `check_notification_already_sent()` garante unicidade
✓ Índice composto na tabela evita duplicatas

### 2. Respeita Configurações

✓ Consulta `config` antes de cada envio
✓ Só envia se canal estiver ativo
✓ Loga quando canal está desativado

### 3. Controle Individual por Canal

✓ Email e Telegram rastreados separadamente
✓ Se email falhar, telegram continua tentando
✓ Views específicas para cada canal

### 4. Sistema de Retry

✓ Máximo 3 tentativas por canal
✓ Registra erro de cada tentativa
✓ View `failed_notifications` para casos perdidos

### 5. Auditoria Completa

✓ Toda tentativa é logada
✓ Timestamps de cada envio
✓ Erros detalhados salvos
✓ Relatórios de performance disponíveis

---

## 🔄 Migração

Para ativar este sistema, execute no Supabase:

```bash
# 1. Criar tabela e funções
/scripts/create-notification-tracking.sql
```

**Compatibilidade:**
- Sistema antigo continua funcionando (tabela `logs`)
- Novo sistema adiciona camada de controle
- Sem breaking changes

---

## 📚 Próximos Passos

1. **Dashboard de Monitoramento** - Visualizar taxas de sucesso em tempo real
2. **Alertas de Falha** - Notificar admins quando taxa cai abaixo de 90%
3. **Retry Inteligente** - Backoff exponencial para tentativas
4. **Webhook de Falha** - Integração com sistemas externos

---

**Documentação criada em:** 05/12/2024
**Versão:** 1.0
