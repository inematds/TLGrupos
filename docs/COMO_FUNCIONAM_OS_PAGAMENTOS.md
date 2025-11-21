# 🎯 COMO FUNCIONA CADA PAGAMENTO - EXPLICAÇÃO TÉCNICA

## 📋 FORMAS DE PAGAMENTO

### 1️⃣ **Registro Direto** (Sem Pagamento)
**URL:** `/register`

#### Fluxo:
1. Cliente preenche formulário
2. Sistema cria registro **DIRETO** na tabela `members`
3. Sistema gera link do Telegram
4. Sistema envia email com link

#### Tabelas Atualizadas:

**`members`** (INSERT):
```sql
INSERT INTO members (
  nome,
  email,
  telefone,
  telegram_username,
  plan_id,              -- ID do plano selecionado
  data_vencimento,      -- hoje + plan.duracao_dias
  observacoes,
  created_at
) VALUES (...)
```

**`logs`** (INSERT):
```sql
INSERT INTO logs (
  member_id,
  acao,                 -- 'membro_criado'
  detalhes,
  executado_por         -- 'sistema'
) VALUES (...)
```

**Resultado:** Cliente cadastrado IMEDIATAMENTE, sem validação.

---

### 2️⃣ **PIX com Upload**
**URL:** `/register-pix-upload`

#### Fluxo:

**PASSO 1 - Cliente Preenche (Step: dados → pagamento)**
- Cliente preenche formulário
- Sistema gera QR Code PIX
- Cliente vê dados de pagamento
- NADA é salvo ainda no banco

**PASSO 2 - Cliente Clica "Já Fiz Pagamento" (Step: pagamento → upload)**
```sql
-- API: POST /api/cadastro-pendente
INSERT INTO cadastros_pendentes (
  id,                   -- UUID gerado
  nome,
  email,
  telefone,
  telegram_username,
  plan_id,              -- UUID do plano
  plano_dias,           -- Buscado do plan
  valor_pago,           -- plan.valor
  metodo_pagamento,     -- 'pix'
  status,               -- 'aguardando_pagamento'
  qr_code_pix,          -- Base64 do QR Code
  created_at,
  expira_em             -- NOW() + 24 horas
) VALUES (...)
```

**PASSO 3 - Cliente Faz Upload (Step: upload → aguardando)**
```sql
-- API: POST /api/enviar-comprovante
UPDATE cadastros_pendentes SET
  comprovante_url = 'https://...supabase.co/storage/comprovantes/xxx.jpg',
  comprovante_enviado_em = NOW(),
  status = 'comprovante_enviado'
WHERE id = cadastro_id
```

#### Tabelas Atualizadas:

**`cadastros_pendentes`:**
- INSERT no passo 2 (status: `aguardando_pagamento`)
- UPDATE no passo 3 (status: `comprovante_enviado`)

**Arquivo salvo:**
- **Supabase Storage** → Bucket: `comprovantes`
- Arquivo: `{cadastro_id}_{timestamp}.{ext}`

**Resultado:** Cadastro criado em `cadastros_pendentes`, aguardando SUA validação.

---

### 3️⃣ **PIX com Email**
**URL:** `/register-pix-email`

#### Fluxo:

**PASSO 1 - Cliente Preenche (Step: dados → pagamento)**
- Cliente preenche formulário
- Sistema gera QR Code PIX
- Cliente vê dados de pagamento
- NADA é salvo ainda no banco

**PASSO 2 - Cliente Clica "Já Fiz Pagamento" (Step: pagamento → aguardando)**
```sql
-- API: POST /api/cadastro-pendente
INSERT INTO cadastros_pendentes (
  id,                   -- UUID gerado (ex: abc-123)
  nome,
  email,
  telefone,
  telegram_username,
  plan_id,              -- UUID do plano
  plano_dias,           -- Buscado do plan
  valor_pago,           -- plan.valor
  metodo_pagamento,     -- 'pix'
  status,               -- 'aguardando_pagamento'
  qr_code_pix,          -- Base64 do QR Code
  created_at,
  expira_em             -- NOW() + 24 horas
) VALUES (...)
```

