# Sistema de Códigos de Convite para Grupos Telegram - Versão 1

**Data:** 2025-12-03
**Projeto:** TLGrupos
**Versão:** 1.0

---

## 📋 ÍNDICE

1. [Como Funciona o Sistema de Convites do Telegram](#como-funciona-o-sistema-de-convites-do-telegram)
2. [Links de Convite Dinâmicos (Invite Links)](#links-de-convite-dinâmicos-invite-links)
3. [Como o Bot Detecta Entradas](#como-o-bot-detecta-entradas)
4. [Armazenamento no Banco de Dados](#armazenamento-no-banco-de-dados)
5. [Diferença entre Links e Códigos](#diferença-entre-links-e-códigos)
6. [Fluxo Completo de Entrada](#fluxo-completo-de-entrada)
7. [Implementação Atual](#implementação-atual)
8. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
9. [Serviços e APIs](#serviços-e-apis)

---

## 🔐 COMO FUNCIONA O SISTEMA DE CONVITES DO TELEGRAM

### **1. LINKS DE CONVITE DINÂMICOS (Invite Links)**

O Telegram tem uma API que permite criar **invite links** com características específicas:

```typescript
// src/lib/telegram.ts (linha 38-55)
await bot.telegram.createChatInviteLink(GROUP_ID, {
  member_limit: 1,           // APENAS 1 pessoa pode usar
  expire_date: timestamp     // Expira em X tempo
});
```

**Características:**
- ✅ **Link único**: `member_limit: 1` = só 1 pessoa pode entrar
- ✅ **Expira automaticamente**: após tempo definido ou após uso
- ✅ **Não precisa armazenar controle de uso**: o próprio Telegram controla
- ✅ **Rastreável**: você sabe quando foi usado

**Exemplo de link gerado:**
```
https://t.me/+AbCdEfGhIjKlMnOp
```

---

## 📡 COMO O BOT DETECTA ENTRADAS

Quando alguém usa o link e entra no grupo, o Telegram envia um **evento** para o bot:

```typescript
// src/lib/telegram-webhook.ts (linha 133)
bot.on('new_chat_members', async (ctx) => {
  const newMembers = ctx.message.new_chat_members;

  // O Telegram passa:
  // - Quem entrou (id, nome, username)
  // - Qual link foi usado (se disponível)
  const inviteLinkUsed = ctx.message.invite_link?.invite_link;
})
```

**O que o bot recebe automaticamente:**
```javascript
{
  new_chat_members: [
    {
      id: 123456789,
      first_name: "João",
      username: "joao123"
    }
  ],
  invite_link: {
    invite_link: "https://t.me/+AbCdEfGhIjKlMnOp"
  }
}
```

**IMPORTANTE:** Não precisa de polling ou verificação manual - o Telegram avisa o bot automaticamente!

---

## 💾 ARMAZENAMENTO NO BANCO DE DADOS

### **Precisa armazenar o link?**

**SIM, para o fluxo completo:**

```sql
-- Armazenar o link gerado no cadastro do membro
members:
  id                    UUID
  nome                  TEXT
  invite_link          TEXT  ← ARMAZENAR AQUI
  invite_link_type     TEXT  ← 'unique' ou 'generic'
  invite_link_revoked  BOOLEAN
  telegram_user_id     BIGINT
  data_vencimento      TIMESTAMP
```

**Por quê armazenar?**
- Para saber qual cadastro corresponde a qual link
- Para rastrear se o link foi usado
- Para permitir reenvio do link se necessário
- Para validar se a pessoa que entrou é a pessoa certa

**Como o bot associa entrada ao cadastro:**

```typescript
// src/lib/telegram-webhook.ts (linha 169-182)
// Busca quem tinha este link
const { data } = await supabase
  .from('members')
  .select('*')
  .eq('invite_link', inviteLinkUsed)  // ← AQUI!
  .single();

if (existing) {
  console.log(`Encontrado pelo link! Vinculando telegram_user_id`);
}
```

---

## 🔀 DIFERENÇA ENTRE LINKS E CÓDIGOS

### **Link Dinâmico (Invite Link)**
```
✅ Criado pela API do Telegram
✅ URL complexa: https://t.me/+AbCdEfGhIjKlMnOp
✅ Expira automaticamente
✅ Telegram controla tudo
✅ Rastreável via evento do bot
✅ Entrada direta (1 clique)
❌ Difícil de compartilhar verbalmente
❌ Não pode reutilizar depois de expirado
```

**Exemplo de uso:**
```typescript
// Criar link único
const invite = await bot.telegram.createChatInviteLink(GROUP_ID, {
  member_limit: 1,
  expire_date: Math.floor(expiresAt.getTime() / 1000)
});

// Link: https://t.me/+AbCdEfGhIjKlMnOp
// Pessoa clica → entra direto no grupo
```

---

### **Código Texto (Token)**
```
✅ Simples: "PROMO2024" ou "ABC123"
✅ Fácil de compartilhar
✅ Você controla regras (quantos usos, validade)
✅ Pode ser reutilizável
✅ Pode ter descontos/benefícios associados
❌ Precisa de comando no bot (/entrar CODIGO)
❌ Requer um passo extra (digitar no bot)
```

**Exemplo de uso:**
```typescript
// Pessoa digita no bot
/entrar PROMO2024

// Bot valida código
const { data: member } = await supabase
  .from('members')
  .eq('invite_token', 'PROMO2024')
  .single();

// Bot cria link na hora
const inviteLink = await bot.telegram.createChatInviteLink(GROUP_ID, {
  member_limit: 1,
  expire_date: expira_em_1_hora
});

// Bot envia link: "Use este link: https://t.me/+..."
```

---

## 🔄 FLUXO COMPLETO DE ENTRADA NO GRUPO

```
┌─────────────────────────────────────────────────┐
│ 1. ADMIN cria cadastro no dashboard             │
│    - Nome: João Silva                           │
│    - Dias: 30                                   │
│    - Telegram ID: 123456789 (opcional)          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. SISTEMA cria invite link via API Telegram    │
│    POST /createChatInviteLink                   │
│    {                                            │
│      chat_id: -1002414487357,                   │
│      member_limit: 1,                           │
│      expire_date: timestamp                     │
│    }                                            │
│                                                 │
│    RESPOSTA: https://t.me/+AbCdEfGhIjKlMnOp    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. SISTEMA salva link no banco                  │
│    UPDATE members                               │
│    SET invite_link = 'https://t.me/+...'        │
│    WHERE id = 'uuid-do-joao'                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. SISTEMA envia link para João                 │
│    - Email, WhatsApp, Telegram direto           │
│    - João recebe: "Clique aqui: https://..."    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. JOÃO clica no link                           │
│    - Abre Telegram                              │
│    - Mostra preview do grupo                    │
│    - Botão "Entrar no grupo"                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 6. TELEGRAM adiciona João ao grupo              │
│    - Adiciona membro automaticamente            │
│    - Marca link como "usado"                    │
│    - Link expira automaticamente                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 7. TELEGRAM avisa o BOT                         │
│    Envia evento:                                │
│    {                                            │
│      new_chat_members: [{                       │
│        id: 123456789,                           │
│        first_name: "João"                       │
│      }],                                        │
│      invite_link: {                             │
│        invite_link: "https://t.me/+..."         │
│      }                                          │
│    }                                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 8. BOT detecta entrada                          │
│    - Identifica que João entrou                 │
│    - Vê qual link foi usado                     │
│    - Busca no banco quem tinha este link        │
│    - Atualiza: no_grupo = true                  │
│    - Vincula telegram_user_id ao cadastro       │
└─────────────────────────────────────────────────┘
```

---

## 💻 IMPLEMENTAÇÃO ATUAL

### **1. Link Dinâmico (member-service.ts)**

```typescript
// src/services/member-service.ts (linha 172-186)

// Quando cria membro, gera link automático
const linkResult = await createInviteLink(
  input.telegram_user_id,
  new Date(dataVencimento)
);

// Salva link no banco
await supabase
  .from('members')
  .update({
    invite_link: inviteLink,
    invite_link_type: 'unique',
    invite_link_revoked: false,
  })
  .eq('id', member.id);
```

---

### **2. Código Texto (telegram-webhook.ts)**

```typescript
// src/lib/telegram-webhook.ts (linha 445-581)

// Comando /entrar TOKEN
bot.command('entrar', async (ctx) => {
  const args = ctx.message.text.split(' ');
  const token = args[1]?.trim().toUpperCase();

  // Busca membro pelo token
  const { data: member } = await supabase
    .from('members')
    .eq('invite_token', token)
    .single();

  // Verifica se token já foi usado
  if (member.token_usado) {
    await ctx.reply('⚠️ Este código já foi utilizado!');
    return;
  }

  // Gera link na hora
  const inviteLink = await bot.telegram.createChatInviteLink(GROUP_ID, {
    member_limit: 1,
    expire_date: Math.floor(Date.now() / 1000) + 3600 // 1 hora
  });

  // Marca token como usado
  await supabase
    .from('members')
    .update({
      token_usado: true,
      token_usado_em: new Date().toISOString()
    })
    .eq('id', member.id);

  // Envia link
  await ctx.reply(`🔗 Use o link abaixo para entrar:\n${inviteLink.invite_link}`);
});
```

---

### **3. Detecção de Entrada (telegram-webhook.ts)**

```typescript
// src/lib/telegram-webhook.ts (linha 133-292)

bot.on('new_chat_members', async (ctx) => {
  const chatId = ctx.chat.id;

  // Só processar se for um dos grupos monitorados
  if (!GROUP_IDS.includes(chatId)) return;

  const newMembers = ctx.message.new_chat_members;

  for (const member of newMembers) {
    // Ignorar bots
    if (member.is_bot) continue;

    console.log(`Novo membro entrou: ${member.first_name} (${member.id})`);

    // Capturar o link de convite usado
    const inviteLinkUsed = ctx.message.invite_link?.invite_link;

    // Buscar membro pelo telegram_user_id
    let existing = await getMemberByTelegramId(member.id);

    // Se não encontrou por ID, tentar por username
    if (!existing && member.username) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .ilike('telegram_username', member.username)
        .single();
      existing = data;
    }

    // Se não encontrou, tentar pelo invite_link usado
    if (!existing && inviteLinkUsed) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('invite_link', inviteLinkUsed)
        .single();
      existing = data;
    }

    if (existing) {
      // Atualizar dados
      await supabase
        .from('members')
        .update({
          no_grupo: true,
          telegram_user_id: member.id,
          telegram_username: member.username || null,
          telegram_first_name: member.first_name,
          telegram_last_name: member.last_name || null,
        })
        .eq('id', existing.id);

      console.log(`Membro ${member.first_name} atualizado: no_grupo=true`);
    } else {
      // Auto-cadastrar se não existir
      await autoRegisterMember(
        member.id,
        member.first_name,
        member.last_name,
        member.username,
        chatId
      );
    }
  }
});
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### **Tabela atual: members**

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Dados pessoais
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,

  -- Dados do Telegram
  telegram_user_id BIGINT UNIQUE,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,

  -- Invite Link (link gerado para entrar)
  invite_link TEXT,
  invite_link_type TEXT, -- 'unique' ou 'generic'
  invite_link_revoked BOOLEAN DEFAULT FALSE,

  -- Token de convite (código texto)
  invite_token TEXT UNIQUE,
  token_usado BOOLEAN DEFAULT FALSE,
  token_usado_em TIMESTAMP WITH TIME ZONE,

  -- Controle de acesso
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'ativo',
  no_grupo BOOLEAN DEFAULT FALSE,

  -- Notificações
  notificado_7dias BOOLEAN DEFAULT FALSE,
  notificado_3dias BOOLEAN DEFAULT FALSE,
  notificado_1dia BOOLEAN DEFAULT FALSE,

  -- Relacionamentos
  group_id UUID REFERENCES telegram_groups(id),
  plan_id UUID REFERENCES plans(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📡 ESTRUTURA PROPOSTA PARA CÓDIGOS DE CONVITE (VERSÃO FUTURA)

### **Nova Tabela: invite_codes**

```sql
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Código único
  code TEXT UNIQUE NOT NULL, -- ex: "PROMO2024", "ABC123XYZ"

  -- Associação com grupos
  group_id UUID REFERENCES telegram_groups(id),

  -- Validade
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_expiracao TIMESTAMP WITH TIME ZONE, -- NULL = nunca expira

  -- Limites de uso
  usos_maximos INTEGER, -- NULL = ilimitado
  usos_atuais INTEGER DEFAULT 0,

  -- Status
  ativo BOOLEAN DEFAULT TRUE,

  -- Duração da assinatura
  duracao_dias INTEGER DEFAULT 30, -- Quantos dias o membro terá acesso

  -- Metadados
  criado_por TEXT, -- quem criou
  descricao TEXT, -- "Promoção Black Friday", "Convite VIP"
  tipo TEXT DEFAULT 'generico', -- 'generico', 'promocional', 'vip', 'temporario'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para rastrear uso dos códigos
CREATE TABLE invite_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_code_id UUID NOT NULL REFERENCES invite_codes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  telegram_user_id BIGINT,
  usado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 SERVIÇOS E FUNÇÕES PRINCIPAIS

### **Função: createInviteLink**

```typescript
// src/lib/telegram.ts

export async function createInviteLink(userId: number, expiresAt?: Date) {
  try {
    const invite = await bot.telegram.createChatInviteLink(GROUP_ID, {
      member_limit: 1, // Link único para 1 pessoa
      expire_date: expiresAt ? Math.floor(expiresAt.getTime() / 1000) : undefined,
    });

    return {
      success: true,
      link: invite.invite_link,
    };
  } catch (error: any) {
    console.error('Erro ao criar invite link:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

---

### **Função: revokeInviteLink**

```typescript
// src/lib/telegram.ts

export async function revokeInviteLink(inviteLink: string) {
  try {
    await bot.telegram.revokeChatInviteLink(GROUP_ID, inviteLink);

    return {
      success: true,
      message: 'Link revogado com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao revogar link:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

---

### **Função: createMember (com geração de link)**

```typescript
// src/services/member-service.ts

export async function createMember(input: CreateMemberInput) {
  // Criar membro no banco
  const { data, error } = await supabase
    .from('members')
    .insert({
      nome: input.nome,
      email: input.email,
      telefone: input.telefone,
      telegram_user_id: input.telegram_user_id,
      data_vencimento: dataVencimento,
      status: 'ativo',
    })
    .select()
    .single();

  const member = data as Member;

  // Gerar invite link se tiver telegram_user_id
  let inviteLink = null;
  let linkType: 'unique' | 'generic' | null = null;

  if (input.telegram_user_id && dataVencimento) {
    const linkResult = await createInviteLink(
      input.telegram_user_id,
      new Date(dataVencimento)
    );

    if (linkResult.success) {
      inviteLink = linkResult.link;
      linkType = 'unique';
    }
  }

  // Salvar link no membro se foi gerado
  if (inviteLink && linkType) {
    await supabase
      .from('members')
      .update({
        invite_link: inviteLink,
        invite_link_type: linkType,
        invite_link_revoked: false,
      })
      .eq('id', member.id);
  }

  return {
    member,
    inviteLink,
  };
}
```

---

## ✨ RESUMO FINAL

### **Para o sistema de convites funcionar:**

1. ✅ **Gerar link** via API do Telegram (`createChatInviteLink`)
2. ✅ **Armazenar link** no banco vinculado ao cadastro (`invite_link`)
3. ✅ **Enviar link** para a pessoa (email, WhatsApp, etc)
4. ✅ **Bot escuta** evento `new_chat_members` automaticamente
5. ✅ **Bot associa** entrada com cadastro pelo link usado

### **Fluxo atual implementado:**

```
Admin cria cadastro → Sistema gera link único → Armazena no banco
→ Envia link para pessoa → Pessoa clica → Entra no grupo
→ Telegram avisa bot → Bot atualiza cadastro (no_grupo = true)
```

### **Tipos de convite disponíveis:**

1. **Link Único** - Gerado automaticamente ao criar membro
2. **Código Texto** - Via comando `/entrar CODIGO` no bot
3. **Auto-cadastro** - Ao entrar no grupo sem cadastro prévio

---

## 📚 REFERÊNCIAS

- **Telegram Bot API**: https://core.telegram.org/bots/api
- **createChatInviteLink**: https://core.telegram.org/bots/api#createchatinvitelink
- **Telegraf Documentation**: https://telegraf.js.org/

---

**Documento criado em:** 2025-12-03
**Última atualização:** 2025-12-03
**Versão:** 1.0
