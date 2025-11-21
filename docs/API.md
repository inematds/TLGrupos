# 📡 Documentação da API - TLGrupos

Base URL: `http://localhost:3000/api` (desenvolvimento)

## 📝 Autenticação

Os endpoints públicos não requerem autenticação.
Os endpoints de cron (`/api/cron/*`) requerem o header:

```
Authorization: Bearer SEU_CRON_SECRET
```

---

## 👥 Membros

### Listar Membros

**GET** `/api/members`

**Query Parameters:**
- `status` (opcional): `ativo`, `vencido`, `removido`
- `search` (opcional): Busca por nome ou username
- `limit` (opcional): Número de resultados (padrão: todos)
- `offset` (opcional): Paginação

**Exemplo:**
```bash
curl http://localhost:3000/api/members?status=ativo&limit=10
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-aqui",
      "telegram_user_id": 123456789,
      "telegram_username": "joaosilva",
      "nome": "João Silva",
      "email": "joao@example.com",
      "data_entrada": "2025-01-01T00:00:00Z",
      "data_vencimento": "2025-12-31T00:00:00Z",
      "notificado_7dias": false,
      "status": "ativo",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

---

### Buscar Membro por ID

**GET** `/api/members/:id`

**Exemplo:**
```bash
curl http://localhost:3000/api/members/uuid-do-membro
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-aqui",
    "nome": "João Silva",
    ...
  }
}
```

---

### Criar Membro

**POST** `/api/members`

**Body (JSON):**
```json
{
  "nome": "João Silva",
  "telegram_username": "joaosilva",
  "telegram_user_id": 123456789,
  "data_vencimento": "2025-12-31",
  "email": "joao@example.com",
  "telefone": "+5511999999999",
  "observacoes": "Cliente VIP"
}
```

**Campos obrigatórios:**
- `nome`
- `data_vencimento`

**Campos opcionais:**
- `telegram_username`
- `telegram_user_id`
- `email`
- `telefone`
- `observacoes`

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "telegram_username": "joaosilva",
    "data_vencimento": "2025-12-31"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-gerado",
    "nome": "João Silva",
    ...
  },
  "inviteLink": "https://t.me/+abc123xyz",
  "message": "Membro criado com sucesso"
}
```

**Notas:**
- Se `telegram_user_id` for fornecido, um invite link será gerado automaticamente
- O link expira na `data_vencimento`

---

### Atualizar Membro

**PUT** `/api/members/:id`

**Body (JSON):**
```json
{
  "nome": "João Silva Atualizado",
  "email": "novoemail@example.com",
  "data_vencimento": "2026-01-31",
  "status": "ativo",
  "observacoes": "Informações atualizadas"
}
```

**Todos os campos são opcionais** (atualize apenas o que precisar)

**Exemplo:**
```bash
curl -X PUT http://localhost:3000/api/members/uuid-do-membro \
  -H "Content-Type: application/json" \
  -d '{
    "data_vencimento": "2026-01-31"
  }'
```

---

### Renovar Assinatura

**POST** `/api/members/:id/renew`

**Body (JSON):**
```json
{
  "data_vencimento": "2026-06-30"
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/members/uuid-do-membro/renew \
  -H "Content-Type: application/json" \
  -d '{
    "data_vencimento": "2026-06-30"
  }'
```

**Notas:**
- Atualiza a data de vencimento
- Reseta os flags de notificação
- Muda o status para `ativo`
- Registra a renovação nos logs

---

### Remover Membro

**DELETE** `/api/members/:id`

**Exemplo:**
```bash
curl -X DELETE http://localhost:3000/api/members/uuid-do-membro
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-aqui",
    "status": "removido",
    ...
  },
  "message": "Membro removido com sucesso"
}
```

**Notas:**
- Remove o membro do grupo Telegram
- Marca o status como `removido` no banco
- Registra a ação nos logs

---

## 📊 Estatísticas

### Obter Estatísticas

**GET** `/api/stats`

**Exemplo:**
```bash
curl http://localhost:3000/api/stats
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total_ativos": 45,
    "total_vencidos": 3,
    "total_removidos": 12,
    "vencendo_7dias": 5,
    "ativos_mas_vencidos": 1
  }
}
```

