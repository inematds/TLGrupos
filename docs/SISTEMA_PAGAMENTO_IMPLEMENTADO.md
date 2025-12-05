# Sistema de Pagamento → Link de Acesso - IMPLEMENTADO

**Data:** 2025-12-04
**Status:** ✅ Implementado e testado

## 📋 Visão Geral

Sistema completo que gera links de acesso únicos automaticamente após aprovação de pagamentos. O usuário recebe o link por email, clica, entra no grupo e o sistema atualiza todas as tabelas automaticamente.

---

## 🗂️ Estrutura Implementada

### 1. Tabela: `payment_access_codes`

Armazena todos os links gerados após aprovação de pagamentos.

**Colunas principais:**
- `invite_link` - Link único do Telegram (identificador principal)
- `member_id` - Relacionamento com membro
- `payment_id` - Relacionamento com pagamento
- `group_id` - Relacionamento com grupo
- `data_vencimento_acesso` - CÓPIA de `payments.data_vencimento`
- `dias_acesso` - CÓPIA de `payments.dias_acesso`
- `usado` - Se o link já foi utilizado
- `data_acesso` - Quando o usuário entrou (APENAS registro)
- `telegram_user_id_acesso` - ID do Telegram de quem usou

**Migration:** `021_create_payment_access_codes.sql`

---

### 2. API Endpoint: `/api/processar-aprovacao`

Gera link de acesso após aprovação de pagamento.

**Entrada:**
```json
{
  "payment_id": "uuid-do-pagamento",
  "group_id": "uuid-do-grupo"
}
```

**Saída:**
```json
{
  "success": true,
  "invite_link": "https://t.me/+AbCdEfG123",
  "code_id": "uuid-do-codigo",
  "data_vencimento": "2025-01-03T12:00:00Z",
  "dias_acesso": 30,
  "message": "Link gerado com sucesso"
}
```

**Arquivo:** `src/app/api/processar-aprovacao/route.ts`

---

### 3. Bot Webhook Atualizado

Detecta quando usuário entra usando link de pagamento e atualiza banco automaticamente.

**Fluxo:**
1. Usuário entra no grupo com link
2. Bot detecta o evento `new_chat_members`
3. Busca o link na tabela `payment_access_codes`
4. Tenta atualizar banco 3 vezes
5. Se falhar → avisa admin no Telegram
6. Se sucesso → envia mensagem de boas-vindas

**Arquivo:** `src/lib/telegram-webhook.ts`

---

## 🔄 Fluxo Completo

```
1. Admin aprova pagamento no dashboard
         ↓
2. Frontend chama POST /api/processar-aprovacao
         { payment_id, group_id }
         ↓
3. API busca dados do payment (COM member)
         ↓
4. API gera link no Telegram
         bot.telegram.createChatInviteLink(chatId, {
           member_limit: 1  // Expira após 1 uso
           // SEM expire_date = nunca expira por tempo
         })
         ↓
5. API salva na tabela payment_access_codes
         - COPIA data_vencimento de payments
         - COPIA dias_acesso de payments
         - Não calcula nada
         ↓
6. API retorna link para frontend
         ↓
7. Frontend envia link por email (sistema externo)
         ↓
8. Usuário clica no link → entra no grupo
         ↓
9. Bot detecta entrada (new_chat_members)
         ↓
10. Bot tenta atualizar banco 3 vezes:
         - payment_access_codes (usado=true, data_acesso)
         - payments (link_acessado=true, data_acesso)
         - members (telegram_user_id, no_grupo=true, acessos)
         ↓
11. Se SUCESSO:
         - Envia mensagem de boas-vindas
         - Log registrado

    Se FALHA:
         - Avisa admin no Telegram
         - Usuário continua no grupo
         - Admin corrige manualmente
```

---

## ⚙️ Configuração Necessária

### 1. Variáveis de Ambiente (.env.local)

