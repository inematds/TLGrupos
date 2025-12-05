# 🎯 Proposta: Sistema Completo de Pagamento → Link → Email → Entrada

**Data:** 2025-12-03
**Versão:** 1.0 - Proposta Inicial

---

## 📋 VISÃO GERAL

Sistema integrado que automatiza completamente o fluxo desde o pagamento até a entrada no grupo Telegram, com atualização automática de todas as tabelas envolvidas.

---

## 🔄 FLUXO COMPLETO

```
┌─────────────────────────────────────────────────────┐
│ 1. CLIENTE FAZ PAGAMENTO                            │
│    - PIX, Boleto, Cartão, etc                       │
│    - Envia comprovante (opcional)                   │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. REGISTRO NO BANCO                                │
│    INSERT INTO payments (                           │
│      member_id: UUID do cadastro,                   │
│      valor: 99.90,                                  │
│      status: 'pendente',                            │
│      plan_id: UUID do plano,                        │
│      comprovante_url: 'url-do-arquivo'              │
│    )                                                │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. ADMIN APROVA PAGAMENTO                           │
│    - Via Dashboard: /dashboard/validar-pagamentos   │
│    - Clica "Aprovar"                                │
│                                                     │
│    UPDATE payments                                  │
│    SET status = 'aprovado',                         │
│        data_aprovacao = NOW(),                      │
│        aprovado_por = 'admin@email.com'             │
│    WHERE id = payment_id                            │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. TRIGGER/WEBHOOK DETECTA APROVAÇÃO ⚡              │
│    (Automático via Supabase Database Webhook)       │
│                                                     │
│    ON UPDATE payments                               │
│    WHEN NEW.status = 'aprovado'                     │
│    AND OLD.status != 'aprovado'                     │
│    THEN call_webhook()                              │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. SISTEMA PROCESSA APROVAÇÃO                       │
│    POST /api/processar-aprovacao                    │
│                                                     │
│    a) Busca dados do payment + member + plan        │
│    b) Calcula data_vencimento                       │
│    c) Gera invite_link único via Telegram API       │
│    d) Atualiza tabelas                              │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 6. ATUALIZA PAYMENT                                 │
│    UPDATE payments                                  │
│    SET invite_link = 'https://t.me/+ABC123',        │
│        invite_link_enviado = TRUE,                  │
│        data_expiracao = data_vencimento             │
│    WHERE id = payment_id                            │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 7. ATUALIZA/CRIA MEMBER                             │
│    UPDATE members                                   │
│    SET data_vencimento = NOW() + plan.duracao_dias, │
│        status = 'ativo',                            │
│        invite_link = 'https://t.me/+ABC123',        │
│        plan_id = payment.plan_id,                   │
│        payment_id = payment.id                      │
│    WHERE id = payment.member_id                     │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 8. ENVIA EMAIL COM LINK ✉️                          │
│    (Sistema externo de email)                       │
│                                                     │
│    Para: member.email                               │
│    Assunto: "Seu acesso foi aprovado!"             │
│    Corpo:                                           │
│      "Olá {nome}!                                   │
│       Seu pagamento foi aprovado.                   │
│       Clique no link para entrar:                   │
│       {invite_link}                                 │
│                                                     │
│       Válido até: {data_vencimento}"                │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 9. CLIENTE CLICA NO LINK                            │
│    - Abre Telegram                                  │
│    - Vê preview do grupo                            │
│    - Clica "Entrar no grupo"                        │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 10. TELEGRAM ADICIONA NO GRUPO                      │
│     - Cliente entra automaticamente                 │
│     - Link expira (member_limit: 1)                 │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 11. BOT DETECTA ENTRADA ⚡                          │
│     bot.on('new_chat_members', async (ctx) => {     │
│       const member = ctx.message.new_chat_members[0]│
│       const linkUsado = ctx.message.invite_link     │
│                                                     │
│       // Busca quem tinha este link                 │
│     })                                              │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 12. BOT ATUALIZA MEMBER                             │
│     UPDATE members                                  │
│     SET telegram_user_id = member.id,               │
│         telegram_username = member.username,        │
│         telegram_first_name = member.first_name,    │
│         telegram_last_name = member.last_name,      │
│         no_grupo = TRUE,                            │
│         data_entrada_grupo = NOW(),                 │
│         invite_link_usado_em = NOW()                │
│     WHERE invite_link = linkUsado                   │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 13. BOT ATUALIZA PAYMENT                            │
│     UPDATE payments                                 │
│     SET telegram_user_id = member.id,               │
│         invite_link_usado = TRUE,                   │
│         invite_link_usado_em = NOW(),               │
│         entrada_confirmada = TRUE                   │
│     WHERE id = payment_id                           │
│     (encontra via member_id)                        │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 14. REGISTRA LOG                                    │
│     INSERT INTO logs (                              │
│       member_id: member.id,                         │
│       acao: 'entrada_apos_pagamento',               │
│       detalhes: {                                   │
│         payment_id,                                 │
│         valor_pago,                                 │
│         plano,                                      │
│         link_usado                                  │
│       }                                             │
│     )                                               │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 15. CLIENTE NO GRUPO ✅                             │
│     - Acesso liberado                               │
│     - Válido por X dias (do plano)                  │
│     - Sistema totalmente sincronizado               │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### **1. Tabela `payments` (Já existe - Migration 020)**

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,

  -- Relacionamentos
  member_id UUID REFERENCES members(id),
  plan_id UUID REFERENCES plans(id),
  payment_method_id UUID REFERENCES formas_pagamento(id),

  -- Dados do pagamento
  valor DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente', -- pendente, aprovado, rejeitado

  -- Comprovante
  comprovante_url TEXT,
  comprovante_hash TEXT,

  -- Datas
  data_pagamento TIMESTAMP,
  data_aprovacao TIMESTAMP,
  data_vencimento TIMESTAMP,
  data_expiracao TIMESTAMP,

  -- Controle de acesso
  dias_acesso INTEGER DEFAULT 30,

  -- NOVOS CAMPOS (adicionar):
  invite_link TEXT,                    -- Link gerado após aprovação
  invite_link_enviado BOOLEAN DEFAULT FALSE,
  invite_link_usado BOOLEAN DEFAULT FALSE,
  invite_link_usado_em TIMESTAMP,
  telegram_user_id BIGINT,             -- Vincula quando entra
  entrada_confirmada BOOLEAN DEFAULT FALSE,

  -- Auditoria
  aprovado_por TEXT,
  rejeitado_por TEXT,
  motivo_rejeicao TEXT,

  -- Metadados
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### **2. Tabela `members` (Atualizar)**

```sql
ALTER TABLE members ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_entrada_grupo TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS invite_link_usado_em TIMESTAMP;
```

---

## 📡 API ENDPOINTS NECESSÁRIOS

### **1. POST /api/payments/approve**

```typescript
// Aprovar pagamento manualmente
POST /api/payments/approve
Body: {
  payment_id: "uuid",
  aprovado_por: "admin@email.com"
}

