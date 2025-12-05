# 🎯 Proposta V2: Sistema Completo com Tabela de Códigos

**Data:** 2025-12-03
**Versão:** 2.0 - Com Tabela de Códigos de Acesso

---

## 🆕 MUDANÇAS DA V1 PARA V2

### **V1 (anterior):**
- Link guardado apenas em `payments`
- Dados duplicados em várias tabelas

### **V2 (nova - esta):**
- ✅ **Tabela centralizada `access_codes`** para todos os links/códigos
- ✅ Histórico completo de pagamentos em `members`
- ✅ Rastreamento detalhado de uso
- ✅ Mais organizado e escalável

---

## 🗄️ NOVA ESTRUTURA DO BANCO DE DADOS

### **1. NOVA TABELA: `access_codes`** (Central)

```sql
-- Tabela centralizada de códigos/links de acesso
CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Código/Link
  code TEXT UNIQUE,                      -- Código texto (ex: "ABC123") ou NULL
  invite_link TEXT UNIQUE NOT NULL,      -- Link do Telegram (sempre tem)
  tipo TEXT NOT NULL DEFAULT 'pagamento', -- 'pagamento', 'promocional', 'convite', 'cortesia'

  -- Relacionamentos
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,

  -- Dados do Usuário (snapshot no momento da geração)
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT,
  usuario_telefone TEXT,
  usuario_telegram_id BIGINT,            -- Se já tinha no momento

  -- Validade
  data_geracao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_expiracao TIMESTAMP NOT NULL,      -- Quando expira o LINK
  data_vencimento_acesso TIMESTAMP NOT NULL, -- Quando vence o ACESSO

  -- Uso
  usado BOOLEAN DEFAULT FALSE,
  data_uso TIMESTAMP,                     -- Quando foi usado
  telegram_user_id_uso BIGINT,            -- Quem usou (ID real do Telegram)
  ip_uso TEXT,                            -- IP de onde veio (se disponível)

  -- Status
  status TEXT DEFAULT 'ativo',            -- 'ativo', 'usado', 'expirado', 'revogado'
  revogado BOOLEAN DEFAULT FALSE,
  revogado_em TIMESTAMP,
  revogado_por TEXT,
  motivo_revogacao TEXT,

  -- Detalhes
  dias_acesso INTEGER NOT NULL,           -- Quantos dias de acesso
  valor_pago DECIMAL(10,2),               -- Quanto foi pago
  forma_pagamento TEXT,                   -- PIX, Boleto, etc
  observacoes TEXT,

  -- Metadados
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_access_codes_member ON access_codes(member_id);
CREATE INDEX idx_access_codes_payment ON access_codes(payment_id);
CREATE INDEX idx_access_codes_invite_link ON access_codes(invite_link);
CREATE INDEX idx_access_codes_status ON access_codes(status);
CREATE INDEX idx_access_codes_usado ON access_codes(usado);
CREATE INDEX idx_access_codes_telegram_user ON access_codes(telegram_user_id_uso);

-- Comentários
COMMENT ON TABLE access_codes IS 'Tabela centralizada de todos os códigos/links de acesso gerados';
COMMENT ON COLUMN access_codes.code IS 'Código texto opcional (ex: ABC123) para usar no bot';
COMMENT ON COLUMN access_codes.invite_link IS 'Link do Telegram gerado';
COMMENT ON COLUMN access_codes.data_expiracao IS 'Quando o LINK expira (não pode mais usar)';
COMMENT ON COLUMN access_codes.data_vencimento_acesso IS 'Quando o ACESSO vence (precisa renovar)';
```

---

### **2. ATUALIZAR TABELA: `payments`**

```sql
-- Adicionar campos de rastreamento
ALTER TABLE payments ADD COLUMN IF NOT EXISTS access_code_id UUID REFERENCES access_codes(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_usado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS entrada_confirmada BOOLEAN DEFAULT FALSE;

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_access_code ON payments(access_code_id);
CREATE INDEX IF NOT EXISTS idx_payments_entrada_confirmada ON payments(entrada_confirmada);

COMMENT ON COLUMN payments.access_code_id IS 'Código de acesso gerado para este pagamento';
```

