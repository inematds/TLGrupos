# 🎯 Proposta V3 FINAL: Sistema com Múltiplos Grupos e Datas Corretas

**Data:** 2025-12-03
**Versão:** 3.0 - VERSÃO FINAL CORRIGIDA

---

## 🆕 CORREÇÕES DA V2 PARA V3

### **V2 (anterior - ERRADO):**
- ❌ Sem group_id em access_codes
- ❌ Prazo contava da data de acesso
- ❌ Atualizava datas ao acessar

### **V3 (nova - CORRETO):**
- ✅ **group_id em access_codes** (múltiplos grupos)
- ✅ **Prazo vale a partir do PAGAMENTO**
- ✅ **Ao acessar: só registra data de acesso, NÃO atualiza vencimento**

---

## 🎯 ENTENDIMENTO CORRETO

### **Fluxo de Datas:**

```
DIA 0 - PAGAMENTO APROVADO
├─ data_pagamento = 2025-12-03
├─ data_vencimento = 2025-12-03 + 30 dias = 2026-01-02
└─ Prazo começa a contar AGORA (do pagamento)

DIA 5 - CLIENTE ENTRA NO GRUPO
├─ data_entrada_grupo = 2025-12-08
├─ data_vencimento = 2026-01-02 (NÃO MUDA!)
└─ Restam 25 dias (não 30!)

DIA 30 - VENCIMENTO
├─ data_vencimento = 2026-01-02
└─ Sistema remove do grupo (30 dias após PAGAMENTO)
```

**IMPORTANTE:** O prazo NÃO é "30 dias de uso", é "30 dias a partir do pagamento", mesmo que o cliente demore para entrar!

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS - V3

### **1. TABELA `access_codes` (Atualizada)**

```sql
CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Código/Link
  code TEXT UNIQUE,
  invite_link TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'pagamento',

  -- ⭐ RELACIONAMENTOS (CORRIGIDO)
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  group_id UUID NOT NULL REFERENCES telegram_groups(id) ON DELETE CASCADE, -- ⭐ NOVO!

  -- Dados do Usuário (snapshot no momento da geração)
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT,
  usuario_telefone TEXT,
  usuario_telegram_id BIGINT,

  -- ⭐ DATAS (CORRIGIDO)
  data_geracao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_expiracao_link TIMESTAMP NOT NULL,        -- Quando o LINK expira (24h)
  data_vencimento_acesso TIMESTAMP NOT NULL,     -- Quando o ACESSO vence (do pagamento!)

  -- Uso
  usado BOOLEAN DEFAULT FALSE,
  data_acesso TIMESTAMP,                         -- ⭐ Quando ACESSOU (não muda vencimento)
  telegram_user_id_acesso BIGINT,                -- Quem acessou
  ip_acesso TEXT,

  -- Status
  status TEXT DEFAULT 'ativo',
  revogado BOOLEAN DEFAULT FALSE,
  revogado_em TIMESTAMP,
  revogado_por TEXT,
  motivo_revogacao TEXT,

  -- Detalhes
  dias_acesso INTEGER NOT NULL,
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
CREATE INDEX idx_access_codes_group ON access_codes(group_id); -- ⭐ NOVO
CREATE INDEX idx_access_codes_invite_link ON access_codes(invite_link);
CREATE INDEX idx_access_codes_status ON access_codes(status);
CREATE INDEX idx_access_codes_usado ON access_codes(usado);
CREATE INDEX idx_access_codes_telegram_user ON access_codes(telegram_user_id_acesso);

-- Comentários
COMMENT ON COLUMN access_codes.group_id IS 'Grupo Telegram para o qual o código dá acesso';
COMMENT ON COLUMN access_codes.data_expiracao_link IS 'Quando o link expira (24h após geração)';
COMMENT ON COLUMN access_codes.data_vencimento_acesso IS 'Quando o acesso vence (calculado do pagamento)';
COMMENT ON COLUMN access_codes.data_acesso IS 'Quando o cliente acessou o grupo (não altera vencimento)';
```

---

### **2. TABELA `payments` (Atualizada)**

