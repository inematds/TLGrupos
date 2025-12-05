# CRON Job: Send Pending Notifications

**Versão:** v1.2.2
**Data de Criação:** 05/12/2025
**Status:** ✅ Ativo em Produção

---

## 📋 Descrição

Este CRON job foi criado para resolver um problema específico: **pagamentos aprovados que já têm link de convite gerado, mas cujas notificações (email/telegram) não foram enviadas.**

### Problema que Resolve

O CRON `process-approved-payments` processa pagamentos aprovados **sem link**, gerando o link e enviando notificações. Porém, em alguns casos, pagamentos podem ter links gerados mas as notificações falharem ou não serem enviadas. Este novo CRON captura esses casos pendentes.

---

## 🎯 Objetivo

Garantir que **todos** os pagamentos aprovados com link de convite recebam suas notificações, complementando o trabalho do `process-approved-payments`.

---

## 🔧 Endpoint

**URL:** `/api/cron/send-pending-notifications`
**Método:** `POST`
**Autenticação:** Bearer Token (CRON_SECRET)

---

## 📊 Como Funciona

### 1. Critérios de Busca

Busca pagamentos que atendam **TODOS** os critérios:
- ✅ `status = 'aprovado'`
- ✅ `invite_link IS NOT NULL` (tem link gerado)
- ✅ `email_sent IS NULL OR email_sent = false OR notification_sent IS NULL OR notification_sent = false` (sem notificação)

### 2. Processamento

Para cada pagamento encontrado:
1. Valida se membro existe
2. Valida se tem link de convite
3. Chama `sendPaymentApprovedNotification()` com:
   - ID do membro
   - Link de convite
   - Dias do plano
   - ID do pagamento
4. Registra log da ação no banco

### 3. Resultado

Retorna estatísticas:
```json
{
  "success": true,
  "message": "Enviados: X/Y, Erros: Z",
  "results": {
    "total": Y,
    "enviados": X,
    "erros": Z,
    "detalhes": [...]
  }
}
```

---

## ⏱️ Configuração no Crontab

### Produção (VPS)
```bash
# Enviar Notificações Pendentes - A cada 15 minutos
*/15 * * * * curl -s -X POST http://localhost:3000/api/cron/send-pending-notifications \
  -H "Authorization: Bearer Jk1A46JDI50PAMDwUkXyzmLcY/LJQXzw7FPnp3qOi+o=" \
  >> /var/log/tlgrupos/enviar-notificacoes-pendentes.log 2>&1
```

### Local (Teste)
```bash
curl -X POST http://localhost:3000/api/cron/send-pending-notifications \
  -H "Authorization: Bearer SEU_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## 📈 Logs Registrados

Cada execução gera logs na tabela `logs`:

### Log de Sucesso
```json
{
  "member_id": "xxx",
  "acao": "notificacao_retroativa",
  "detalhes": {
    "payment_id": "yyy",
    "email_enviado": true,
    "telegram_enviado": true,
    "notification_id": "zzz",
    "processado_por_cron": true
  },
  "executado_por": "Sistema (Cron Send Notifications)"
}
```

### Log de Erro
```json
{
  "member_id": "xxx",
  "acao": "erro_notificacao_retroativa",
  "detalhes": {
    "payment_id": "yyy",
    "erro": "Mensagem de erro",
    "processado_por_cron": true
  },
  "executado_por": "Sistema (Cron Send Notifications)"
}
```

---

## 🧪 Teste Manual

### 1. Verificar Pagamentos Pendentes

```sql
SELECT
  p.id,
  p.status,
  p.invite_link,
  p.email_sent,
  p.notification_sent,
  m.nome,
  m.email
FROM payments p
JOIN members m ON p.member_id = m.id
WHERE p.status = 'aprovado'
  AND p.invite_link IS NOT NULL
  AND (
    p.email_sent IS NULL
    OR p.email_sent = false
    OR p.notification_sent IS NULL
    OR p.notification_sent = false
  )