---

### **3. ATUALIZAR TABELA: `members`**

```sql
-- Histórico de pagamentos
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_id UUID REFERENCES payments(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_data TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_valor DECIMAL(10,2);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_tipo TEXT; -- PIX, Boleto, etc
ALTER TABLE members ADD COLUMN IF NOT EXISTS tipo_assinatura TEXT; -- mensal, trimestral, anual, vitalicio

-- Entrada no grupo
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_entrada_grupo TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_access_code_id UUID REFERENCES access_codes(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_members_ultimo_pagamento ON members(ultimo_pagamento_id);
CREATE INDEX IF NOT EXISTS idx_members_ultimo_access_code ON members(ultimo_access_code_id);
CREATE INDEX IF NOT EXISTS idx_members_tipo_assinatura ON members(tipo_assinatura);

COMMENT ON COLUMN members.ultimo_pagamento_id IS 'Último pagamento realizado';
COMMENT ON COLUMN members.ultimo_pagamento_data IS 'Data do último pagamento';
COMMENT ON COLUMN members.ultimo_pagamento_valor IS 'Valor do último pagamento';
COMMENT ON COLUMN members.ultimo_pagamento_tipo IS 'Tipo de pagamento (PIX, Boleto, etc)';
COMMENT ON COLUMN members.tipo_assinatura IS 'Tipo de assinatura (mensal, trimestral, anual, vitalicio)';
COMMENT ON COLUMN members.ultimo_access_code_id IS 'Último código de acesso usado';
```

---

## 🔄 FLUXO COMPLETO ATUALIZADO