---

## ⚙️ Cron Jobs (Automação)

### Remover Membros Vencidos

**POST** `/api/cron/remove-expired`

**Headers:**
```
Authorization: Bearer SEU_CRON_SECRET
```

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/cron/remove-expired \
  -H "Authorization: Bearer sua-chave-secreta"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "count": 3,
    "results": {
      "success": 3,
      "failed": 0,
      "errors": []
    }
  }
}
```

**O que faz:**
1. Busca membros com `status=ativo` e `data_vencimento < hoje`
2. Remove cada um do grupo Telegram
3. Atualiza status para `vencido`
4. Registra nos logs

---

### Enviar Notificações de Vencimento

**POST** `/api/cron/send-notifications`

**Headers:**
```
Authorization: Bearer SEU_CRON_SECRET
```

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/cron/send-notifications \
  -H "Authorization: Bearer sua-chave-secreta"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "day7": {
      "count": 2,
      "results": {
        "success": 2,
        "failed": 0
      }
    },
    "day3": {
      "count": 1,
      "results": {
        "success": 1,
        "failed": 0
      }
    },
    "day1": {
      "count": 1,
      "results": {
        "success": 1,
        "failed": 0
      }
    }
  }
}
```

**O que faz:**
1. Busca membros que vencem em 7, 3 ou 1 dia
2. Envia mensagem privada via Telegram
3. Marca como notificado
4. Registra nos logs

---

## 🚨 Tratamento de Erros

Todos os endpoints retornam erros no formato:

```json
{
  "success": false,
  "error": "Mensagem de erro aqui"
}
```

**Códigos HTTP:**
- `200` - Sucesso
- `400` - Requisição inválida
- `401` - Não autorizado
- `404` - Não encontrado
- `500` - Erro no servidor

**Exemplo de erro de validação:**
```json
{
  "success": false,
  "error": "Dados inválidos",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "path": ["nome"],
      "message": "Nome é obrigatório"
    }
  ]
}
```

---

## 🧪 Testando a API

### Usando cURL

```bash
# Listar membros
curl http://localhost:3000/api/members

# Criar membro
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{"nome":"João","data_vencimento":"2025-12-31"}'

# Atualizar membro
curl -X PUT http://localhost:3000/api/members/uuid \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Atualizado"}'
```

### Usando JavaScript/Fetch

```javascript
// Criar membro
const response = await fetch('http://localhost:3000/api/members', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nome: 'João Silva',
    data_vencimento: '2025-12-31',
  }),
});

const data = await response.json();
console.log(data);
```

### Usando Postman/Insomnia

Importe a collection (crie um arquivo `postman_collection.json`):

```json
{
  "info": {
    "name": "TLGrupos API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Listar Membros",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/members"
      }
    },
    {
      "name": "Criar Membro",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"nome\": \"João Silva\",\n  \"data_vencimento\": \"2025-12-31\"\n}"
        },
        "url": "http://localhost:3000/api/members"
      }
    }
  ]
}
```

---

## 💡 Dicas de Uso

### 1. Criar Membro e Obter Invite Link

```bash
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "telegram_user_id": 123456789,
    "data_vencimento": "2025-12-31"
  }'

# Resposta incluirá: "inviteLink": "https://t.me/+abc123"
# Envie este link para o usuário entrar no grupo
```

### 2. Renovar Vários Membros em Lote

Use um script:

```javascript
const members = ['uuid1', 'uuid2', 'uuid3'];
const newExpiry = '2026-06-30';

for (const memberId of members) {
  await fetch(`http://localhost:3000/api/members/${memberId}/renew`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data_vencimento: newExpiry }),
  });
}
```

### 3. Buscar Membros Vencendo Esta Semana

```bash
curl 'http://localhost:3000/api/members?status=ativo' | \
  jq '.data[] | select(.dias_restantes <= 7)'
```

---

## 📚 Recursos Adicionais

- [README.md](README.md) - Documentação completa
- [SETUP.md](SETUP.md) - Guia de instalação
- [Telegraf Docs](https://telegraf.js.org/) - Documentação do Telegram Bot
- [Supabase Docs](https://supabase.com/docs) - Documentação do Supabase
