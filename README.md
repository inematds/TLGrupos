# 🤖 TLGrupos - Sistema de Gerenciamento de Membros Telegram

Sistema completo para gerenciar membros de grupos privados do Telegram com controle automático de vencimento, notificações e interface web.

## 📋 Funcionalidades

- ✅ **Gerenciamento de Membros**: Adicionar, remover e atualizar membros
- ✅ **Controle de Vencimento**: Data de expiração para cada membro
- ✅ **Automação Completa**:
  - Remoção automática de membros vencidos
  - Notificações 7, 3 e 1 dia antes do vencimento
- ✅ **Interface Web**: Dashboard para visualização e gerenciamento
- ✅ **API REST**: Endpoints completos para todas as operações
- ✅ **Logs e Auditoria**: Registro de todas as ações
- ✅ **Estatísticas**: Visualização de membros ativos, vencidos, etc.

## 🏗️ Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Next.js    │────▶│  Supabase   │
│  Dashboard  │     │   API Routes │     │  PostgreSQL │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Telegram    │
                    │  Bot API     │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Grupo      │
                    │   Telegram   │
                    └──────────────┘
```

## 🚀 Instalação

### 1. Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Bot do Telegram criado via @BotFather

### 2. Clone e instale dependências

```bash
git clone <seu-repositorio>
cd TLGrupos
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_GROUP_ID=-1001234567890

# Cron Secret
CRON_SECRET=gere-uma-chave-aleatoria-aqui

# Environment
NODE_ENV=development
```

### 4. Configure o Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Execute a migration SQL:

```bash
# Copie o conteúdo de supabase/migrations/001_initial_schema.sql
# Cole no SQL Editor do Supabase Dashboard e execute
```

### 5. Configure o Bot Telegram

#### Criar o Bot

1. Abra o Telegram e procure por `@BotFather`
2. Envie `/newbot`
3. Siga as instruções e copie o token fornecido
4. Cole o token em `TELEGRAM_BOT_TOKEN` no `.env.local`

#### Obter o ID do Grupo

1. Adicione o bot `@RawDataBot` ao seu grupo
2. Ele enviará as informações do grupo, incluindo o `chat_id`
3. Remova o `@RawDataBot` do grupo
4. Cole o `chat_id` em `TELEGRAM_GROUP_ID` no `.env.local`

#### Adicionar o Bot como Admin

1. Adicione seu bot ao grupo
2. Vá em configurações do grupo > Administradores
3. Adicione o bot como administrador
4. Dê as permissões:
   - ✅ Adicionar usuários
   - ✅ Banir usuários

#### Verificar Configuração

```bash
npm run setup:bot
```

Este script verificará se tudo está configurado corretamente.

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📡 API Endpoints

### Membros

```bash
# Listar membros
GET /api/members?status=ativo&limit=10

# Buscar membro específico
GET /api/members/:id

# Criar membro
POST /api/members
{
  "nome": "João Silva",
  "telegram_username": "joaosilva",
  "telegram_user_id": 123456789,
  "data_vencimento": "2025-12-31",
  "email": "joao@example.com"
}

# Atualizar membro
PUT /api/members/:id
{
  "nome": "João Silva Atualizado",
  "data_vencimento": "2026-01-31"
}

# Renovar assinatura
POST /api/members/:id/renew
{
  "data_vencimento": "2026-06-30"
}

# Remover membro
DELETE /api/members/:id
```

### Estatísticas

```bash
# Obter estatísticas
GET /api/stats
```

### Cron Jobs (protegidos por CRON_SECRET)

```bash
# Remover membros vencidos
POST /api/cron/remove-expired
Authorization: Bearer seu-cron-secret

# Enviar notificações
POST /api/cron/send-notifications
Authorization: Bearer seu-cron-secret
```

## ⚙️ Automação (Cron Jobs)

### Opção 1: Crontab (Linux/Mac)

```bash
# Criar pasta de logs
mkdir -p logs

# Editar crontab
crontab -e

# Adicionar:
0 9 * * * cd /caminho/para/TLGrupos && npm run cron:send-notifications >> logs/notifications.log 2>&1
0 0 * * * cd /caminho/para/TLGrupos && npm run cron:check-expired >> logs/expired.log 2>&1
```

### Opção 2: Vercel Cron

Se você fizer deploy na Vercel, os cron jobs já estão configurados no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-notifications",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/remove-expired",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Opção 3: GitHub Actions

Crie `.github/workflows/cron.yml`:

```yaml
name: Cron Jobs

on:
  schedule:
    - cron: '0 9 * * *'  # Notificações às 9h
    - cron: '0 0 * * *'  # Remoções à meia-noite

jobs:
  run-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Send Notifications
        run: |
          curl -X POST https://seu-dominio.vercel.app/api/cron/send-notifications \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

      - name: Remove Expired
        run: |
          curl -X POST https://seu-dominio.vercel.app/api/cron/remove-expired \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 🗂️ Estrutura do Projeto

```
TLGrupos/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── members/       # CRUD de membros
│   │   │   ├── stats/         # Estatísticas
│   │   │   └── cron/          # Endpoints de automação
│   │   ├── dashboard/         # Interface web
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Componentes React
│   ├── lib/                   # Bibliotecas e utilities
│   │   ├── supabase.ts       # Cliente Supabase
│   │   └── telegram.ts       # Cliente Telegram
│   ├── services/              # Lógica de negócio
│   │   ├── member-service.ts
│   │   ├── notification-service.ts
│   │   └── cron-service.ts
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # Migrations SQL
├── scripts/                   # Scripts de automação
│   ├── check-expired-members.ts
│   ├── send-expiry-notifications.ts
│   └── setup-bot.ts
├── .env.example               # Exemplo de variáveis de ambiente
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Verificar configuração do bot
npm run setup:bot

# Executar cron jobs manualmente
npm run cron:check-expired
npm run cron:send-notifications
```

## 📊 Database Schema

### Tabela: members

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| telegram_user_id | BIGINT | ID do usuário no Telegram |
| telegram_username | TEXT | Username do Telegram |
| nome | TEXT | Nome do membro |
| email | TEXT | Email (opcional) |
| data_entrada | TIMESTAMP | Data de entrada |
| data_vencimento | TIMESTAMP | Data de vencimento |
| notificado_7dias | BOOLEAN | Notificado 7 dias antes |
| notificado_3dias | BOOLEAN | Notificado 3 dias antes |
| notificado_1dia | BOOLEAN | Notificado 1 dia antes |
| status | TEXT | ativo, vencido, removido, pausado |

### Tabela: logs

Registra todas as ações do sistema (adições, remoções, notificações, etc).

### Tabela: config

Armazena configurações do sistema (templates de mensagens, etc).

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push do código para GitHub
2. Conecte no [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente
4. Deploy automático!

### Outras Opções

- Railway
- Render
- VPS (DigitalOcean, Hetzner, etc)

## 🔒 Segurança

- Nunca commite o arquivo `.env.local`
- Use `CRON_SECRET` para proteger endpoints de automação
- Configure Row Level Security (RLS) no Supabase
- Use HTTPS em produção

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📝 Licença

ISC

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique os logs em `logs/`
2. Execute `npm run setup:bot` para diagnosticar problemas do bot
3. Consulte a documentação do [Telegraf](https://telegraf.js.org/)
4. Consulte a documentação do [Supabase](https://supabase.com/docs)

---

Feito com ❤️ usando Next.js, Telegram Bot API e Supabase
