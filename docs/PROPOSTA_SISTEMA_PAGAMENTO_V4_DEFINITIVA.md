# 🎯 Proposta V4 DEFINITIVA: Sistema Simplificado e Correto

**Data:** 2025-12-03
**Versão:** 4.0 - VERSÃO DEFINITIVA

---

## 🆕 CORREÇÕES DA V3 PARA V4

### **V3 (anterior - ERRADO):**
- ❌ group_id em payments (não tem!)
- ❌ Link com expiração de 24h
- ❌ Calculava dias de acesso

### **V4 (nova - CORRETO):**
- ✅ **Payments SÓ tem member_id** (não tem group_id)
- ✅ **Link SEM expiração** (só expira quando usado ou revogado)
- ✅ **Dias de acesso vem de payments.dias_acesso** (já está lá!)
- ✅ **Vencimento vem de payments.data_vencimento** (já calculado!)
- ✅ **TODOS os dados vêm de payments** (fonte única)

---

## 🎯 ENTENDIMENTO CORRETO

### **Tabela `payments` (JÁ EXISTE):**

```sql
payments:
  member_id         -- ⭐ SÓ tem membro (não tem group_id)
  plan_id
  valor
  status
  data_vencimento   -- ⭐ JÁ CALCULADA (vem pronta!)
  dias_acesso       -- ⭐ JÁ TEM OS DIAS (30, 90, etc)
```

### **Fluxo de Datas:**

```
PAGAMENTO APROVADO
├─ payments.data_vencimento = JÁ VEM CALCULADA
├─ payments.dias_acesso = 30 (exemplo)
└─ Sistema NÃO calcula, só USA esses valores!

GERA CÓDIGO
├─ Pega: payments.data_vencimento
├─ Pega: payments.dias_acesso
├─ Link SEM expiração (só expira quando usado)
└─ Salva em access_codes

CLIENTE ACESSA
├─ Registra: data_acesso
├─ NÃO altera: data_vencimento (já estava definida)
└─ Link expira automaticamente (member_limit: 1)
```

---

## 🗄️ ESTRUTURA DO BANCO - V4

### **1. TABELA `access_codes` (SIMPLIFICADA)**

```sql
CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Código/Link
  code TEXT UNIQUE,
  invite_link TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'pagamento',

  -- ⭐ RELACIONAMENTOS (SIMPLIFICADO)
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES telegram_groups(id) ON DELETE CASCADE,

  -- Dados do Usuário (snapshot)
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT,
  usuario_telefone TEXT,
  usuario_telegram_id BIGINT,

  -- ⭐ DATAS (SIMPLIFICADO - VEM DE PAYMENTS)
  data_geracao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_vencimento_acesso TIMESTAMP NOT NULL,  -- ⭐ COPIA de payments.data_vencimento
  dias_acesso INTEGER NOT NULL,               -- ⭐ COPIA de payments.dias_acesso

  -- Uso
  usado BOOLEAN DEFAULT FALSE,
  data_acesso TIMESTAMP,
  telegram_user_id_acesso BIGINT,
  ip_acesso TEXT,

  -- Status
  status TEXT DEFAULT 'ativo',
  revogado BOOLEAN DEFAULT FALSE,
  revogado_em TIMESTAMP,
  revogado_por TEXT,
  motivo_revogacao TEXT,

  -- Detalhes (CÓPIA de payments)
  valor_pago DECIMAL(10,2),
  forma_pagamento TEXT,
  observacoes TEXT,

  -- Metadados
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_access_codes_member ON access_codes(member_id);
CREATE INDEX idx_access_codes_payment ON access_codes(payment_id);
CREATE INDEX idx_access_codes_group ON access_codes(group_id);
CREATE INDEX idx_access_codes_invite_link ON access_codes(invite_link);
CREATE INDEX idx_access_codes_status ON access_codes(status);
CREATE INDEX idx_access_codes_usado ON access_codes(usado);

-- Comentários
COMMENT ON TABLE access_codes IS 'Códigos de acesso - dados copiados de payments';
COMMENT ON COLUMN access_codes.data_vencimento_acesso IS 'Copiado de payments.data_vencimento';
COMMENT ON COLUMN access_codes.dias_acesso IS 'Copiado de payments.dias_acesso';
```

---

### **2. TABELA `payments` (NÃO MEXE - SÓ ADICIONA REFERÊNCIA)**