```
┌─────────────────────────────────────────────────────┐
│ 1. CLIENTE FAZ PAGAMENTO                            │
│    - Valor: R$ 99,90                                │
│    - Plano: Mensal (30 dias)                        │
│    - Forma: PIX                                     │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. REGISTRO NO BANCO                                │
│    INSERT INTO payments (                           │
│      member_id,                                     │
│      valor: 99.90,                                  │
│      status: 'pendente',                            │
│      plan_id,                                       │
│      payment_method_id,                             │
│      dias_acesso: 30                                │
│    )                                                │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. ADMIN APROVA PAGAMENTO                           │
│    UPDATE payments                                  │
│    SET status = 'aprovado',                         │
│        data_aprovacao = NOW(),                      │
│        aprovado_por = 'admin'                       │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. TRIGGER AUTOMÁTICO                               │
│    Detecta aprovação e chama:                       │
│    POST /api/processar-aprovacao                    │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. GERA CÓDIGO DE ACESSO 🔑                         │
│                                                     │
│    a) Gera link via Telegram API:                  │
│       createChatInviteLink({                        │
│         member_limit: 1,                            │
│         expire_date: NOW() + 24h                    │
│       })                                            │
│       → https://t.me/+ABC123XYZ                     │
│                                                     │
│    b) Opcionalmente gera código texto:              │
│       → "VIP-20251203-ABC"                          │
│                                                     │
│    c) Calcula datas:                                │
│       data_expiracao = NOW() + 24h (link)           │
│       data_vencimento_acesso = NOW() + 30d          │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 6. SALVA EM access_codes                            │
│    INSERT INTO access_codes (                       │
│      code: 'VIP-20251203-ABC',                      │
│      invite_link: 'https://t.me/+ABC123XYZ',        │
│      tipo: 'pagamento',                             │
│      member_id,                                     │
│      payment_id,                                    │
│      plan_id,                                       │
│      usuario_nome: 'João Silva',                    │
│      usuario_email: 'joao@email.com',               │
│      usuario_telefone: '11999999999',               │
│      data_expiracao: NOW() + 24h,                   │
│      data_vencimento_acesso: NOW() + 30d,           │
│      dias_acesso: 30,                               │
│      valor_pago: 99.90,                             │
│      forma_pagamento: 'PIX',                        │
│      status: 'ativo'                                │
│    )                                                │
│    RETURNING id as access_code_id                   │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 7. ATUALIZA payment                                 │
│    UPDATE payments                                  │
│    SET access_code_id = access_code_id,             │
│        link_enviado = FALSE (ainda não)             │
│    WHERE id = payment_id                            │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 8. ENVIA EMAIL COM LINK ✉️                          │
│    (Sistema externo)                                │
│                                                     │
│    Para: joao@email.com                             │
│    Link: https://t.me/+ABC123XYZ                    │
│                                                     │
│    Após envio:                                      │
│    UPDATE payments                                  │
│    SET link_enviado = TRUE                          │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 9. CLIENTE CLICA E ENTRA NO GRUPO                   │
│    - Telegram adiciona automaticamente              │
│    - Link expira (member_limit: 1)                  │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 10. BOT DETECTA ENTRADA ⚡                          │
│     bot.on('new_chat_members', ...)                 │
│     Link usado: https://t.me/+ABC123XYZ             │
│     Telegram ID: 123456789                          │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 11. BOT ATUALIZA access_codes                       │
│     UPDATE access_codes                             │
│     SET usado = TRUE,                               │
│         data_uso = NOW(),                           │
│         telegram_user_id_uso = 123456789,           │
│         status = 'usado'                            │
│     WHERE invite_link = linkUsado                   │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 12. BOT ATUALIZA payment                            │
│     UPDATE payments                                 │
│     SET link_usado = TRUE,                          │
│         entrada_confirmada = TRUE                   │
│     WHERE id = payment_id                           │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 13. BOT ATUALIZA member (COMPLETO) ⭐               │
│     UPDATE members                                  │
│     SET                                             │
│       -- Telegram                                   │
│       telegram_user_id = 123456789,                 │
│       telegram_username = 'joaosilva',              │
│       telegram_first_name = 'João',                 │
│       telegram_last_name = 'Silva',                 │
│       no_grupo = TRUE,                              │
│       data_entrada_grupo = NOW(),                   │
│                                                     │
│       -- Vencimento (calculado pelos dias)          │
│       data_vencimento = NOW() + 30 days,            │
│                                                     │
│       -- Último Pagamento                           │
│       ultimo_pagamento_id = payment_id,             │
│       ultimo_pagamento_data = NOW(),                │
│       ultimo_pagamento_valor = 99.90,               │
│       ultimo_pagamento_tipo = 'PIX',                │
│                                                     │
│       -- Tipo de Assinatura                         │
│       tipo_assinatura = 'mensal',                   │
│                                                     │
│       -- Código usado                               │
│       ultimo_access_code_id = access_code_id,       │
│                                                     │
│       -- Status                                     │
│       status = 'ativo'                              │
│                                                     │
│     WHERE id = member_id                            │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 14. REGISTRA LOG                                    │
│     INSERT INTO logs (                              │
│       member_id,                                    │
│       acao: 'entrada_apos_pagamento',               │
│       detalhes: {                                   │
│         payment_id,                                 │
│         access_code_id,                             │
│         valor: 99.90,                               │
│         tipo_pagamento: 'PIX',                      │
│         dias_acesso: 30,                            │
│         data_vencimento: '2026-01-03'               │
│       }                                             │
│     )                                               │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 15. TUDO SINCRONIZADO ✅                            │
│                                                     │
│  ✓ access_codes → usado                             │
│  ✓ payments → entrada_confirmada                    │
│  ✓ members → data_vencimento atualizada             │
│  ✓ members → último_pagamento registrado            │
│  ✓ members → tipo_assinatura definida               │
│  ✓ logs → histórico completo                        │
└─────────────────────────────────────────────────────┘
```

---

## 📝 MIGRATION COMPLETA

### **Migration: 021_sistema_codigos_acesso.sql**