**PASSO 3 - Cliente Envia Email Manualmente**
- Cliente envia email para: `comprovantes@tlgrupos.com`
- Código de referência: Primeiros 8 caracteres do `id`
- Você recebe email manualmente
- **NENHUMA atualização automática no banco**

#### Tabelas Atualizadas:

**`cadastros_pendentes`:**
- INSERT no passo 2 (status: `aguardando_pagamento`)
- **Sem UPDATE automático** (você precisa processar manualmente)

**Resultado:** Cadastro criado em `cadastros_pendentes`, aguardando email E SUA validação manual.

---

## ✅ VALIDAÇÃO (Para PIX Upload e PIX Email)

### Admin Acessa: `/dashboard/validar-pagamentos`

```sql
-- API: GET /api/cadastro-pendente?status=comprovante_enviado
SELECT * FROM cadastros_pendentes
WHERE status = 'comprovante_enviado'  -- Apenas os que enviaram comprovante
ORDER BY created_at DESC
```

**Mostra:**
- Nome, email, valor
- Botão "Ver Comprovante" (abre `comprovante_url`)
- Botão "Aprovar" / "Reprovar"

---

### ✅ APROVAR PAGAMENTO

**API:** `POST /api/validar-pagamento`

**Body:**
```json
{
  "cadastro_id": "abc-123",
  "aprovado": true
}
```

#### Operações no Banco:

**1. Buscar Cadastro:**
```sql
SELECT * FROM cadastros_pendentes
WHERE id = 'abc-123'
AND status = 'comprovante_enviado'
```

**2. Criar Membro:**
```sql
-- Via createMember()
INSERT INTO members (
  nome,                 -- Do cadastro
  email,                -- Do cadastro
  telefone,             -- Do cadastro
  telegram_username,    -- Do cadastro
  plan_id,              -- Do cadastro
  data_vencimento,      -- hoje + plano_dias
  observacoes,          -- 'Cadastro via PIX Upload - Cadastro ID: abc-123'
  created_at
) VALUES (...)
RETURNING id, ...
```

**3. Gerar Link do Telegram:**
```sql
-- Chamada à API do Telegram (não salva no banco ainda)
-- bot.telegram.createChatInviteLink(GROUP_ID, { member_limit: 1 })
-- Retorna: https://t.me/+xxxxxxx
```

**4. Atualizar Cadastro Pendente:**
```sql
UPDATE cadastros_pendentes SET
  status = 'pago',
  validado_por = 'admin',
  validado_em = NOW(),
  link_enviado = true,
  invite_link = 'https://t.me/+xxxxxxx'
WHERE id = 'abc-123'
```

**5. Registrar Log:**
```sql
INSERT INTO logs (
  member_id,            -- ID do member criado
  acao,                 -- 'pagamento_aprovado'
  detalhes,             -- { cadastro_id, valor_pago, metodo: 'pix_upload' }
  executado_por         -- 'admin'
) VALUES (...)
```

**6. Enviar Email (via Resend):**
- API: `POST /api/enviar-email-acesso`
- Não salva no banco diretamente
- `email-service.ts` salva em `emails_enviados`:

```sql
INSERT INTO emails_enviados (
  destinatario,         -- email do cliente
  assunto,              -- '🎉 Acesso Liberado - Grupo VIP Telegram'
  tipo,                 -- 'invite_link'
  status                -- 'enviado' ou 'erro'
) VALUES (...)
```

#### Tabelas Finais (APROVAÇÃO):

| Tabela | Operação | Campos Atualizados |
|--------|----------|-------------------|
| `cadastros_pendentes` | UPDATE | `status='pago'`, `validado_por`, `validado_em`, `link_enviado=true`, `invite_link` |
| `members` | INSERT | Todos os campos do novo membro |
| `logs` | INSERT | `acao='pagamento_aprovado'` |
| `emails_enviados` | INSERT | `tipo='invite_link'`, `status='enviado'` |