```sql
-- Campos já existentes + novos
ALTER TABLE payments ADD COLUMN IF NOT EXISTS access_code_id UUID REFERENCES access_codes(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES telegram_groups(id); -- ⭐ NOVO
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_acessado BOOLEAN DEFAULT FALSE; -- ⭐ RENOMEADO
ALTER TABLE payments ADD COLUMN IF NOT EXISTS data_acesso TIMESTAMP; -- ⭐ NOVO
ALTER TABLE payments ADD COLUMN IF NOT EXISTS entrada_confirmada BOOLEAN DEFAULT FALSE;

-- ⭐ IMPORTANTE: data_vencimento JÁ EXISTE em payments
-- Ela é calculada na APROVAÇÃO do pagamento, não no acesso!

CREATE INDEX IF NOT EXISTS idx_payments_access_code ON payments(access_code_id);
CREATE INDEX IF NOT EXISTS idx_payments_group ON payments(group_id); -- ⭐ NOVO

COMMENT ON COLUMN payments.group_id IS 'Grupo para o qual este pagamento dá acesso';
COMMENT ON COLUMN payments.link_acessado IS 'Se o cliente clicou no link e acessou';
COMMENT ON COLUMN payments.data_acesso IS 'Quando o cliente acessou o grupo';
```

---

### **3. TABELA `members` (Atualizada)**

```sql
-- Histórico de pagamentos
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_id UUID REFERENCES payments(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_data TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_valor DECIMAL(10,2);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_tipo TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS tipo_assinatura TEXT;

-- ⭐ Acesso ao grupo (não altera vencimento)
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_primeiro_acesso TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_ultimo_acesso TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_acessos INTEGER DEFAULT 0;

ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_access_code_id UUID REFERENCES access_codes(id);

-- ⭐ data_vencimento JÁ EXISTE em members
-- É atualizada na APROVAÇÃO do pagamento, não no acesso!

CREATE INDEX IF NOT EXISTS idx_members_ultimo_pagamento ON members(ultimo_pagamento_id);
CREATE INDEX IF NOT EXISTS idx_members_ultimo_access_code ON members(ultimo_access_code_id);

COMMENT ON COLUMN members.data_primeiro_acesso IS 'Primeira vez que acessou qualquer grupo';
COMMENT ON COLUMN members.data_ultimo_acesso IS 'Última vez que acessou algum grupo';
COMMENT ON COLUMN members.total_acessos IS 'Quantas vezes acessou grupos';
```

---

## 🔄 FLUXO COMPLETO CORRIGIDO (16 PASSOS)