Fluxo:
1. Valida payment_id
2. UPDATE payments SET status = 'aprovado'
3. Trigger automático chama /api/processar-aprovacao
4. Retorna success
```

---

### **2. POST /api/processar-aprovacao** (NOVO - Principal)

```typescript
// Processa pagamento aprovado
POST /api/processar-aprovacao
Body: {
  payment_id: "uuid"
}

Fluxo:
1. Busca payment + member + plan
2. Calcula data_vencimento = NOW() + plan.duracao_dias
3. Gera invite_link via Telegram API:
   - member_limit: 1
   - expire_date: data_vencimento
4. Atualiza payment:
   - invite_link
   - invite_link_enviado = TRUE
   - data_expiracao = data_vencimento
5. Atualiza member:
   - data_vencimento
   - invite_link
   - status = 'ativo'
   - plan_id
   - payment_id
6. Envia email com link (integração externa)
7. Registra log
8. Retorna { success: true, invite_link }
```

---

### **3. POST /api/webhook/payment-approved** (NOVO)

```typescript
// Webhook do Supabase quando payment é aprovado
POST /api/webhook/payment-approved
Body: {
  type: "UPDATE",
  table: "payments",
  record: { ...payment_aprovado },
  old_record: { ...payment_pendente }
}

Fluxo:
1. Verifica se status mudou para 'aprovado'
2. Chama /api/processar-aprovacao
```

---

### **4. Atualizar Bot Webhook**

```typescript
// src/lib/telegram-webhook.ts

