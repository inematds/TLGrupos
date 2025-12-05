# 📊 TLGrupos - Sistema Atual Completo

**Data de Análise:** 2025-12-03
**Versão:** Estado Atual

---

## 🎯 VISÃO GERAL

O **TLGrupos** é um sistema completo para gerenciar membros de grupos Telegram com controle de acesso por tempo, pagamentos, notificações automáticas e remoção de membros vencidos.

---

## 🏗️ ARQUITETURA ATUAL

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                   │
│                                                         │
│  Dashboard → Membros → Pagamentos → Planos → Grupos   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API ROUTES (42 endpoints)             │
│                                                         │
│  /api/members     /api/payments    /api/plans          │
│  /api/cron/*      /api/telegram/*  /api/grupos         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   SERVICES (Lógica de Negócio)          │
│                                                         │
│  member-service.ts   │  cron-service.ts                │
│  notification-service.ts                                │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴──────────┐
         ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│  SUPABASE       │    │  TELEGRAM BOT    │
│  PostgreSQL     │    │  API             │
│                 │    │                  │
│  20 Migrations  │    │  Webhooks        │
│  10+ Tabelas    │    │  Commands        │
└─────────────────┘    └──────────────────┘
```

---

## 📦 COMPONENTES PRINCIPAIS

### **1. BANCO DE DADOS (Supabase PostgreSQL)**

#### **Tabelas Principais:**

```sql
✅ members                  -- Membros cadastrados
✅ telegram_groups          -- Grupos Telegram gerenciados
✅ member_groups            -- Relacionamento membros ↔ grupos
✅ plans                    -- Planos de assinatura
✅ payments                 -- Pagamentos registrados
✅ forma_pagamentos         -- Formas de pagamento
✅ cadastros_pendentes      -- Cadastros aguardando aprovação
✅ logs                     -- Auditoria de todas ações
✅ config                   -- Configurações do sistema
✅ invites                  -- Convites gerados
```

#### **Tabela `members` (Principal):**

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY,

  -- Dados Pessoais
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cidade TEXT,
  uf TEXT,
  data_nascimento TIMESTAMP,
  nicho TEXT,
  interesse TEXT,
  grupo_favorito TEXT,

  -- Dados do Telegram
  telegram_user_id BIGINT UNIQUE,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,

  -- Links de Convite
  invite_link TEXT,              -- Link gerado para entrar
  invite_link_type TEXT,         -- 'unique' ou 'generic'
  invite_link_revoked BOOLEAN,   -- Se foi revogado

  -- Token de Convite (código texto)
  invite_token TEXT UNIQUE,      -- Ex: "ABC123XYZ"
  token_usado BOOLEAN,           -- Se já foi usado
  token_usado_em TIMESTAMP,      -- Quando foi usado

  -- Controle de Acesso
  data_entrada TIMESTAMP DEFAULT NOW(),
  data_vencimento TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'ativo',   -- 'ativo', 'removido', 'pausado', 'erro_remocao'
  no_grupo BOOLEAN DEFAULT FALSE,

  -- Notificações
  notificado_7dias BOOLEAN DEFAULT FALSE,
  notificado_3dias BOOLEAN DEFAULT FALSE,
  notificado_1dia BOOLEAN DEFAULT FALSE,

  -- Relacionamentos
  group_id UUID REFERENCES telegram_groups(id),
  plan_id UUID REFERENCES plans(id),

  -- Metadados
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Migrações Aplicadas (20 total):**

```
001 - Schema inicial (members, logs, config)
002 - Telegram user ID nullable
003 - Sistema de tokens de convite
004 - Sistema de pagamentos
005 - Sistema de comprovantes
006 - Status erro_remocao
007 - Remover status 'vencido' (calculado dinamicamente)
008 - Estatísticas sem telegram
009 - Tabela de convites
010 - Coluna no_grupo
011 - Tabela de planos
012 - plan_id nos members
013 - Tracking de invite_link
014 - plan_id em cadastros_pendentes
015 - Formas de pagamento
016 - Grupos Telegram (múltiplos)
017 - Relacionamento member_groups
018 - Campos de perfil do usuário
019 - Campos de perfil em cadastros
020 - Tabela payments completa
```

---

### **2. BOT TELEGRAM**

#### **Arquivo:** `src/lib/telegram-webhook.ts`

#### **Eventos Detectados:**

```typescript
✅ new_chat_members    -- Alguém entra no grupo
✅ left_chat_member    -- Alguém sai do grupo
✅ message('text')     -- Mensagens no grupo (auto-registro)
```

#### **Comandos Disponíveis:**

```
/cadastro          -- Link para formulário completo
/registrar         -- Cadastro rápido automático
/entrar TOKEN      -- Usar código de acesso
/status            -- Ver informações do cadastro
```

#### **Fluxo: Entrada no Grupo**

```
┌─────────────────────────────────────────────┐
│ 1. PESSOA clica no link de convite         │
│    https://t.me/+ABC123XYZ                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. TELEGRAM adiciona ao grupo               │
│    - Pessoa entra automaticamente           │
│    - Link expira (se member_limit: 1)       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. TELEGRAM envia evento ao bot             │
│    new_chat_members: [{                     │
│      id: 123456789,                         │
│      first_name: "João"                     │
│    }]                                       │
│    invite_link: "https://t.me/+ABC123"      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. BOT processa entrada                     │
│    - Busca por telegram_user_id             │
│    - Se não achar, busca por username       │
│    - Se não achar, busca por invite_link    │
│    - Atualiza: no_grupo = true              │
│    - Vincula telegram_user_id               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. SE NÃO ENCONTRAR: Auto-cadastra          │
│    - Cria membro no banco                   │
│    - data_vencimento = NOW() + 30 dias      │
│    - status = 'ativo'                       │
│    - Envia mensagem de boas-vindas          │
└─────────────────────────────────────────────┘
```

#### **Fluxo: Comando /entrar TOKEN**

```
┌─────────────────────────────────────────────┐
│ 1. USUÁRIO envia: /entrar ABC123XYZ         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. BOT valida token                         │
│    - Busca por invite_token = 'ABC123XYZ'   │
│    - Verifica se já foi usado               │
│    - Verifica se está vencido               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. BOT gera link único                      │
│    createChatInviteLink({                   │
│      member_limit: 1,                       │
│      expire_date: now + 1 hour              │
│    })                                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. BOT atualiza cadastro                    │
│    - token_usado = true                     │
│    - token_usado_em = NOW()                 │
│    - telegram_user_id = user.id             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. BOT envia link para usuário              │
│    "Use o link abaixo para entrar..."       │
│    https://t.me/+NEWLINK123                 │
└─────────────────────────────────────────────┘
```

---

### **3. SISTEMA DE REMOÇÃO AUTOMÁTICA**

#### **Arquivo:** `src/services/cron-service.ts`

#### **Função:** `removeExpiredMembers()`

```typescript
// Busca membros ATIVOS com data vencida
SELECT * FROM members
WHERE status = 'ativo'
  AND data_vencimento < NOW()

// Para cada membro vencido:
1. Remove do Telegram (banChatMember + unbanChatMember)
2. Atualiza status = 'removido' (se sucesso)
3. OU status = 'erro_remocao' (se falhar)
4. Registra log da ação
```

#### **Endpoint Cron:**

```
POST /api/cron/remove-expired
Authorization: Bearer {CRON_SECRET}

Executado por: Cron job externo ou manualmente
```

#### **Como está sendo executado:**

```bash
# Via npm script
npm run cron:check-expired

# Ou via curl (de outro serviço)
curl -X POST http://localhost:3000/api/cron/remove-expired \
  -H "Authorization: Bearer {CRON_SECRET}"
```

---

### **4. SISTEMA DE NOTIFICAÇÕES**

#### **Arquivo:** `src/services/notification-service.ts`

#### **Função:** Enviar notificações antes do vencimento

```typescript
// Busca membros que vencem em X dias
SELECT * FROM members
WHERE status = 'ativo'
  AND data_vencimento BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND notificado_7dias = FALSE

// Envia mensagem via Telegram
bot.telegram.sendMessage(telegram_user_id, mensagem)

// Marca como notificado
UPDATE members SET notificado_7dias = TRUE
```

#### **Notificações Configuradas:**

```
✅ 7 dias antes do vencimento
✅ 3 dias antes do vencimento
✅ 1 dia antes do vencimento
```

#### **Endpoint Cron:**

```
POST /api/cron/send-notifications
Authorization: Bearer {CRON_SECRET}
```

---

### **5. FLUXOS PRINCIPAIS**

#### **FLUXO A: Cadastro Manual via Dashboard**

```
1. Admin acessa /dashboard/members
2. Clica "Adicionar Membro"
3. Preenche formulário:
   - Nome, email, telefone
   - Telegram ID (opcional)
   - Data vencimento OU Plano
4. Sistema cria membro no banco
5. SE tiver telegram_user_id:
   - Gera invite_link único
   - member_limit: 1
   - expire_date: data_vencimento
   - Salva link no banco
6. Admin envia link para pessoa (WhatsApp, Email, etc)
7. Pessoa clica → entra no grupo
8. Bot detecta → vincula telegram_user_id
```

---

#### **FLUXO B: Auto-Cadastro via Bot**

```
1. Pessoa entra no grupo (via link genérico ou outro)
2. Bot recebe evento new_chat_members
3. Bot busca membro no banco
4. SE NÃO ENCONTRAR:
   - Cria cadastro automático
   - data_vencimento = NOW() + 30 dias
   - status = 'ativo'
   - no_grupo = true
5. Envia mensagem de boas-vindas
```

---

#### **FLUXO C: Cadastro via Token/Código**

```
1. Admin cria membro e gera invite_token
2. Admin compartilha código (ex: "ABC123XYZ")
3. Pessoa envia no bot: /entrar ABC123XYZ
4. Bot valida token:
   - Existe?
   - Já foi usado?
   - Está vencido?
5. Bot gera link único temporário (1 hora)
6. Bot envia link para pessoa
7. Pessoa clica → entra no grupo
8. Bot detecta → marca token como usado
```

---

#### **FLUXO D: Remoção Automática**

```
┌─────────────────────────────────────────────┐
│ HOJE: 2025-12-03 10:00                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ CRON JOB executa (diariamente)              │
│ POST /api/cron/remove-expired               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ BUSCA membros vencidos                      │
│ SELECT * FROM members                       │
│ WHERE status = 'ativo'                      │
│   AND data_vencimento < '2025-12-03'        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ PARA CADA membro vencido:                   │
│                                             │
│ 1. bot.telegram.banChatMember(user_id)      │
│ 2. bot.telegram.unbanChatMember(user_id)    │
│    (permite entrar novamente se renovar)    │
│                                             │
│ 3. UPDATE members                           │
│    SET status = 'removido'                  │
│    WHERE id = member_id                     │
│                                             │
│ 4. INSERT INTO logs (...)                   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ SE ERRO ao remover:                         │
│                                             │
│ UPDATE members                              │
│ SET status = 'erro_remocao'                 │
│ SET observacoes = 'Erro: ...'               │
└─────────────────────────────────────────────┘
```

---

#### **FLUXO E: Cadastro com Pagamento**

```
1. Pessoa acessa /cadastro
2. Preenche formulário completo
3. Seleciona plano
4. Sistema gera QR Code PIX
5. Pessoa paga
6. Admin valida pagamento manualmente
7. Sistema:
   - Cria membro no banco
   - Gera invite_link
   - Envia email com link
8. Pessoa clica → entra no grupo
```

---

## 📊 PÁGINAS DO DASHBOARD

```
✅ /dashboard                    -- Visão geral + estatísticas
✅ /dashboard/members            -- Lista de membros
✅ /dashboard/new                -- Adicionar membro
✅ /dashboard/cadastros          -- Cadastros pendentes
✅ /dashboard/planos             -- Gerenciar planos
✅ /dashboard/pagamentos-*       -- Sistema de pagamentos
✅ /dashboard/grupos             -- Gerenciar grupos
✅ /dashboard/convites           -- Gerenciar convites
✅ /dashboard/auto-removal       -- Config remoção automática
✅ /dashboard/notifications      -- Config notificações
✅ /dashboard/stats              -- Estatísticas detalhadas
✅ /dashboard/sync               -- Sincronizar membros
✅ /dashboard/bot                -- Status do bot
```

---

## 🔌 API ENDPOINTS (42 total)

### **Membros:**
```
GET    /api/members              -- Listar membros
POST   /api/members              -- Criar membro
GET    /api/members/[id]         -- Buscar membro
PUT    /api/members/[id]         -- Atualizar membro
DELETE /api/members/[id]         -- Deletar membro
POST   /api/members/[id]/renew   -- Renovar assinatura
```

### **Cron Jobs:**
```
POST   /api/cron/remove-expired        -- Remover vencidos
POST   /api/cron/send-notifications    -- Enviar notificações
```

### **Telegram:**
```
POST   /api/telegram/invite-link       -- Gerar invite link
POST   /api/telegram/remove-member     -- Remover do grupo
```

### **Pagamentos:**
```
GET    /api/payments               -- Listar pagamentos
POST   /api/payments               -- Criar pagamento
POST   /api/gerar-pix              -- Gerar QR Code PIX
POST   /api/validar-pagamento      -- Validar pagamento
POST   /api/processar-pagamentos   -- Processar pendentes
```

### **Planos:**
```
GET    /api/plans                 -- Listar planos
POST   /api/plans                 -- Criar plano
PUT    /api/plans/[id]            -- Atualizar plano
DELETE /api/plans/[id]            -- Deletar plano
```

### **Grupos:**
```
GET    /api/grupos                -- Listar grupos
GET    /api/telegram-groups       -- Info dos grupos
```

### **Outros:**
```
GET    /api/stats                 -- Estatísticas gerais
POST   /api/cadastro              -- Cadastro público
POST   /api/sync                  -- Sincronizar dados
POST   /api/webhook               -- Webhook Telegram
```

---

## ⚙️ SCRIPTS NPM

```bash
# Desenvolvimento
npm run dev                    # Inicia servidor (porta 3000)
npm run build                  # Build de produção
npm run start                  # Inicia produção

# Cron Jobs
npm run cron:check-expired     # Remove membros vencidos
npm run cron:send-notifications # Envia notificações
npm run cron:process-payments  # Processa pagamentos

# Bot Telegram
npm run start:bot              # Inicia bot (polling)
npm run setup:bot              # Configura bot

# Sincronização
npm run sync:members           # Sincroniza membros do Telegram
npm run get-group-id           -- Pega ID do grupo
npm run get-updates            -- Ver atualizações do bot
```

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### ✅ **Gerenciamento de Membros**
- Adicionar membro manual
- Editar dados do membro
- Renovar assinatura
- Remover membro
- Ver histórico (logs)
- Filtros por status

### ✅ **Controle de Acesso**
- Data de vencimento
- Remoção automática quando vence
- Status: ativo, removido, pausado, erro_remocao
- Flag `no_grupo` (está no grupo ou não)

### ✅ **Links de Convite**
- Gerar link único (member_limit: 1)
- Gerar link genérico (ilimitado)
- Expiração automática
- Rastreamento de uso
- Revogar links

### ✅ **Códigos de Acesso (Tokens)**
- Gerar token texto (ex: ABC123XYZ)
- Comando /entrar TOKEN no bot
- Validação de uso único
- Verificação de expiração

### ✅ **Sistema de Pagamentos**
- Gerar QR Code PIX
- Validar pagamentos
- Vincular pagamento → membro
- Estatísticas financeiras

### ✅ **Planos de Assinatura**
- Criar planos personalizados
- Durações diferentes
- Preços diferentes
- Vincular membro → plano

### ✅ **Bot Telegram**
- Auto-cadastro ao entrar
- Comando /cadastro
- Comando /registrar
- Comando /entrar TOKEN
- Comando /status
- Detectar entradas/saídas

### ✅ **Notificações**
- 7 dias antes
- 3 dias antes
- 1 dia antes
- Via Telegram direto

### ✅ **Múltiplos Grupos**
- Suporte a vários grupos
- Tabela telegram_groups
- Relacionamento member_groups

### ✅ **Logs e Auditoria**
- Todas ações registradas
- Quem fez, quando, o quê
- Histórico completo

### ✅ **Dashboard Web**
- Estatísticas em tempo real
- Gráficos e indicadores
- Filtros avançados
- Interface responsiva

---

## 🔴 O QUE FALTA / PODE MELHORAR

### **Sistema de Códigos Promocionais**
```
❌ Não implementado ainda

Faltaria:
- Tabela invite_codes
- Códigos com múltiplos usos
- Códigos promocionais
- Descontos por código
- Estatísticas de uso por código
```

### **Automação Completa de Cron**
```
⚠️ Parcialmente implementado

Tem:
- Scripts cron prontos
- Endpoints /api/cron/*

Falta:
- Cron job configurado (precisa configurar externamente)
- Exemplos: crontab, Vercel Cron, GitHub Actions
```

### **Webhook do Telegram**
```
⚠️ Bot usa polling, não webhook

Atual: bot.launch() (polling)
Ideal: Webhook (mais eficiente em produção)
```

### **Testes Automatizados**
```
❌ Sem testes

Faltaria:
- Testes unitários
- Testes de integração
- Testes E2E
```

### **Documentação de API**
```
⚠️ Documentação parcial

Tem: README básico
Falta: Swagger/OpenAPI, exemplos de uso
```

---

## 🚀 FLUXO COMPLETO: Do Cadastro à Remoção

```
DIA 0 - Cadastro
├─ Admin cria membro no dashboard
├─ Sistema gera invite_link único
├─ Admin envia link para João
└─ João clica e entra no grupo
    └─ Bot detecta e vincula telegram_user_id

DIA 7 - Primeira Notificação
└─ Cron roda: send-notifications
    └─ João recebe: "Seu acesso vence em 23 dias"

DIA 23 - Segunda Notificação
└─ Cron roda: send-notifications
    └─ João recebe: "Seu acesso vence em 7 dias"

DIA 27 - Terceira Notificação
└─ Cron roda: send-notifications
    └─ João recebe: "Seu acesso vence em 3 dias"

DIA 29 - Quarta Notificação
└─ Cron roda: send-notifications
    └─ João recebe: "Seu acesso vence em 1 dia"

DIA 30 - Vencimento
└─ Cron roda: remove-expired
    ├─ Sistema remove João do grupo
    ├─ Status = 'removido'
    └─ João não consegue mais ver mensagens

DIA 31+ - Renovação (se pagar)
└─ João paga novamente
    ├─ Admin aprova pagamento
    ├─ Sistema gera novo invite_link
    ├─ João entra de novo
    └─ Nova data_vencimento = HOJE + 30 dias
```

---

## 📝 RESUMO EXECUTIVO

### **O sistema TEM:**

✅ Gerenciamento completo de membros
✅ Controle de vencimento e remoção automática
✅ Bot Telegram funcional com comandos
✅ Sistema de pagamentos e planos
✅ Notificações automáticas
✅ Dashboard web completo
✅ API REST completa (42 endpoints)
✅ Logs e auditoria
✅ Suporte a múltiplos grupos
✅ Links únicos e tokens de acesso

### **O sistema NÃO TEM:**

❌ Sistema avançado de códigos promocionais
❌ Cron jobs configurados automaticamente
❌ Webhook do Telegram (usa polling)
❌ Testes automatizados
❌ Documentação de API (Swagger)
❌ Relatórios avançados

### **Ponto Crítico:**

⚠️ **Cron jobs precisam ser executados manualmente ou configurados externamente**

Atualmente você precisa:
- Executar `npm run cron:check-expired` manualmente OU
- Configurar crontab no servidor OU
- Usar serviço externo (GitHub Actions, Vercel Cron, etc)

---

## 🎯 PRÓXIMOS PASSOS SUGERIDOS

1. **Implementar sistema de códigos promocionais** (conforme discutido)
2. **Configurar cron jobs automáticos** (crontab ou serviço)
3. **Migrar para webhook do Telegram** (mais eficiente)
4. **Adicionar testes automatizados**
5. **Documentar API com Swagger**

---

**Documento criado em:** 2025-12-03
**Analisado por:** Claude Code
**Status:** ✅ Sistema funcional e completo