```bash
# Telegram
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_GROUP_ID=-1002414487357
TELEGRAM_ADMIN_CHAT_ID=123456789  # ID do admin para receber alertas

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### 2. Permissões do Bot no Telegram

O bot precisa ser **ADMINISTRADOR** do grupo com as seguintes permissões:
- ✅ Convidar usuários via link
- ✅ Gerenciar links de convite
- ✅ Ver mensagens
- ✅ Enviar mensagens

---

## 🚀 Como Usar

### Para Admins:

1. **Aprovar pagamento:**
   - Acesse o dashboard
   - Vá em "Pagamentos Pendentes"
   - Aprove o pagamento

2. **Sistema gera link automaticamente:**
   - Chama `/api/processar-aprovacao`
   - Retorna link único

3. **Enviar link para usuário:**
   - Copie o link gerado
   - Envie por email/WhatsApp/SMS

### Para Usuários:

1. **Recebe link por email/WhatsApp**
2. **Clica no link**
3. **Entra no grupo automaticamente**
4. **Recebe mensagem de boas-vindas com data de vencimento**

---

## 🔍 Monitoramento

### Logs no Console

```bash
# Quando usuário entra
[Webhook] Novo membro entrou: João (123456789)
[Webhook] Link usado: https://t.me/+AbCdEfG123
[Webhook] Link de PAGAMENTO detectado! Payment ID: uuid-xxx
[Webhook] ✅ Banco atualizado com sucesso na tentativa 1
```

### Logs no Banco (tabela `logs`)

```sql
SELECT * FROM logs
WHERE acao = 'entrada_via_pagamento'
ORDER BY created_at DESC;
```

### Alertas para Admin

Se o bot falhar ao atualizar o banco após 3 tentativas, o admin recebe:

```
⚠️ ERRO ao registrar entrada no banco

👤 Usuário: João Silva
🆔 ID Telegram: 123456789
📱 Username: @joaosilva
🔗 Link usado: https://t.me/+AbCdEfG123
❌ Erro: Connection timeout

✅ O usuário JÁ ESTÁ NO GRUPO
⚠️ Mas NÃO foi registrado no banco de dados

🔧 Tentativas: 3x
💰 Payment ID: uuid-xxx
```

---

## 📊 Tabelas Atualizadas

### `payment_access_codes`
- ✅ `usado = true`
- ✅ `data_acesso = NOW()`
- ✅ `telegram_user_id_acesso = 123456789`
- ✅ `status = 'usado'`

### `payments`
- ✅ `link_acessado = true`
- ✅ `data_acesso = NOW()`
- ✅ `entrada_confirmada = true`
- ❌ **NÃO atualiza** `data_vencimento` (já calculado)

### `members`
- ✅ `telegram_user_id = 123456789`
- ✅ `no_grupo = true`
- ✅ `data_primeiro_acesso = NOW()` (se primeira vez)
- ✅ `data_ultimo_acesso = NOW()`
- ✅ `total_acessos += 1`
- ✅ `ultimo_pagamento_valor = 50.00`
- ✅ `ultimo_pagamento_data = NOW()`
- ✅ `ultimo_pagamento_forma = 'PIX'`
- ❌ **NÃO atualiza** `data_vencimento` (vem do payment)

---

## 🛠️ Troubleshooting

### Link não funciona
- ✅ Verificar se bot é admin do grupo
- ✅ Verificar se link não foi revogado
- ✅ Verificar se link já foi usado (member_limit: 1)

### Bot não atualiza banco
- ✅ Verificar conexão com Supabase
- ✅ Verificar logs do console
- ✅ Verificar se admin recebeu alerta no Telegram
- ✅ Verificar tabela `logs` para ver o erro

### Usuário entrou mas banco não foi atualizado
- ✅ Admin recebeu alerta
- ✅ Corrigir manualmente via dashboard
- ✅ Verificar `payment_access_codes` com `usado = false`

---

## 🔐 Segurança

### Link de Convite
- ✅ Único (member_limit: 1)
- ✅ Não expira por tempo (só por uso ou revogação)
- ✅ Rastreável (salvo em payment_access_codes)

### Dados
- ✅ RLS (Row Level Security) habilitado
- ✅ Service role key para operações do sistema
- ✅ Logs completos de todas ações

### Retry Mechanism
- ✅ 3 tentativas automáticas
- ✅ Delay exponencial (100ms, 200ms, 400ms)
- ✅ Alerta para admin se falhar

---

## 📝 Próximos Passos (Opcional)

1. **Dashboard de Aprovação:**
   - Botão "Aprovar e Gerar Link"
   - Mostrar link gerado
   - Botão "Copiar Link"

2. **Envio Automático de Email:**
   - Integrar com serviço de email
   - Template personalizado
   - Envio automático após aprovação

3. **Relatórios:**
   - Links gerados vs usados
   - Tempo médio entre geração e uso
   - Taxa de conversão

4. **Revogação Manual:**
   - Interface para revogar links
   - Gerar novo link para mesmo pagamento

---

## ✅ Checklist de Implementação

- [x] Migration `021_create_payment_access_codes.sql`
- [x] API `/api/processar-aprovacao`
- [x] Bot webhook atualizado
- [x] Retry mechanism (3 tentativas)
- [x] Alertas para admin
- [x] Logs completos
- [x] TypeScript sem erros
- [x] Documentação completa

---

## 📞 Contato

Para dúvidas ou suporte, verificar:
1. Logs do console (`npm run dev`)
2. Logs do banco (tabela `logs`)
3. Alertas no Telegram do admin