ORDER BY p.created_at DESC;
```

### 2. Executar CRON Manualmente

```bash
curl -X POST http://localhost:3000/api/cron/send-pending-notifications \
  -H "Authorization: Bearer Jk1A46JDI50PAMDwUkXyzmLcY/LJQXzw7FPnp3qOi+o=" \
  -H "Content-Type: application/json" | jq .
```

### 3. Verificar Logs

```sql
SELECT
  created_at,
  acao,
  detalhes->'payment_id' as payment_id,
  detalhes->'email_enviado' as email,
  detalhes->'telegram_enviado' as telegram
FROM logs
WHERE acao IN ('notificacao_retroativa', 'erro_notificacao_retroativa')
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔍 Monitoramento

### Verificar Logs do CRON (VPS)

```bash
# Ver últimas 50 linhas
tail -50 /var/log/tlgrupos/enviar-notificacoes-pendentes.log

# Acompanhar em tempo real
tail -f /var/log/tlgrupos/enviar-notificacoes-pendentes.log

# Verificar erros
grep -i "erro" /var/log/tlgrupos/enviar-notificacoes-pendentes.log
```

### Dashboard

No dashboard, o card **"Entregues"** mostra quantos pagamentos têm:
- Status aprovado
- Link de convite gerado
- Notificação enviada

Se o número de "Aprovados" for maior que "Entregues", há pendências que este CRON irá processar.

---

## 📊 Resultado do Primeiro Teste

**Data:** 05/12/2025
**Local:** Produção (VPS)

```json
{
  "success": true,
  "message": "Enviados: 7/7, Erros: 0",
  "results": {
    "total": 7,
    "enviados": 7,
    "erros": 0
  }
}
```

✅ **7 pagamentos** que estavam com link mas sem notificação foram processados com sucesso.

---

## 🔗 Integração com Outros CRONs

Este CRON complementa os demais:

| CRON | Frequência | Função |
|------|-----------|--------|
| **process-approved-payments** | 15 min | Processa pagamentos **sem link** |
| **send-pending-notifications** | 15 min | Envia notificações para pagamentos **com link** |
| send-notifications | Diário 08:00 | Avisos de vencimento |
| check-expirations | Diário 00:00 | Verifica vencimentos |
| remove-expired | Diário 03:00 | Remove vencidos |

**Fluxo Ideal:**
1. Pagamento aprovado → `process-approved-payments` gera link + envia notificação
2. Se notificação falhar → `send-pending-notifications` reenvia
3. Sistema garante que **nenhum pagamento aprovado fica sem notificação**

---

## ⚠️ Considerações Importantes

### Limite de Processamento
- Processa até **50 pagamentos** por execução
- Se houver mais de 50, próxima execução pegará os restantes

### Idempotência
- Pode executar múltiplas vezes sem problema
- Só envia notificação se realmente pendente
- Não duplica notificações para pagamentos já notificados

### Autenticação em Produção
- **Obrigatório** CRON_SECRET correto
- Em desenvolvimento, autenticação é opcional

---

## 📚 Arquivos Relacionados

- **Endpoint:** `/src/app/api/cron/send-pending-notifications/route.ts`
- **Serviço:** `/src/services/notification-service.ts`
- **Dashboard:** `/src/app/dashboard/page.tsx` (card "Entregues")
- **Documentação:** `/docs/RELATORIO_VALIDACAO_CRONS.md`

---

## ✅ Checklist de Ativação

- [x] Endpoint criado e testado localmente
- [x] CRON_SECRET configurado no `.env.local`
- [x] Código commitado e pushed para git
- [x] Deploy realizado na VPS
- [x] CRON adicionado ao crontab
- [x] Teste em produção executado com sucesso
- [x] Logs funcionando corretamente
- [x] Documentação criada

---

**Status Final:** ✅ **ATIVO E FUNCIONANDO EM PRODUÇÃO**

**Última Validação:** 05/12/2025
**Próxima Revisão:** Verificar logs após 7 dias de operação
