# Validação de CRON Jobs - TLGrupos v1.2.2

## 📋 Lista de CRON Jobs Disponíveis

### 1. **Send Notifications** (Enviar Notificações)
**Endpoint:** `/api/cron/send-notifications`
**Função:** Envia notificações de vencimento agendadas
**Frequência Recomendada:** A cada 1 hora ou 2 vezes por dia

**O que faz:**
- Verifica membros que vão vencer em X dias (configurável)
- Envia notificações por Email e/ou Telegram
- Registra logs de notificações enviadas

**Teste Manual:**
```bash
curl -X POST http://localhost:3000/api/cron/send-notifications \
  -H "Authorization: Bearer SEU_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 2. **Check Expirations** (Verificar Vencimentos)
**Endpoint:** `/api/cron/check-expirations`
**Função:** Verifica e marca membros vencidos
**Frequência Recomendada:** 1x por dia (meia-noite)

**O que faz:**
- Verifica membros com data_vencimento < hoje
- Atualiza status para refletir vencimento
- Prepara lista para remoção automática

**Teste Manual:**
```bash
curl -X POST http://localhost:3000/api/cron/check-expirations \
  -H "Authorization: Bearer SEU_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 3. **Remove Expired** (Remover Vencidos)
**Endpoint:** `/api/cron/remove-expired`
**Função:** Remove membros vencidos dos grupos Telegram
**Frequência Recomendada:** 1x por dia (depois do check-expirations)

**O que faz:**
- Identifica membros ativos mas vencidos
- Remove do grupo Telegram
- Atualiza status para "removido"
- Registra logs de remoção

**Teste Manual:**
```bash
curl -X POST http://localhost:3000/api/cron/remove-expired \
  -H "Authorization: Bearer SEU_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 4. **Process Approved Payments** (Processar Pagamentos Aprovados)
**Endpoint:** `/api/cron/process-approved-payments`
**Função:** Processa pagamentos aprovados automaticamente
**Frequência Recomendada:** A cada 15-30 minutos

**O que faz:**
- Busca pagamentos com status "aprovado"
- Estende data de vencimento do membro
- Gera link de convite do Telegram
- Envia notificações de acesso
- Marca pagamento como processado

**Teste Manual:**
```bash
curl -X POST http://localhost:3000/api/cron/process-approved-payments \
  -H "Authorization: Bearer SEU_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## ✅ Configuração Recomendada

### Opção 1: Cron-Job.org (Gratuito)
Configurar em: https://cron-job.org

```
1. Send Notifications:      */2 * * * *    (a cada 2 horas)
2. Check Expirations:        0 0 * * *      (meia-noite)
3. Remove Expired:           0 1 * * *      (1h da manhã)
4. Process Payments:         */15 * * * *   (a cada 15 min)
```

### Opção 2: EasyCron (Gratuito)
Configurar em: https://www.easycron.com

```
1. Send Notifications:      0 */2 * * *    (a cada 2 horas)
2. Check Expirations:        0 0 * * *      (meia-noite)
3. Remove Expired:           0 1 * * *      (1h da manhã)
4. Process Payments:         */15 * * * *   (a cada 15 min)
```

---

## 🔐 Configuração de Segurança

### 1. Definir CRON_SECRET no .env.local

```bash
CRON_SECRET=sua_chave_secreta_aqui_muito_forte_123
```

### 2. Usar o Secret nas Requisições

Todos os endpoints CRON exigem autenticação:

```bash
Authorization: Bearer sua_chave_secreta_aqui_muito_forte_123
```

---

## 🧪 Script de Teste Completo

Crie o arquivo `scripts/test-all-crons.sh`:

```bash
#!/bin/bash

CRON_SECRET="sua_chave_secreta"
BASE_URL="http://localhost:3000"

echo "🧪 Testando todos os CRON jobs..."
echo ""

echo "1️⃣ Testando Send Notifications..."
curl -X POST $BASE_URL/api/cron/send-notifications \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -s | jq .
echo ""

echo "2️⃣ Testando Check Expirations..."
curl -X POST $BASE_URL/api/cron/check-expirations \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -s | jq .
echo ""

echo "3️⃣ Testando Remove Expired..."
curl -X POST $BASE_URL/api/cron/remove-expired \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -s | jq .
echo ""

echo "4️⃣ Testando Process Payments..."
curl -X POST $BASE_URL/api/cron/process-approved-payments \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -s | jq .
echo ""

echo "✅ Testes completos!"
```

---

## 📊 Monitoramento

### Verificar Logs de Notificações

```sql
-- Ver últimas notificações enviadas
SELECT
  created_at,
  acao,
  detalhes->'notification_type' as tipo,
  detalhes->'channels' as canais,
  detalhes->'success' as sucesso
FROM logs
WHERE acao = 'notificacao'
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar Remoções Automáticas

```sql
-- Ver remoções nos últimos 7 dias
SELECT
  created_at,
  detalhes->>'nome' as membro,
  detalhes->>'motivo' as motivo
FROM logs
WHERE acao = 'remocao'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## ⚙️ Configurações Necessárias

Antes de ativar os CRONs, verifique se estas configs estão corretas:

### 1. Notificações
- `notif_vencimento_ativo`: true
- `notif_enviar_email`: true
- `notif_enviar_telegram`: true

### 2. Email
- `email_provider`: gmail
- `gmail_user`: seu@email.com
- `gmail_app_password`: senha_app

### 3. Bot Telegram
- `TELEGRAM_BOT_TOKEN`: configurado no .env.local
- Bot adicionado aos grupos

### 4. Remoção Automática
- `bot_remocao_automatica`: true
- `bot_horario_remocao`: "02:00" (opcional)

---

## 🎯 Ordem de Execução Diária

```
00:00 - Check Expirations    (verifica vencimentos)
01:00 - Remove Expired        (remove vencidos)
02:00 - Send Notifications    (envia avisos)
08:00 - Send Notifications    (envia avisos)
14:00 - Send Notifications    (envia avisos)
20:00 - Send Notifications    (envia avisos)

A cada 15min - Process Payments (processa pagamentos)
```

---

## 🐛 Troubleshooting

### Erro 401: Não autorizado
- Verificar se CRON_SECRET está correto
- Verificar se header Authorization está presente

### Erro 500: Erro interno
- Verificar logs do servidor
- Verificar conexão com Supabase
- Verificar configuração do Bot Telegram

### Notificações não enviadas
- Verificar configs de email (gmail_user, gmail_app_password)
- Verificar se notif_enviar_email está true
- Verificar se notif_enviar_telegram está true

---

## 📝 Checklist de Ativação

- [ ] CRON_SECRET configurado no .env.local
- [ ] Email configurado (Gmail App Password)
- [ ] Bot Telegram funcionando
- [ ] Endpoints CRON testados manualmente
- [ ] CRONs configurados no cron-job.org ou EasyCron
- [ ] Monitoramento ativado (verificar logs)

---

**Última atualização:** 05/12/2025
**Versão do Sistema:** v1.2.2