bot.on('new_chat_members', async (ctx) => {
  const member = ctx.message.new_chat_members[0];
  const linkUsado = ctx.message.invite_link?.invite_link;

  if (!linkUsado) return;

  // 1. Busca member pelo link
  const { data: memberData } = await supabase
    .from('members')
    .select('*, payments(*)')
    .eq('invite_link', linkUsado)
    .single();

  if (!memberData) return;

  // 2. Atualiza member
  await supabase
    .from('members')
    .update({
      telegram_user_id: member.id,
      telegram_username: member.username,
      telegram_first_name: member.first_name,
      telegram_last_name: member.last_name,
      no_grupo: true,
      data_entrada_grupo: new Date().toISOString(),
      invite_link_usado_em: new Date().toISOString()
    })
    .eq('id', memberData.id);

  // 3. Atualiza payment (se tiver)
  if (memberData.payment_id) {
    await supabase
      .from('payments')
      .update({
        telegram_user_id: member.id,
        invite_link_usado: true,
        invite_link_usado_em: new Date().toISOString(),
        entrada_confirmada: true
      })
      .eq('id', memberData.payment_id);
  }

  // 4. Registra log
  await supabase.from('logs').insert({
    member_id: memberData.id,
    acao: 'entrada_apos_pagamento',
    detalhes: {
      payment_id: memberData.payment_id,
      telegram_user_id: member.id,
      link_usado: linkUsado
    },
    executado_por: 'bot'
  });

  // 5. Envia mensagem de boas-vindas
  await ctx.reply(
    `🎉 Bem-vindo(a) ${member.first_name}!\n\n` +
    `Seu pagamento foi confirmado e seu acesso está ativo.\n` +
    `Vencimento: ${new Date(memberData.data_vencimento).toLocaleDateString('pt-BR')}\n\n` +
    `Use /status para verificar a qualquer momento.`
  );
});
```

---

## 🔧 MIGRATION NECESSÁRIA

### **Nova Migration: 021_add_payment_tracking.sql**

```sql
-- Adicionar campos de rastreamento de link/entrada nos payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invite_link TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invite_link_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invite_link_usado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invite_link_usado_em TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS entrada_confirmada BOOLEAN DEFAULT FALSE;

-- Adicionar campos nos members
ALTER TABLE members ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_entrada_grupo TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS invite_link_usado_em TIMESTAMP;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payments_invite_link ON payments(invite_link);
CREATE INDEX IF NOT EXISTS idx_payments_telegram_user_id ON payments(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_entrada_confirmada ON payments(entrada_confirmada);
CREATE INDEX IF NOT EXISTS idx_members_payment_id ON members(payment_id);

-- Comentários
COMMENT ON COLUMN payments.invite_link IS 'Link de convite gerado após aprovação';
COMMENT ON COLUMN payments.invite_link_enviado IS 'Se o link foi enviado por email';
COMMENT ON COLUMN payments.invite_link_usado IS 'Se o cliente usou o link e entrou';
COMMENT ON COLUMN payments.entrada_confirmada IS 'Se a entrada foi confirmada pelo bot';
COMMENT ON COLUMN members.payment_id IS 'Pagamento que originou este acesso';
COMMENT ON COLUMN members.data_entrada_grupo IS 'Quando entrou efetivamente no grupo';
```

---

## 📧 INTEGRAÇÃO COM SISTEMA DE EMAIL

### **Opção A: API Externa (Recomendado)**

```typescript
// src/services/email-service.ts

export async function enviarEmailAcesso(
  email: string,
  nome: string,
  inviteLink: string,
  dataVencimento: Date,
  plano: string,
  valor: number
) {
  // Integração com serviço externo (SendGrid, AWS SES, etc)
  const response = await fetch('https://api-email.com/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: email,
      subject: '🎉 Seu acesso foi aprovado!',
      html: gerarTemplateEmail(nome, inviteLink, dataVencimento, plano, valor)
    })
  });

  return response.ok;
}