```sql
-- ============================================================
-- MIGRATION 021: Sistema de Códigos de Acesso
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
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,

  -- Dados do Usuário (snapshot)
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT,
  usuario_telefone TEXT,
  usuario_telegram_id BIGINT,

  -- Validade
  data_geracao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_expiracao TIMESTAMP NOT NULL,
  data_vencimento_acesso TIMESTAMP NOT NULL,

  -- Uso
  usado BOOLEAN DEFAULT FALSE,
  data_uso TIMESTAMP,
  telegram_user_id_uso BIGINT,
  ip_uso TEXT,

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

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. ÍNDICES access_codes
CREATE INDEX idx_access_codes_member ON access_codes(member_id);
CREATE INDEX idx_access_codes_payment ON access_codes(payment_id);
CREATE INDEX idx_access_codes_invite_link ON access_codes(invite_link);
CREATE INDEX idx_access_codes_status ON access_codes(status);
CREATE INDEX idx_access_codes_usado ON access_codes(usado);
CREATE INDEX idx_access_codes_telegram_user ON access_codes(telegram_user_id_uso);
CREATE INDEX idx_access_codes_data_expiracao ON access_codes(data_expiracao);

-- 3. ATUALIZAR payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS access_code_id UUID REFERENCES access_codes(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS link_usado BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS entrada_confirmada BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_payments_access_code ON payments(access_code_id);
CREATE INDEX IF NOT EXISTS idx_payments_entrada_confirmada ON payments(entrada_confirmada);

-- 4. ATUALIZAR members
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_id UUID REFERENCES payments(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_data TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_valor DECIMAL(10,2);
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_pagamento_tipo TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS tipo_assinatura TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS data_entrada_grupo TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ultimo_access_code_id UUID REFERENCES access_codes(id);

CREATE INDEX IF NOT EXISTS idx_members_ultimo_pagamento ON members(ultimo_pagamento_id);
CREATE INDEX IF NOT EXISTS idx_members_ultimo_access_code ON members(ultimo_access_code_id);
CREATE INDEX IF NOT EXISTS idx_members_tipo_assinatura ON members(tipo_assinatura);

-- 5. TRIGGER para updated_at em access_codes
CREATE TRIGGER access_codes_updated_at
  BEFORE UPDATE ON access_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. COMENTÁRIOS
COMMENT ON TABLE access_codes IS 'Tabela centralizada de códigos/links de acesso';
COMMENT ON COLUMN access_codes.code IS 'Código texto opcional (ex: VIP-ABC123)';
COMMENT ON COLUMN access_codes.invite_link IS 'Link do Telegram';
COMMENT ON COLUMN access_codes.data_expiracao IS 'Quando o link expira';
COMMENT ON COLUMN access_codes.data_vencimento_acesso IS 'Quando o acesso vence';

COMMENT ON COLUMN payments.access_code_id IS 'Código de acesso gerado';
COMMENT ON COLUMN payments.link_enviado IS 'Se o link foi enviado por email';
COMMENT ON COLUMN payments.link_usado IS 'Se o cliente usou o link';
COMMENT ON COLUMN payments.entrada_confirmada IS 'Se entrou no grupo';

COMMENT ON COLUMN members.ultimo_pagamento_id IS 'Último pagamento realizado';
COMMENT ON COLUMN members.ultimo_pagamento_data IS 'Data do último pagamento';
COMMENT ON COLUMN members.ultimo_pagamento_valor IS 'Valor do último pagamento';
COMMENT ON COLUMN members.ultimo_pagamento_tipo IS 'PIX, Boleto, Cartão, etc';
COMMENT ON COLUMN members.tipo_assinatura IS 'mensal, trimestral, anual, vitalicio';
COMMENT ON COLUMN members.ultimo_access_code_id IS 'Último código usado';
COMMENT ON COLUMN members.data_entrada_grupo IS 'Quando entrou no grupo';
```

---

## 💻 CÓDIGO: Processar Aprovação