```
┌─────────────────────────────────────────────────────┐
│ 1. CLIENTE FAZ PAGAMENTO                            │
│    - Valor: R$ 99,90                                │
│    - Plano: Mensal (30 dias)                        │
│    - Grupo: "Grupo VIP"                             │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. REGISTRO NO BANCO                                │
│    INSERT INTO payments (                           │
│      member_id,                                     │
│      group_id, ⭐                                    │
│      valor: 99.90,                                  │
│      status: 'pendente',                            │
│      plan_id,                                       │
│      dias_acesso: 30                                │
│    )                                                │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. ADMIN APROVA PAGAMENTO                           │
│    UPDATE payments                                  │
│    SET status = 'aprovado',                         │
│        data_aprovacao = NOW(),                      │
│        ⭐ data_vencimento = NOW() + 30 dias ⭐       │
│    WHERE id = payment_id                            │
│                                                     │
│    ⚠️ IMPORTANTE: Prazo começa a contar AGORA!     │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. TRIGGER CHAMA PROCESSAMENTO                      │
│    POST /api/processar-aprovacao                    │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. GERA CÓDIGO DE ACESSO                            │
│    a) Link Telegram:                                │
│       createChatInviteLink(GROUP_ID, {              │
│         member_limit: 1,                            │
│         expire_date: NOW() + 24h                    │
│       })                                            │
│       → https://t.me/+ABC123                        │
│                                                     │
│    b) Código texto (opcional):                      │
│       → "VIP-20251203-XYZ"                          │
│                                                     │
│    c) ⭐ Datas calculadas do PAGAMENTO:             │
│       data_expiracao_link = NOW() + 24h             │
│       data_vencimento_acesso = data_aprovacao + 30d │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 6. SALVA EM access_codes                            │
│    INSERT INTO access_codes (                       │
│      code: 'VIP-20251203-XYZ',                      │
│      invite_link: 'https://t.me/+ABC123',           │
│      member_id,                                     │
│      payment_id, ⭐                                  │
│      group_id, ⭐                                    │
│      plan_id,                                       │
│      usuario_nome: 'João Silva',                    │
│      data_geracao: NOW(),                           │
│      data_expiracao_link: NOW() + 24h,              │
│      data_vencimento_acesso: NOW() + 30d, ⭐        │
│      dias_acesso: 30,                               │
│      valor_pago: 99.90,                             │
│      status: 'ativo'                                │
│    )                                                │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 7. ATUALIZA payment                                 │
│    UPDATE payments                                  │
│    SET access_code_id = id,                         │
│        link_enviado = FALSE                         │
│    WHERE id = payment_id                            │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 8. ATUALIZA member                                  │
│    UPDATE members                                   │
│    SET ⭐ data_vencimento = NOW() + 30d,            │
│        status = 'ativo',                            │
│        ultimo_pagamento_id,                         │
│        ultimo_pagamento_data = NOW(),               │
│        ultimo_pagamento_valor = 99.90,              │
│        ultimo_pagamento_tipo = 'PIX',               │
│        tipo_assinatura = 'mensal'                   │
│    WHERE id = member_id                             │
│                                                     │
│    ⚠️ Vencimento definido AQUI, não no acesso!     │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 9. ENVIA EMAIL COM LINK                             │
│    link_enviado = TRUE                              │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 10. CLIENTE CLICA E ENTRA (pode ser dias depois!)   │
│     - Prazo JÁ ESTÁ CONTANDO desde o pagamento      │
│     - Link ainda válido (24h)                       │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 11. BOT DETECTA ENTRADA                             │
│     bot.on('new_chat_members')                      │
│     Link usado: https://t.me/+ABC123                │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 12. BOT ATUALIZA access_codes                       │
│     UPDATE access_codes                             │
│     SET usado = TRUE,                               │
│         ⭐ data_acesso = NOW(),                     │
│         telegram_user_id_acesso = 123456789,        │
│         status = 'usado'                            │
│     WHERE invite_link = link                        │
│                                                     │
│     ⚠️ NÃO ALTERA data_vencimento_acesso!          │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 13. BOT ATUALIZA payment                            │
│     UPDATE payments                                 │
│     SET link_acessado = TRUE,                       │
│         ⭐ data_acesso = NOW(),                     │
│         entrada_confirmada = TRUE                   │
│     WHERE id = payment_id                           │
│                                                     │
│     ⚠️ NÃO ALTERA data_vencimento!                 │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 14. BOT ATUALIZA member                             │
│     UPDATE members                                  │
│     SET telegram_user_id = 123456789,               │
│         telegram_username = 'joao',                 │
│         no_grupo = TRUE,                            │
│         ⭐ data_primeiro_acesso = NOW() (se 1ª vez),│
│         ⭐ data_ultimo_acesso = NOW(),              │
│         ⭐ total_acessos = total_acessos + 1,       │
│         ultimo_access_code_id = code_id             │
│     WHERE id = member_id                            │
│                                                     │
│     ⚠️ NÃO ALTERA data_vencimento!                 │
│     ⚠️ NÃO ALTERA ultimo_pagamento_data!           │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 15. CALCULA DIAS RESTANTES (para exibir)            │
│     dias_restantes = data_vencimento - NOW()        │
│     (não altera data_vencimento)                    │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 16. ENVIA BOAS-VINDAS                               │
│     "Bem-vindo! Você tem X dias restantes"          │
│     (X = dias do pagamento até hoje, não 30!)       │
└─────────────────────────────────────────────────────┘
```

---

## 📝 MIGRATION COMPLETA - V3

### **Migration: 021_sistema_codigos_acesso_v3.sql**