function gerarTemplateEmail(
  nome: string,
  inviteLink: string,
  dataVencimento: Date,
  plano: string,
  valor: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f5f5f5; }
        .button {
          display: inline-block;
          padding: 15px 30px;
          background: #2196F3;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .info { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Pagamento Aprovado!</h1>
        </div>

        <div class="content">
          <p>Olá <strong>${nome}</strong>,</p>

          <p>Seu pagamento foi aprovado com sucesso! 🎊</p>

          <div class="info">
            <p><strong>📦 Plano:</strong> ${plano}</p>
            <p><strong>💰 Valor:</strong> R$ ${valor.toFixed(2)}</p>
            <p><strong>📅 Válido até:</strong> ${dataVencimento.toLocaleDateString('pt-BR')}</p>
          </div>

          <p><strong>Clique no botão abaixo para entrar no grupo:</strong></p>

          <center>
            <a href="${inviteLink}" class="button">
              📱 ENTRAR NO GRUPO TELEGRAM
            </a>
          </center>

          <p style="color: #666; font-size: 14px;">
            ⚠️ <strong>Importante:</strong><br>
            • Este link só pode ser usado UMA VEZ<br>
            • Certifique-se de entrar com a conta certa do Telegram<br>
            • Seu acesso é válido até ${dataVencimento.toLocaleDateString('pt-BR')}
          </p>

          <p>Qualquer dúvida, entre em contato conosco!</p>

          <p>Atenciosamente,<br>
          <strong>Equipe TLGrupos</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

---

### **Opção B: Supabase Edge Function**

```typescript
// supabase/functions/send-access-email/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { email, nome, inviteLink, dataVencimento, plano, valor } = await req.json()

  // Usar serviço de email aqui

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

## 🎯 ARQUIVOS A CRIAR/MODIFICAR

### **Criar:**

```
✅ supabase/migrations/021_add_payment_tracking.sql
✅ src/app/api/processar-aprovacao/route.ts
✅ src/app/api/webhook/payment-approved/route.ts
✅ src/services/email-service.ts
✅ src/services/payment-processing-service.ts
```

### **Modificar:**

```
✅ src/lib/telegram-webhook.ts (detectar entrada e atualizar)
✅ src/app/api/payments/approve/route.ts (adicionar trigger)
✅ src/app/dashboard/validar-pagamentos/page.tsx (botão aprovar)
```

---

## 📊 DASHBOARD: Tela de Validação

### **Melhorias em `/dashboard/validar-pagamentos`**

```tsx
// Adicionar coluna "Status do Link"
<td>
  {payment.invite_link_enviado && !payment.invite_link_usado && (
    <span className="text-yellow-600">📧 Link enviado</span>
  )}
  {payment.invite_link_usado && !payment.entrada_confirmada && (
    <span className="text-blue-600">🔗 Link usado</span>
  )}
  {payment.entrada_confirmada && (
    <span className="text-green-600">✅ No grupo</span>
  )}
  {!payment.invite_link_enviado && payment.status === 'aprovado' && (
    <span className="text-gray-600">⏳ Processando...</span>
  )}
</td>

// Botão de reenviar email
{payment.status === 'aprovado' && payment.invite_link && (
  <button
    onClick={() => reenviarEmail(payment.id)}
    className="text-blue-600 hover:underline"
  >
    📧 Reenviar Email
  </button>
)}
```

---

## 🔔 NOTIFICAÇÕES ADMIN

### **Criar sistema de alertas**

```typescript
// Quando pagamento for aprovado mas entrada não for confirmada em 24h
export async function verificarAcessosPendentes() {
  const { data: pendentes } = await supabase
    .from('payments')
    .select('*, members(*)')
    .eq('status', 'aprovado')
    .eq('entrada_confirmada', false)
    .lt('data_aprovacao', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  // Enviar notificação para admin
  if (pendentes && pendentes.length > 0) {
    await enviarAlertaAdmin(`
      ⚠️ ${pendentes.length} pagamentos aprovados mas cliente ainda não entrou no grupo.
      Verifique se os emails foram enviados.
    `);
  }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Banco de Dados**
- [ ] Executar migration 021
- [ ] Verificar se todas as colunas foram criadas
- [ ] Testar índices

### **Fase 2: API**
- [ ] Criar `/api/processar-aprovacao`
- [ ] Criar `/api/webhook/payment-approved`
- [ ] Atualizar `/api/payments/approve`
- [ ] Testar endpoints

### **Fase 3: Bot**
- [ ] Atualizar `telegram-webhook.ts`
- [ ] Adicionar atualização de `payments`
- [ ] Adicionar mensagem de boas-vindas personalizada
- [ ] Testar detecção de entrada

### **Fase 4: Email**
- [ ] Criar `email-service.ts`
- [ ] Criar template HTML
- [ ] Integrar com serviço externo
- [ ] Testar envio

### **Fase 5: Dashboard**
- [ ] Atualizar tela de validação
- [ ] Adicionar coluna "Status do Link"
- [ ] Adicionar botão "Reenviar Email"
- [ ] Adicionar alertas

### **Fase 6: Testes**
- [ ] Testar fluxo completo
- [ ] Testar caso de erro
- [ ] Testar reenvio de email
- [ ] Testar múltiplos pagamentos

---

## 🎯 RESULTADO FINAL

### **Admin:**
```
1. Recebe pagamento → aprova no dashboard
2. Sistema processa automaticamente
3. Email é enviado automaticamente
4. Acompanha status em tempo real
5. Recebe alerta se cliente não entrar
```

### **Cliente:**
```
1. Faz pagamento
2. Recebe email com link
3. Clica no link
4. Entra no grupo automaticamente
5. Recebe boas-vindas
6. Tudo sincronizado
```

### **Sistema:**
```
✅ Payment atualizado com todos os dados
✅ Member atualizado com telegram_user_id
✅ Bot sincronizado
✅ Logs registrados
✅ Zero intervenção manual
```

---

## 📈 MÉTRICAS E MONITORAMENTO

### **Queries Úteis:**

```sql
-- Pagamentos aprovados aguardando entrada
SELECT
  p.id,
  m.nome,
  m.email,
  p.data_aprovacao,
  p.invite_link_enviado,
  p.invite_link_usado,
  p.entrada_confirmada
FROM payments p
JOIN members m ON m.id = p.member_id
WHERE p.status = 'aprovado'
  AND p.entrada_confirmada = FALSE
ORDER BY p.data_aprovacao DESC;

-- Taxa de conversão (aprovação → entrada)
SELECT
  COUNT(*) FILTER (WHERE status = 'aprovado') as total_aprovados,
  COUNT(*) FILTER (WHERE entrada_confirmada = TRUE) as total_entrou,
  ROUND(
    COUNT(*) FILTER (WHERE entrada_confirmada = TRUE)::NUMERIC /
    COUNT(*) FILTER (WHERE status = 'aprovado') * 100,
    2
  ) as taxa_conversao_pct
FROM payments;

-- Tempo médio entre aprovação e entrada
SELECT
  AVG(EXTRACT(EPOCH FROM (invite_link_usado_em - data_aprovacao)) / 3600) as horas_media
FROM payments
WHERE entrada_confirmada = TRUE;
```

---

## 🚀 PRÓXIMOS PASSOS

Após implementação básica:

1. **Sistema de retry automático** - Se email falhar, tentar novamente
2. **Notificação via WhatsApp** - Além de email
3. **Link de renovação** - Cliente pode renovar pelo próprio link
4. **Dashboard do cliente** - Ver seu status de pagamento
5. **Webhooks** - Notificar sistemas externos

---

**Documento criado em:** 2025-12-03
**Status:** 📋 Proposta para Implementação
**Complexidade:** Média
**Tempo estimado:** 2-3 dias de desenvolvimento