### **Arquivo: src/app/api/processar-aprovacao/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createInviteLink } from '@/lib/telegram';
import { enviarEmailAcesso } from '@/services/email-service';

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
        formas_pagamento (nome)
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Pagamento não encontrado');
    }

    // 2. Calcular datas
    const dataAtual = new Date();
    const dataExpiracao = new Date(dataAtual.getTime() + 24 * 60 * 60 * 1000); // 24h
    const dataVencimentoAcesso = new Date(
      dataAtual.getTime() + payment.dias_acesso * 24 * 60 * 60 * 1000
    );

    // 3. Gerar link do Telegram
    const linkResult = await createInviteLink(
      payment.members.telegram_user_id || 0,
      dataExpiracao
    );

    if (!linkResult.success) {
      throw new Error('Erro ao gerar link: ' + linkResult.error);
    }

    const inviteLink = linkResult.link;

    // 4. Gerar código texto (opcional)
    const code = gerarCodigoUnico();

    // 5. Criar registro em access_codes
    const { data: accessCode, error: accessCodeError } = await supabase
      .from('access_codes')
      .insert({
        code: code,
        invite_link: inviteLink,
        tipo: 'pagamento',
        member_id: payment.member_id,
        payment_id: payment.id,
        plan_id: payment.plan_id,

        // Snapshot do usuário
        usuario_nome: payment.members.nome,
        usuario_email: payment.members.email,
        usuario_telefone: payment.members.telefone,
        usuario_telegram_id: payment.members.telegram_user_id,

        // Datas
        data_expiracao: dataExpiracao.toISOString(),
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

    // 6. Atualizar payment
    await supabase
      .from('payments')
      .update({
        access_code_id: accessCode.id,
        link_enviado: false // Ainda vai enviar
      })
      .eq('id', payment_id);

    // 7. Atualizar member com data de vencimento
    await supabase
      .from('members')
      .update({
        data_vencimento: dataVencimentoAcesso.toISOString(),
        status: 'ativo',
        plan_id: payment.plan_id,

        // Dados do último pagamento
        ultimo_pagamento_id: payment.id,
        ultimo_pagamento_data: dataAtual.toISOString(),
        ultimo_pagamento_valor: payment.valor,
        ultimo_pagamento_tipo: payment.formas_pagamento?.nome,
        tipo_assinatura: payment.plans?.nome || 'Padrão'
      })
      .eq('id', payment.member_id);

    // 8. Enviar email
    const emailEnviado = await enviarEmailAcesso(
      payment.members.email,
      payment.members.nome,
      inviteLink,
      dataVencimentoAcesso,
      payment.plans?.nome || 'Padrão',
      payment.valor
    );

    // 9. Marcar como enviado
    if (emailEnviado) {
      await supabase
        .from('payments')
        .update({ link_enviado: true })
        .eq('id', payment_id);
    }

    // 10. Registrar log
    await supabase.from('logs').insert({
      member_id: payment.member_id,
      acao: 'geracao_codigo_acesso',
      detalhes: {
        payment_id: payment.id,
        access_code_id: accessCode.id,
        code: code,
        valor: payment.valor,
        dias_acesso: payment.dias_acesso,
        data_vencimento: dataVencimentoAcesso.toISOString(),
        email_enviado: emailEnviado
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
        email_enviado: emailEnviado
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

## 🤖 CÓDIGO: Bot Atualizado

### **Arquivo: src/lib/telegram-webhook.ts (adicionar/atualizar)**

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
      .select('*, members(*), payments(*), plans(*)')
      .eq('invite_link', linkUsado)
      .single();

    if (accessCodeError || !accessCode) {
      console.log('⚠️ Código não encontrado para este link');
      return;
    }

    console.log(`✅ Código encontrado: ${accessCode.code || accessCode.id}`);

    // 2. Atualizar access_code: USADO!
    await supabase
      .from('access_codes')
      .update({
        usado: true,
        data_uso: new Date().toISOString(),
        telegram_user_id_uso: member.id,
        status: 'usado'
      })
      .eq('id', accessCode.id);

    console.log('✅ access_codes atualizado');

    // 3. Atualizar payment
    if (accessCode.payment_id) {
      await supabase
        .from('payments')
        .update({
          link_usado: true,
          entrada_confirmada: true
        })
        .eq('id', accessCode.payment_id);

      console.log('✅ payments atualizado');
    }

    // 4. Atualizar member (COMPLETO)
    await supabase
      .from('members')
      .update({
        // Telegram
        telegram_user_id: member.id,
        telegram_username: member.username || null,
        telegram_first_name: member.first_name,
        telegram_last_name: member.last_name || null,
        no_grupo: true,
        data_entrada_grupo: new Date().toISOString(),

        // Data de vencimento já foi atualizada na aprovação
        // mas confirmar status
        status: 'ativo',

        // Último código usado
        ultimo_access_code_id: accessCode.id
      })
      .eq('id', accessCode.member_id);

    console.log('✅ members atualizado');

    // 5. Registrar log
    await supabase.from('logs').insert({
      member_id: accessCode.member_id,
      acao: 'entrada_apos_pagamento',
      detalhes: {
        access_code_id: accessCode.id,
        payment_id: accessCode.payment_id,
        telegram_user_id: member.id,
        valor_pago: accessCode.valor_pago,
        dias_acesso: accessCode.dias_acesso,
        tipo_pagamento: accessCode.forma_pagamento,
        link_usado: linkUsado
      },
      telegram_user_id: member.id,
      telegram_username: member.username,
      executado_por: 'bot'
    });

    console.log('✅ log registrado');

    // 6. Enviar mensagem de boas-vindas personalizada
    const dataVencimento = new Date(accessCode.data_vencimento_acesso);
    await ctx.reply(
      `🎉 Bem-vindo(a) ${member.first_name}!\n\n` +
      `✅ Seu pagamento foi confirmado!\n` +
      `💰 Valor: R$ ${parseFloat(accessCode.valor_pago).toFixed(2)}\n` +
      `📅 Seu acesso é válido até: ${dataVencimento.toLocaleDateString('pt-BR')}\n` +
      `⏰ Dias restantes: ${accessCode.dias_acesso} dias\n\n` +
      `Use /status para verificar suas informações a qualquer momento.`
    );

    console.log('✅ Boas-vindas enviadas');

  } catch (error) {
    console.error('❌ Erro ao processar entrada:', error);
  }
});
```

---

## 📊 QUERIES ÚTEIS

### **1. Códigos Gerados vs Usados**

```sql
SELECT
  COUNT(*) as total_gerados,
  COUNT(*) FILTER (WHERE usado = TRUE) as total_usados,
  COUNT(*) FILTER (WHERE usado = FALSE AND status = 'ativo') as pendentes,
  COUNT(*) FILTER (WHERE status = 'expirado') as expirados,
  ROUND(
    COUNT(*) FILTER (WHERE usado = TRUE)::NUMERIC /
    COUNT(*)::NUMERIC * 100,
    2
  ) as taxa_uso_pct
FROM access_codes;
```

### **2. Códigos Pendentes de Uso**

```sql
SELECT
  ac.code,
  ac.invite_link,
  ac.usuario_nome,
  ac.usuario_email,
  ac.valor_pago,
  ac.dias_acesso,
  ac.data_geracao,
  ac.data_expiracao,
  p.status as status_pagamento,
  p.link_enviado
FROM access_codes ac
JOIN payments p ON p.id = ac.payment_id
WHERE ac.usado = FALSE
  AND ac.status = 'ativo'
  AND p.status = 'aprovado'
ORDER BY ac.data_geracao DESC;
```

### **3. Histórico de Pagamentos de um Membro**

```sql
SELECT
  m.nome,
  m.email,
  m.ultimo_pagamento_data,
  m.ultimo_pagamento_valor,
  m.ultimo_pagamento_tipo,
  m.tipo_assinatura,
  m.data_vencimento,
  COUNT(p.id) as total_pagamentos,
  SUM(p.valor) as valor_total_pago
FROM members m
LEFT JOIN payments p ON p.member_id = m.id AND p.status = 'aprovado'
WHERE m.id = '{member_id}'
GROUP BY m.id, m.nome, m.email, m.ultimo_pagamento_data,
         m.ultimo_pagamento_valor, m.ultimo_pagamento_tipo,
         m.tipo_assinatura, m.data_vencimento;
```

### **4. Códigos Expirados Não Usados (alerta)**

```sql
SELECT
  ac.usuario_nome,
  ac.usuario_email,
  ac.valor_pago,
  ac.data_geracao,
  ac.data_expiracao,
  p.link_enviado
FROM access_codes ac
JOIN payments p ON p.id = ac.payment_id
WHERE ac.usado = FALSE
  AND ac.data_expiracao < NOW()
  AND p.status = 'aprovado'
ORDER BY ac.data_expiracao DESC;
```

---

## 🎯 VANTAGENS DESTA ESTRUTURA

### **1. Tabela Centralizada**
```
✅ Todos os códigos em um só lugar
✅ Fácil de auditar
✅ Fácil de consultar
✅ Histórico completo preservado
```

### **2. Dados Completos em Members**
```
✅ último_pagamento_* → Sabe último pagamento
✅ tipo_assinatura → Mensal, Anual, etc
✅ data_vencimento → Atualizada automaticamente
✅ ultimo_access_code_id → Rastreabilidade
```

### **3. Rastreamento Perfeito**
```
✅ Quem gerou o código
✅ Quando foi gerado
✅ Quando foi usado
✅ Quem usou (telegram_user_id)
✅ Valor pago
✅ Tipo de pagamento
```

### **4. Relatórios Fáceis**
```
✅ Taxa de conversão (gerado → usado)
✅ Tempo médio até uso
✅ Códigos pendentes
✅ Histórico por membro
✅ Receita por tipo de assinatura
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Banco de Dados**
- [ ] Executar migration 021
- [ ] Verificar tabela `access_codes` criada
- [ ] Verificar colunas em `payments` adicionadas
- [ ] Verificar colunas em `members` adicionadas
- [ ] Testar índices

### **Fase 2: API**
- [ ] Criar `/api/processar-aprovacao/route.ts`
- [ ] Testar geração de código
- [ ] Testar geração de link
- [ ] Testar salvamento em `access_codes`
- [ ] Testar atualização de `members`

### **Fase 3: Bot**
- [ ] Atualizar `telegram-webhook.ts`
- [ ] Testar detecção de entrada
- [ ] Testar atualização de `access_codes`
- [ ] Testar atualização de `payments`
- [ ] Testar atualização de `members`
- [ ] Testar mensagem de boas-vindas

### **Fase 4: Email**
- [ ] Implementar envio de email
- [ ] Testar template
- [ ] Testar link no email

### **Fase 5: Dashboard**
- [ ] Adicionar visualização de `access_codes`
- [ ] Adicionar status detalhado
- [ ] Adicionar botão reenviar
- [ ] Adicionar alertas

### **Fase 6: Testes Completos**
- [ ] Fluxo completo: pagamento → aprovação → entrada
- [ ] Testar renovação
- [ ] Testar múltiplos pagamentos
- [ ] Testar código expirado
- [ ] Testar código já usado

---

## 📈 ESTRUTURA FINAL

```
access_codes (centralizado)
    ↓
    ├─ Rastreia TODOS os códigos/links
    ├─ Snapshot dos dados do usuário
    ├─ Datas de expiração e vencimento
    ├─ Status de uso
    └─ Vincula payment + member + plan

payments
    ↓
    ├─ access_code_id → Qual código foi gerado
    ├─ link_enviado → Email foi enviado?
    ├─ link_usado → Cliente usou?
    └─ entrada_confirmada → Entrou no grupo?

members
    ↓
    ├─ data_vencimento → Calculada pelos dias_acesso
    ├─ ultimo_pagamento_* → Dados do último pagamento
    ├─ tipo_assinatura → Mensal, Anual, etc
    └─ ultimo_access_code_id → Último código usado
```

---

**Documento criado em:** 2025-12-03
**Versão:** 2.0 - Com Tabela Centralizada
**Status:** 📋 Proposta Completa
**Complexidade:** Média-Alta
**Tempo estimado:** 3-4 dias de desenvolvimento