```sql
-- ⭐ payments JÁ TEM TUDO:
-- - member_id
-- - data_vencimento (já calculada)
-- - dias_acesso (30, 90, etc)

-- Só adiciona referência ao código gerado
ALTER TABLE payments ADD COLUMN IF NOT EXISTS access_code_id UUID REFERENCES access_codes(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_acessado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS data_acesso TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS entrada_confirmada BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_payments_access_code ON payments(access_code_id);

-- ⚠️ NÃO ADICIONA group_id em payments!
```

---

### **3. TABELA `members` (IGUAL ANTES)**

```sql
-- Histórico de pagamentos
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_id UUID REFERENCES payments(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_data TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_valor DECIMAL(10,2);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_tipo TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS tipo_assinatura TEXT;

-- Acesso
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_primeiro_acesso TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_ultimo_acesso TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_acessos INTEGER DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_access_code_id UUID REFERENCES access_codes(id);

CREATE INDEX IF NOT EXISTS idx_members_ultimo_pagamento ON members(ultimo_pagamento_id);
```

---

## 🔄 FLUXO COMPLETO CORRETO (15 PASSOS)

```
┌─────────────────────────────────────────────────────┐
│ 1. CLIENTE FAZ PAGAMENTO                            │
│    - Valor: R$ 99,90                                │
│    - Para qual grupo: Grupo VIP                     │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. REGISTRO NO BANCO                                │
│    INSERT INTO payments (                           │
│      member_id,              -- ⭐ SÓ membro        │
│      valor: 99.90,                                  │
│      status: 'pendente',                            │
│      plan_id,                                       │
│      dias_acesso: 30,        -- ⭐ JÁ VEM           │
│      data_vencimento: '2026-01-02' -- ⭐ JÁ VEM     │
│    )                                                │
│                                                     │
│    ⚠️ group_id NÃO está em payments!               │
│    ⚠️ data_vencimento JÁ VEM CALCULADA!            │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. ADMIN APROVA                                     │
│    UPDATE payments                                  │
│    SET status = 'aprovado',                         │
│        data_aprovacao = NOW()                       │
│                                                     │
│    ⚠️ data_vencimento JÁ EXISTE, não calcula!      │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. TRIGGER CHAMA PROCESSAMENTO                      │
│    POST /api/processar-aprovacao                    │
│    Body: { payment_id, group_id } ⭐                │
│                                                     │
│    ⚠️ group_id vem do FRONTEND, não do payment!    │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. BUSCA DADOS DE PAYMENTS                          │
│    SELECT * FROM payments                           │
│    WHERE id = payment_id                            │
│                                                     │
│    Retorna:                                         │
│    - member_id                                      │
│    - data_vencimento ⭐ (já calculada!)             │
│    - dias_acesso ⭐ (30, 90, etc)                   │
│    - valor                                          │
│    - plan_id                                        │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 6. GERA LINK TELEGRAM                               │
│    createChatInviteLink(GROUP_ID, {                 │
│      member_limit: 1                                │
│      // ⭐ SEM expire_date = nunca expira!          │
│    })                                               │
│                                                     │
│    → https://t.me/+ABC123XYZ                        │
│                                                     │
│    ⚠️ Link só expira quando USADO ou REVOGADO!     │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 7. GERA CÓDIGO TEXTO (OPCIONAL)                     │
│    code = "VIP-20251203-XYZ"                        │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 8. SALVA EM access_codes                            │
│    INSERT INTO access_codes (                       │
│      code: 'VIP-20251203-XYZ',                      │
│      invite_link: 'https://t.me/+ABC123XYZ',        │
│      member_id: payment.member_id,                  │
│      payment_id: payment.id,                        │
│      group_id: group_id, ⭐ (do frontend)           │
│                                                     │
│      // ⭐ COPIA de payments:                       │
│      data_vencimento_acesso: payment.data_vencimento│
│      dias_acesso: payment.dias_acesso,              │
│      valor_pago: payment.valor,                     │
│                                                     │
│      usuario_nome: member.nome,                     │
│      status: 'ativo'                                │
│    )                                                │
│                                                     │
│    ⚠️ NÃO CALCULA nada, só COPIA de payments!      │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 9. ATUALIZA payment                                 │
│    UPDATE payments                                  │
│    SET access_code_id = code_id                     │
│    WHERE id = payment_id                            │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 10. ATUALIZA member                                 │
│     UPDATE members                                  │
│     SET data_vencimento = payment.data_vencimento,  │
│         ultimo_pagamento_id = payment.id,           │
│         ultimo_pagamento_data = NOW(),              │
│         ultimo_pagamento_valor = payment.valor,     │
│         tipo_assinatura = plan.nome                 │
│     WHERE id = payment.member_id                    │
│                                                     │
│     ⚠️ Só COPIA, não calcula!                      │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 11. ENVIA EMAIL COM LINK                            │
│     link_enviado = TRUE                             │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 12. CLIENTE CLICA E ENTRA                           │
│     (pode ser imediato ou dias depois)              │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 13. BOT DETECTA ENTRADA                             │
│     bot.on('new_chat_members')                      │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 14. BOT ATUALIZA TUDO                               │
│                                                     │
│     a) access_codes:                                │
│        usado = TRUE                                 │
│        data_acesso = NOW()                          │
│        status = 'usado'                             │
│                                                     │
│     b) payments:                                    │
│        link_acessado = TRUE                         │
│        data_acesso = NOW()                          │
│        entrada_confirmada = TRUE                    │
│                                                     │
│     c) members:                                     │
│        telegram_user_id = user_id                   │
│        no_grupo = TRUE                              │
│        data_primeiro_acesso = NOW() (se 1ª)        │
│        data_ultimo_acesso = NOW()                   │
│        total_acessos++                              │
│                                                     │
│     ⚠️ NÃO altera data_vencimento!                 │
│     ⚠️ NÃO altera ultimo_pagamento_data!           │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 15. LINK EXPIRA AUTOMATICAMENTE                     │
│     (member_limit: 1 foi usado)                     │
└─────────────────────────────────────────────────────┘
```