```sql
-- ============================================================
-- MIGRATION 021 V3: Sistema de Códigos com Múltiplos Grupos
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
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  group_id UUID NOT NULL REFERENCES telegram_groups(id) ON DELETE CASCADE, -- ⭐ NOVO

  -- Dados do Usuário (snapshot)
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT,
  usuario_telefone TEXT,
  usuario_telegram_id BIGINT,

  -- Datas
  data_geracao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_expiracao_link TIMESTAMP NOT NULL,      -- Quando LINK expira (24h)
  data_vencimento_acesso TIMESTAMP NOT NULL,   -- Quando ACESSO vence (do pagamento)

  -- Uso
  usado BOOLEAN DEFAULT FALSE,
  data_acesso TIMESTAMP,                       -- ⭐ Quando acessou (não altera vencimento)
  telegram_user_id_acesso BIGINT,
  ip_acesso TEXT,

  -- Status
  status TEXT DEFAULT 'ativo',
  revogado BOOLEAN DEFAULT FALSE,
  revogado_em TIMESTAMP,
  revogado_por TEXT,
  motivo_revogacao TEXT,

  -- Detalhes
  dias_acesso INTEGER NOT NULL,
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

-- 3. ATUALIZAR payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS access_code_id UUID REFERENCES access_codes(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES telegram_groups(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_acessado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS data_acesso TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS entrada_confirmada BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_payments_access_code ON payments(access_code_id);
CREATE INDEX IF NOT EXISTS idx_payments_group ON payments(group_id);

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
COMMENT ON TABLE access_codes IS 'Códigos/links de acesso para grupos';
COMMENT ON COLUMN access_codes.group_id IS 'Grupo para o qual o código dá acesso';
COMMENT ON COLUMN access_codes.payment_id IS 'Pagamento que gerou este código';
COMMENT ON COLUMN access_codes.data_expiracao_link IS 'Quando o LINK expira (24h)';
COMMENT ON COLUMN access_codes.data_vencimento_acesso IS 'Quando o ACESSO vence (calculado do pagamento)';
COMMENT ON COLUMN access_codes.data_acesso IS 'Quando cliente acessou (não altera vencimento)';

COMMENT ON COLUMN payments.group_id IS 'Grupo para o qual este pagamento dá acesso';
COMMENT ON COLUMN payments.data_acesso IS 'Quando cliente acessou o grupo';

COMMENT ON COLUMN members.data_primeiro_acesso IS 'Primeira vez que acessou';
COMMENT ON COLUMN members.data_ultimo_acesso IS 'Última vez que acessou';
COMMENT ON COLUMN members.total_acessos IS 'Quantas vezes acessou';
```

---

## 💻 CÓDIGO: Processar Aprovação (Corrigido)

### **src/app/api/processar-aprovacao/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createInviteLink } from '@/lib/telegram';

const supabase = getServiceSupabase();