---

### ❌ REPROVAR PAGAMENTO

**API:** `POST /api/validar-pagamento`

**Body:**
```json
{
  "cadastro_id": "abc-123",
  "aprovado": false,
  "motivo_reprovacao": "Comprovante ilegível"
}
```

#### Operações no Banco:

**1. Atualizar Cadastro Pendente:**
```sql
UPDATE cadastros_pendentes SET
  status = 'cancelado',
  validado_por = 'admin',
  validado_em = NOW()
WHERE id = 'abc-123'
```

**2. Registrar Log:**
```sql
INSERT INTO logs (
  acao,                 -- 'pagamento_reprovado'
  detalhes,             -- { cadastro_id, motivo }
  executado_por         -- 'admin'
) VALUES (...)
```

**3. Enviar Email de Reprovação:**
```sql
INSERT INTO emails_enviados (
  destinatario,
  assunto,              -- '❌ Comprovante de Pagamento Não Aprovado'
  tipo,                 -- 'rejection'
  status                -- 'enviado' ou 'erro'
) VALUES (...)
```

#### Tabelas Finais (REPROVAÇÃO):

| Tabela | Operação | Campos Atualizados |
|--------|----------|-------------------|
| `cadastros_pendentes` | UPDATE | `status='cancelado'`, `validado_por`, `validado_em` |
| `logs` | INSERT | `acao='pagamento_reprovado'` |
| `emails_enviados` | INSERT | `tipo='rejection'`, `status='enviado'` |
| `members` | **NADA** | Não cria membro |

---

## 📊 RESUMO COMPARATIVO

| Ação | Registro Direto | PIX Upload | PIX Email |
|------|----------------|------------|-----------|
| **Preenche formulário** | ✅ Cria `members` | ❌ Não cria nada | ❌ Não cria nada |
| **Vê QR Code** | ❌ Não tem | ✅ Sim | ✅ Sim |
| **"Já fiz pagamento"** | ❌ Não tem | ✅ Cria `cadastros_pendentes` | ✅ Cria `cadastros_pendentes` |
| **Envia comprovante** | ❌ Não tem | ✅ Upload → Storage + UPDATE | ❌ Email manual (sem UPDATE) |
| **Você valida** | ❌ Não precisa | ✅ Sim | ✅ Sim |
| **Aprovação cria** | - | ✅ `members` + email | ✅ `members` + email |
| **Reprovação cria** | - | ❌ Só UPDATE status | ❌ Só UPDATE status |

---

## 🗄️ ESTRUTURA DAS TABELAS

### `cadastros_pendentes`
```sql
id                      UUID PRIMARY KEY
nome                    TEXT
email                   TEXT
telefone                TEXT
telegram_username       TEXT
plan_id                 UUID (FK → plans)
plano_dias              INTEGER
valor_pago              DECIMAL
metodo_pagamento        TEXT ('pix', 'cartao')
status                  TEXT ('aguardando_pagamento', 'comprovante_enviado', 'pago', 'cancelado')
comprovante_url         TEXT (URL do Supabase Storage)
comprovante_enviado_em  TIMESTAMP
validado_por            TEXT ('admin')
validado_em             TIMESTAMP
link_enviado            BOOLEAN
invite_link             TEXT
qr_code_pix             TEXT
created_at              TIMESTAMP
expira_em               TIMESTAMP (created_at + 24h)
```

### `members`
```sql
id                      UUID PRIMARY KEY
nome                    TEXT
email                   TEXT
telefone                TEXT
telegram_username       TEXT
telegram_user_id        BIGINT (preenchido quando entra no grupo)
plan_id                 UUID (FK → plans)
data_vencimento         TIMESTAMP
invite_link             TEXT
no_grupo                BOOLEAN
observacoes             TEXT
created_at              TIMESTAMP
```