---

## 📝 MIGRATION COMPLETA - V4

### **Migration: 021_sistema_codigos_acesso_v4.sql**

```sql
-- ============================================================
-- MIGRATION 021 V4: Sistema de Códigos - Versão Simplificada
-- ============================================================

-- 1. CRIAR TABELA access_codes
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Código/Link
  code TEXT UNIQUE,
  invite_link TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'pagamento',

  -- Relacionamentos
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES telegram_groups(id) ON DELETE CASCADE,

  -- Dados do Usuário (snapshot)
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT,
  usuario_telefone TEXT,
  usuario_telegram_id BIGINT,

  -- ⭐ Datas (COPIADAS de payments)
  data_geracao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_vencimento_acesso TIMESTAMP NOT NULL,  -- Cópia de payments.data_vencimento
  dias_acesso INTEGER NOT NULL,               -- Cópia de payments.dias_acesso

  -- Uso
  usado BOOLEAN DEFAULT FALSE,
  data_acesso TIMESTAMP,
  telegram_user_id_acesso BIGINT,
  ip_acesso TEXT,

  -- Status
  status TEXT DEFAULT 'ativo',
  revogado BOOLEAN DEFAULT FALSE,
  revogado_em TIMESTAMP,
  revogado_por TEXT,
  motivo_revogacao TEXT,

  -- Detalhes (cópia de payments)
  valor_pago DECIMAL(10,2),
  forma_pagamento TEXT,
  observacoes TEXT,

  -- Metadados
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. ÍNDICES access_codes
CREATE INDEX idx_access_codes_member ON access_codes(member_id);
CREATE INDEX idx_access_codes_payment ON access_codes(payment_id);
CREATE INDEX idx_access_codes_group ON access_codes(group_id);
CREATE INDEX idx_access_codes_invite_link ON access_codes(invite_link);
CREATE INDEX idx_access_codes_status ON access_codes(status);
CREATE INDEX idx_access_codes_usado ON access_codes(usado);
CREATE INDEX idx_access_codes_telegram_user ON access_codes(telegram_user_id_acesso);

-- 3. ATUALIZAR payments (SÓ referência, NÃO adiciona group_id)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS access_code_id UUID REFERENCES access_codes(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_acessado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS data_acesso TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS entrada_confirmada BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_payments_access_code ON payments(access_code_id);

-- 4. ATUALIZAR members
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_id UUID REFERENCES payments(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_data TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_valor DECIMAL(10,2);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_tipo TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS tipo_assinatura TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_primeiro_acesso TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_ultimo_acesso TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_acessos INTEGER DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_access_code_id UUID REFERENCES access_codes(id);

CREATE INDEX IF NOT EXISTS idx_members_ultimo_pagamento ON members(ultimo_pagamento_id);
CREATE INDEX IF NOT EXISTS idx_members_ultimo_access_code ON members(ultimo_access_code_id);

-- 5. TRIGGER para updated_at
CREATE TRIGGER access_codes_updated_at
  BEFORE UPDATE ON access_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. COMENTÁRIOS
COMMENT ON TABLE access_codes IS 'Códigos de acesso - dados vêm de payments';
COMMENT ON COLUMN access_codes.data_vencimento_acesso IS 'CÓPIA de payments.data_vencimento';
COMMENT ON COLUMN access_codes.dias_acesso IS 'CÓPIA de payments.dias_acesso';
COMMENT ON COLUMN access_codes.group_id IS 'Grupo para acesso (informado no frontend)';
COMMENT ON COLUMN access_codes.payment_id IS 'Payment de onde vêm TODOS os dados';
```