export async function POST(request: NextRequest) {
  try {
    const { payment_id } = await request.json();

    // 1. Buscar dados completos
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        members (*),
        plans (*),
        telegram_groups (*),
        formas_pagamento (nome)
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Pagamento não encontrado');
    }

    // ⭐ 2. CALCULAR DATAS (do PAGAMENTO, não do acesso)
    const dataAtual = new Date();
    const dataExpiracao = new Date(dataAtual.getTime() + 24 * 60 * 60 * 1000); // Link: 24h
    const dataVencimentoAcesso = new Date(
      dataAtual.getTime() + payment.dias_acesso * 24 * 60 * 60 * 1000
    ); // Acesso: X dias do PAGAMENTO

    // 3. Gerar link do Telegram para o GRUPO específico
    const GROUP_ID = parseInt(payment.telegram_groups.telegram_group_id);

    const linkResult = await createInviteLink(
      payment.members.telegram_user_id || 0,
      dataExpiracao
    );

    if (!linkResult.success) {
      throw new Error('Erro ao gerar link: ' + linkResult.error);
    }

    const inviteLink = linkResult.link;
    const code = gerarCodigoUnico();

    // 4. Criar registro em access_codes
    const { data: accessCode, error: accessCodeError } = await supabase
      .from('access_codes')
      .insert({
        code: code,
        invite_link: inviteLink,
        tipo: 'pagamento',

        // ⭐ Relacionamentos (incluindo group_id)
        member_id: payment.member_id,
        payment_id: payment.id,
        plan_id: payment.plan_id,
        group_id: payment.group_id, // ⭐ IMPORTANTE

        // Snapshot do usuário
        usuario_nome: payment.members.nome,
        usuario_email: payment.members.email,
        usuario_telefone: payment.members.telefone,
        usuario_telegram_id: payment.members.telegram_user_id,

        // ⭐ Datas (do PAGAMENTO)
        data_geracao: dataAtual.toISOString(),
        data_expiracao_link: dataExpiracao.toISOString(),
        data_vencimento_acesso: dataVencimentoAcesso.toISOString(),

        // Detalhes
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

    // 5. Atualizar payment
    await supabase
      .from('payments')
      .update({
        access_code_id: accessCode.id,
        link_enviado: false,
        // ⭐ data_vencimento já existe em payments e foi definida na aprovação
      })
      .eq('id', payment_id);

    // 6. Atualizar member (define vencimento do PAGAMENTO)
    await supabase
      .from('members')
      .update({
        // ⭐ data_vencimento calculada do PAGAMENTO
        data_vencimento: dataVencimentoAcesso.toISOString(),
        status: 'ativo',
        plan_id: payment.plan_id,

        // Último pagamento
        ultimo_pagamento_id: payment.id,
        ultimo_pagamento_data: dataAtual.toISOString(),
        ultimo_pagamento_valor: payment.valor,
        ultimo_pagamento_tipo: payment.formas_pagamento?.nome,
        tipo_assinatura: payment.plans?.nome || 'Padrão'
      })
      .eq('id', payment.member_id);

    // 7. Enviar email (implementar depois)
    // const emailEnviado = await enviarEmailAcesso(...)

    // 8. Registrar log
    await supabase.from('logs').insert({
      member_id: payment.member_id,
      acao: 'geracao_codigo_acesso',
      detalhes: {
        payment_id: payment.id,
        access_code_id: accessCode.id,
        group_id: payment.group_id,
        code: code,
        valor: payment.valor,
        dias_acesso: payment.dias_acesso,
        data_vencimento: dataVencimentoAcesso.toISOString()
      },
      executado_por: 'sistema'
    });

    return NextResponse.json({
      success: true,
      data: {
        access_code_id: accessCode.id,
        code: code,
        invite_link: inviteLink,
        data_vencimento: dataVencimentoAcesso,
        group_nome: payment.telegram_groups.nome
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

## 🤖 CÓDIGO: Bot Atualizado (Corrigido)

### **src/lib/telegram-webhook.ts**

```typescript
bot.on('new_chat_members', async (ctx) => {
  const member = ctx.message.new_chat_members[0];
  const linkUsado = ctx.message.invite_link?.invite_link;

  if (!linkUsado || member.is_bot) return;

  console.log(`🔗 Link usado: ${linkUsado}`);
  console.log(`👤 Quem entrou: ${member.first_name} (${member.id})`);

  try {
    // 1. Buscar access_code pelo link
    const { data: accessCode, error: accessCodeError } = await supabase
      .from('access_codes')
      .select('*, members(*), payments(*), plans(*), telegram_groups(*)')
      .eq('invite_link', linkUsado)
      .single();

    if (accessCodeError || !accessCode) {
      console.log('⚠️ Código não encontrado para este link');
      return;
    }

    const agora = new Date();
    console.log(`✅ Código encontrado: ${accessCode.code || accessCode.id}`);

    // ⭐ 2. Calcular dias restantes (do PAGAMENTO até hoje)
    const dataVencimento = new Date(accessCode.data_vencimento_acesso);
    const diasRestantes = Math.ceil(
      (dataVencimento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 3. Atualizar access_code: REGISTRA ACESSO (não altera vencimento)
    await supabase
      .from('access_codes')
      .update({
        usado: true,
        data_acesso: agora.toISOString(), // ⭐ Só registra quando acessou
        telegram_user_id_acesso: member.id,
        status: 'usado'
      })
      .eq('id', accessCode.id);

    console.log('✅ access_codes atualizado');

    // 4. Atualizar payment: REGISTRA ACESSO (não altera vencimento)
    if (accessCode.payment_id) {
      await supabase
        .from('payments')
        .update({
          link_acessado: true,
          data_acesso: agora.toISOString(), // ⭐ Só registra quando acessou
          entrada_confirmada: true
        })
        .eq('id', accessCode.payment_id);

      console.log('✅ payments atualizado');
    }

    // 5. Atualizar member: REGISTRA ACESSO (não altera vencimento e pagamento)
    const isFirstAccess = !accessCode.members.data_primeiro_acesso;

    await supabase
      .from('members')
      .update({
        // Telegram
        telegram_user_id: member.id,
        telegram_username: member.username || null,
        telegram_first_name: member.first_name,
        telegram_last_name: member.last_name || null,
        no_grupo: true,

        // ⭐ Registra acesso (não altera vencimento)
        data_primeiro_acesso: isFirstAccess ? agora.toISOString() : accessCode.members.data_primeiro_acesso,
        data_ultimo_acesso: agora.toISOString(),
        total_acessos: (accessCode.members.total_acessos || 0) + 1,
        ultimo_access_code_id: accessCode.id,

        // ⚠️ NÃO ATUALIZA: data_vencimento, ultimo_pagamento_*, tipo_assinatura
        // Esses foram definidos na aprovação do pagamento!
      })
      .eq('id', accessCode.member_id);

    console.log('✅ members atualizado');

    // 6. Registrar log
    await supabase.from('logs').insert({
      member_id: accessCode.member_id,
      acao: 'entrada_no_grupo',
      detalhes: {
        access_code_id: accessCode.id,
        payment_id: accessCode.payment_id,
        group_id: accessCode.group_id,
        group_nome: accessCode.telegram_groups.nome,
        telegram_user_id: member.id,
        dias_restantes: diasRestantes,
        data_vencimento: accessCode.data_vencimento_acesso,
        valor_pago: accessCode.valor_pago
      },
      telegram_user_id: member.id,
      telegram_username: member.username,
      executado_por: 'bot'
    });

    console.log('✅ log registrado');

    // 7. Mensagem de boas-vindas
    await ctx.reply(
      `🎉 Bem-vindo(a) ${member.first_name}!\n\n` +
      `✅ Seu acesso ao grupo "${accessCode.telegram_groups.nome}" está confirmado!\n\n` +
      `💰 Valor pago: R$ ${parseFloat(accessCode.valor_pago).toFixed(2)}\n` +
      `📅 Vencimento: ${dataVencimento.toLocaleDateString('pt-BR')}\n` +
      `⏰ Dias restantes: ${diasRestantes > 0 ? diasRestantes : '⚠️ VENCIDO'} dias\n\n` +
      (diasRestantes <= 0 ?
        `⚠️ Atenção! Seu acesso já venceu. Solicite renovação.\n\n` :
        diasRestantes <= 7 ?
        `⚠️ Seu acesso vence em breve! Renove para não perder o acesso.\n\n` :
        ''
      ) +
      `Use /status para verificar suas informações.`
    );

    console.log('✅ Boas-vindas enviadas');

  } catch (error) {
    console.error('❌ Erro ao processar entrada:', error);
  }
});
```

---

## 📊 QUERIES ÚTEIS

### **1. Comparar Data de Pagamento vs Data de Acesso**

```sql
SELECT
  m.nome,
  p.valor,
  p.data_aprovacao as data_pagamento,
  p.data_vencimento as vencimento_original,
  ac.data_acesso,
  EXTRACT(DAY FROM (ac.data_acesso - p.data_aprovacao)) as dias_ate_acessar,
  EXTRACT(DAY FROM (p.data_vencimento - ac.data_acesso)) as dias_restantes_no_acesso
FROM access_codes ac
JOIN payments p ON p.id = ac.payment_id
JOIN members m ON m.id = ac.member_id
WHERE ac.usado = TRUE
ORDER BY ac.data_acesso DESC;
```

### **2. Acessos por Grupo**

```sql
SELECT
  tg.nome as grupo,
  COUNT(*) as total_codigos_gerados,
  COUNT(*) FILTER (WHERE ac.usado = TRUE) as total_acessos,
  SUM(ac.valor_pago) as receita_total
FROM access_codes ac
JOIN telegram_groups tg ON tg.id = ac.group_id
GROUP BY tg.id, tg.nome
ORDER BY total_acessos DESC;
```

### **3. Membros que Demoraram para Acessar**

```sql
SELECT
  m.nome,
  m.email,
  tg.nome as grupo,
  p.data_aprovacao,
  ac.data_acesso,
  EXTRACT(DAY FROM (ac.data_acesso - p.data_aprovacao)) as dias_ate_acessar,
  p.data_vencimento
FROM access_codes ac
JOIN payments p ON p.id = ac.payment_id
JOIN members m ON m.id = ac.member_id
JOIN telegram_groups tg ON tg.id = ac.group_id
WHERE ac.usado = TRUE
  AND EXTRACT(DAY FROM (ac.data_acesso - p.data_aprovacao)) > 3
ORDER BY dias_ate_acessar DESC;
```

---

## 📈 EXEMPLO PRÁTICO

### **Cenário:**

```
DIA 1 (01/Dez) - PAGAMENTO
├─ Cliente paga R$ 99,90
├─ Admin aprova
├─ Sistema calcula: vencimento = 01/Dez + 30 dias = 31/Dez
├─ Gera código/link
└─ Envia email

DIA 5 (05/Dez) - CLIENTE ACESSA (4 dias depois)
├─ Cliente finalmente clica no link
├─ Entra no grupo
├─ Bot registra: data_acesso = 05/Dez
├─ Bot calcula: dias_restantes = 31/Dez - 05/Dez = 26 dias
└─ Bot avisa: "Você tem 26 dias restantes"
    (não 30 dias, porque já passaram 4!)

DIA 31 (31/Dez) - VENCIMENTO
├─ Exatamente 30 dias após PAGAMENTO
├─ Cron remove do grupo
└─ Cliente teve 26 dias de uso real (não 30)
```

### **Banco de Dados:**

```sql
-- access_codes
{
  payment_id: "uuid-payment",
  group_id: "uuid-grupo-vip",
  data_geracao: "2025-12-01 10:00",
  data_expiracao_link: "2025-12-02 10:00",    -- Link: 24h
  data_vencimento_acesso: "2025-12-31 10:00", -- 30 dias do PAGAMENTO
  usado: true,
  data_acesso: "2025-12-05 14:30",            -- Acessou 4 dias depois
  dias_acesso: 30
}

-- payments
{
  data_aprovacao: "2025-12-01 10:00",
  data_vencimento: "2025-12-31 10:00",        -- 30 dias do pagamento
  data_acesso: "2025-12-05 14:30"             -- Quando acessou
}

-- members
{
  data_vencimento: "2025-12-31 10:00",        -- Não muda no acesso
  ultimo_pagamento_data: "2025-12-01 10:00",  -- Não muda no acesso
  data_primeiro_acesso: "2025-12-05 14:30",   -- Registra acesso
  data_ultimo_acesso: "2025-12-05 14:30",     -- Registra acesso
  total_acessos: 1
}
```

---

## ✅ CHECKLIST

### **Fase 1: Banco**
- [ ] Migration 021 V3
- [ ] Verificar group_id em access_codes
- [ ] Verificar group_id em payments
- [ ] Verificar campos de acesso em members

### **Fase 2: API**
- [ ] Processar aprovação com group_id
- [ ] Calcular datas do PAGAMENTO
- [ ] NÃO atualizar datas no acesso

### **Fase 3: Bot**
- [ ] Registrar data_acesso
- [ ] Calcular dias restantes
- [ ] NÃO alterar data_vencimento
- [ ] NÃO alterar ultimo_pagamento_data

### **Fase 4: Testes**
- [ ] Pagamento → vencimento em 30 dias
- [ ] Acesso 5 dias depois → ainda 25 dias
- [ ] Vencimento em 30 dias do pagamento

---

**Documento criado em:** 2025-12-03
**Versão:** 3.0 - FINAL CORRIGIDO
**Status:** ✅ Pronto para Implementar