### `logs`
```sql
id                      UUID PRIMARY KEY
member_id               UUID (FK → members, NULLABLE)
acao                    TEXT ('pagamento_aprovado', 'pagamento_reprovado', 'membro_criado')
detalhes                JSONB
executado_por           TEXT ('admin', 'sistema')
created_at              TIMESTAMP
```

### `emails_enviados`
```sql
id                      UUID PRIMARY KEY
destinatario            TEXT
assunto                 TEXT
tipo                    TEXT ('invite_link', 'rejection')
status                  TEXT ('enviado', 'erro')
created_at              TIMESTAMP
```

---

## 🎯 FLUXO VISUAL

```
REGISTRO DIRETO:
Formulário → members → Email → FIM

PIX UPLOAD:
Formulário → QR Code → "Já paguei" → cadastros_pendentes (aguardando)
         → Upload → cadastros_pendentes (comprovante_enviado)
         → Você Aprova → members + emails_enviados + logs → Email → FIM

PIX EMAIL:
Formulário → QR Code → "Já paguei" → cadastros_pendentes (aguardando)
         → Cliente envia email manualmente (sem UPDATE automático)
         → Você Aprova → members + emails_enviados + logs → Email → FIM
```

---

## 📍 ARQUIVOS IMPORTANTES

### APIs:
- `/api/cadastro-pendente` - Criar cadastro pendente (POST)
- `/api/cadastro-pendente?status=xxx` - Listar cadastros (GET)
- `/api/enviar-comprovante` - Upload de arquivo (POST)
- `/api/validar-pagamento` - Aprovar/Reprovar (POST)
- `/api/enviar-email-acesso` - Enviar link de acesso (POST)
- `/api/enviar-email-reprovacao` - Enviar email de reprovação (POST)

### Páginas:
- `/register` - Registro direto (verde)
- `/register-pix-upload` - PIX com upload (amarelo)
- `/register-pix-email` - PIX com email (azul)
- `/dashboard/validar-pagamentos` - Validação admin
- `/dashboard/cadastros` - Histórico completo

### Serviços:
- `src/services/member-service.ts` - Criar membros
- `src/services/email-service.ts` - Enviar emails
- `src/lib/telegram.ts` - Gerar links do Telegram

---

## 🔑 VARIÁVEIS DE AMBIENTE

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xetowlvhhnxewvglxklo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Telegram Bot
TELEGRAM_BOT_TOKEN=xxxxx
TELEGRAM_GROUP_ID=-1002414487357

# Email (Resend)
RESEND_API_KEY=re_42VrdCj2_NY3ZZ1u1goDaawgTLjPJVrV9
EMAIL_FROM=onboarding@resend.dev

# App
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3020
```

---

## ❓ FAQ

**P: Por que PIX Email não atualiza automaticamente?**
R: Porque o cliente envia por email comum, não há webhook configurado. Você precisa processar manualmente.

**P: Como processar email manualmente no PIX Email?**
R: Quando receber email:
1. Veja o código (8 primeiros dígitos do cadastro_id)
2. Baixe o comprovante
3. Acesse `/dashboard/validar-pagamentos`
4. Você NÃO verá o cadastro (status ainda é `aguardando_pagamento`)
5. Opção 1: Faça upload manual do comprovante
6. Opção 2: Use `/dashboard/cadastros` para ver TODOS os cadastros

**P: Onde ficam os comprovantes?**
R: Supabase Storage, bucket `comprovantes`

**P: Posso aprovar sem comprovante?**
R: Tecnicamente sim, se você alterar o status manualmente no banco. Mas não é recomendado.

**P: O que acontece se o cliente não enviar comprovante?**
R: O cadastro fica em `aguardando_pagamento` por 24h e depois expira (`status='expirado'`).

---

## 🚀 PRÓXIMOS PASSOS

Para automatizar PIX Email, seria necessário:
1. Configurar Resend Inbound Email
2. Criar webhook `/api/webhook/email-comprovante`
3. Processar anexos automaticamente
4. Fazer upload no Storage
5. Atualizar status para `comprovante_enviado`

Mas por enquanto, o **PIX com Upload** já funciona perfeitamente! 🎯