---

## 💻 CÓDIGO: Processar Aprovação (CORRETO)

### **src/app/api/processar-aprovacao/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createInviteLink } from '@/lib/telegram';

const supabase = getServiceSupabase();

export async function POST(request: NextRequest) {
  try {
    const { payment_id, group_id } = await request.json(); // ⭐ group_id vem do frontend!

    // 1. Buscar payment (tem TODOS os dados)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        members (*),
        plans (*),
        formas_pagamento (nome)
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Pagamento não encontrado');
    }

    // 2. Buscar dados do grupo
    const { data: group, error: groupError } = await supabase
      .from('telegram_groups')
      .select('*')
      .eq('id', group_id)
      .single();

    if (groupError || !group) {
      throw new Error('Grupo não encontrado');
    }

    // ⭐ 3. NÃO CALCULA NADA - PEGA DE PAYMENTS
    const dataVencimento = new Date(payment.data_vencimento); // ⭐ JÁ VEM PRONTA
    const diasAcesso = payment.dias_acesso;                   // ⭐ JÁ TEM

    // 4. Gerar link do Telegram (SEM expiração!)
    const GROUP_TELEGRAM_ID = parseInt(group.telegram_group_id);

    const linkResult = await createInviteLink(
      payment.members.telegram_user_id || 0,
      undefined // ⭐ SEM expire_date = nunca expira (só quando usado)
    );

    if (!linkResult.success) {
      throw new Error('Erro ao gerar link: ' + linkResult.error);
    }

    const inviteLink = linkResult.link;
    const code = gerarCodigoUnico();

    // 5. Salvar em access_codes (COPIA de payments)
    const { data: accessCode, error: accessCodeError } = await supabase
      .from('access_codes')
      .insert({
        code: code,
        invite_link: inviteLink,
        tipo: 'pagamento',

        // Relacionamentos
        member_id: payment.member_id,
        payment_id: payment.id,
        group_id: group_id, // ⭐ Vem do frontend

        // Snapshot usuário
        usuario_nome: payment.members.nome,
        usuario_email: payment.members.email,
        usuario_telefone: payment.members.telefone,
        usuario_telegram_id: payment.members.telegram_user_id,

        // ⭐ COPIA de payments (não calcula)
        data_vencimento_acesso: payment.data_vencimento,
        dias_acesso: payment.dias_acesso,
        valor_pago: payment.valor,
        forma_pagamento: payment.formas_pagamento?.nome || 'Não especificado',

        status: 'ativo'
      })
      .select()
      .single();

    if (accessCodeError) {
      throw new Error('Erro ao criar código: ' + accessCodeError.message);
    }

    // 6. Atualizar payment
    await supabase
      .from('payments')
      .update({ access_code_id: accessCode.id })
      .eq('id', payment_id);

    // 7. Atualizar member (COPIA de payments)
    await supabase
      .from('members')
      .update({
        data_vencimento: payment.data_vencimento, // ⭐ COPIA
        status: 'ativo',
        plan_id: payment.plan_id,

        ultimo_pagamento_id: payment.id,
        ultimo_pagamento_data: new Date().toISOString(),
        ultimo_pagamento_valor: payment.valor,
        ultimo_pagamento_tipo: payment.formas_pagamento?.nome,
        tipo_assinatura: payment.plans?.nome || 'Padrão'
      })
      .eq('id', payment.member_id);

    // 8. Enviar email (implementar depois)
    // await enviarEmailAcesso(...)

    // 9. Registrar log
    await supabase.from('logs').insert({
      member_id: payment.member_id,
      acao: 'geracao_codigo_acesso',
      detalhes: {
        payment_id: payment.id,
        access_code_id: accessCode.id,
        group_id: group_id,
        code: code,
        valor: payment.valor,
        data_vencimento: payment.data_vencimento
      },
      executado_por: 'sistema'
    });

    return NextResponse.json({
      success: true,
      data: {
        access_code_id: accessCode.id,
        code: code,
        invite_link: inviteLink,
        data_vencimento: dataVencimento,
        group_nome: group.nome
      }
    });

  } catch (error: any) {
    console.error('Erro ao processar aprovação:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function gerarCodigoUnico(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `VIP-${timestamp}-${random}`;
}
```

---

## 🤖 CÓDIGO: Bot (IGUAL ANTES)

```typescript
bot.on('new_chat_members', async (ctx) => {
  const member = ctx.message.new_chat_members[0];
  const linkUsado = ctx.message.invite_link?.invite_link;

  if (!linkUsado || member.is_bot) return;

  try {
    // 1. Buscar código
    const { data: accessCode } = await supabase
      .from('access_codes')
      .select('*, members(*), telegram_groups(*)')
      .eq('invite_link', linkUsado)
      .single();

    if (!accessCode) return;

    const agora = new Date();
    const dataVencimento = new Date(accessCode.data_vencimento_acesso);
    const diasRestantes = Math.ceil(
      (dataVencimento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 2. Atualizar access_codes
    await supabase
      .from('access_codes')
      .update({
        usado: true,
        data_acesso: agora.toISOString(),
        telegram_user_id_acesso: member.id,
        status: 'usado'
      })
      .eq('id', accessCode.id);

    // 3. Atualizar payments
    await supabase
      .from('payments')
      .update({
        link_acessado: true,
        data_acesso: agora.toISOString(),
        entrada_confirmada: true
      })
      .eq('id', accessCode.payment_id);

    // 4. Atualizar members
    const isFirstAccess = !accessCode.members.data_primeiro_acesso;

    await supabase
      .from('members')
      .update({
        telegram_user_id: member.id,
        telegram_username: member.username || null,
        no_grupo: true,
        data_primeiro_acesso: isFirstAccess ? agora.toISOString() : accessCode.members.data_primeiro_acesso,
        data_ultimo_acesso: agora.toISOString(),
        total_acessos: (accessCode.members.total_acessos || 0) + 1,
        ultimo_access_code_id: accessCode.id
      })
      .eq('id', accessCode.member_id);

    // 5. Mensagem de boas-vindas
    await ctx.reply(
      `🎉 Bem-vindo(a) ${member.first_name}!\n\n` +
      `✅ Acesso ao grupo "${accessCode.telegram_groups.nome}" confirmado!\n\n` +
      `💰 Valor pago: R$ ${parseFloat(accessCode.valor_pago).toFixed(2)}\n` +
      `📅 Vencimento: ${dataVencimento.toLocaleDateString('pt-BR')}\n` +
      `⏰ Dias restantes: ${diasRestantes > 0 ? diasRestantes : '⚠️ VENCIDO'} dias\n\n` +
      `Use /status para mais informações.`
    );

  } catch (error) {
    console.error('Erro:', error);
  }
});
```

---

## ✅ RESUMO FINAL V4

### **PAYMENTS (não mexe):**
```sql
payments:
  member_id ✅ (SÓ membro, sem group_id)
  data_vencimento ✅ (JÁ VEM CALCULADA)
  dias_acesso ✅ (JÁ TEM O VALOR)
```

### **ACCESS_CODES (copia de payments):**
```sql
access_codes:
  payment_id ✅
  group_id ✅ (vem do frontend)
  data_vencimento_acesso ✅ (CÓPIA de payments)
  dias_acesso ✅ (CÓPIA de payments)
```

### **LINK:**
```
✅ SEM expiração (só member_limit: 1)
✅ Expira quando USADO ou REVOGADO
✅ NÃO tem expire_date
```

### **FLUXO:**
```
1. Payments JÁ TEM tudo
2. Sistema só COPIA
3. Não CALCULA nada
4. Link sem expiração
5. Ao acessar: só registra
```

---

**Documento criado em:** 2025-12-03
**Versão:** 4.0 - DEFINITIVA
**Status:** ✅ CORRETO E SIMPLIFICADO
