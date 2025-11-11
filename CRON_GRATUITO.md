# ⏰ CRON JOBS GRATUITOS - ALTERNATIVA AO VERCEL PRO

## 🚫 Problema

O Vercel só oferece Cron Jobs no plano **Pro** ($20/mês).
No plano **Hobby** (gratuito), precisamos usar serviços externos.

---

## ✅ Solução: Usar Serviços Externos Gratuitos

Esses serviços chamam suas APIs do Vercel em horários agendados, **totalmente grátis!**

---

## 🎯 CRON JOBS NECESSÁRIOS

Seu sistema precisa de 3 cron jobs:

| Cron Job | URL | Frequência | Descrição |
|----------|-----|------------|-----------|
| **Notificações** | `/api/cron/send-notifications` | Diariamente às 9h | Envia avisos de vencimento |
| **Remover Expirados** | `/api/cron/remove-expired` | Diariamente à meia-noite | Remove membros vencidos |
| **Processar Pagamentos** | `/api/processar-pagamentos` | A cada 30 minutos | Valida pagamentos PIX |

---

## 🌟 OPÇÃO 1: cron-job.org (RECOMENDADO)

### ✅ Vantagens:
- 100% gratuito
- Até 50 cron jobs
- Interface simples
- Monitoramento de execução
- Notificações por email

### 📋 Como Configurar:

#### 1️⃣ Criar Conta
1. Acesse: https://cron-job.org
2. Clique em **"Sign Up"**
3. Confirme email

#### 2️⃣ Adicionar Cron Jobs

Após o deploy no Vercel, você terá uma URL como:
`https://tl-grupos.vercel.app`

**Crie 3 cron jobs:**

---

### 🔹 Cron Job 1: Notificações Diárias

1. Clique em **"Create Cronjob"**
2. Preencha:
   - **Title:** `TLGrupos - Notificações`
   - **URL:** `https://tl-grupos.vercel.app/api/cron/send-notifications`
   - **Schedule:**
     - Every day at: `09:00` (9h da manhã)
   - **Request method:** `GET`
   - **Headers:** (opcional)
     ```
     Authorization: Bearer SEU_CRON_SECRET
     ```
3. Clique em **"Create"**

---

### 🔹 Cron Job 2: Remover Expirados

1. Clique em **"Create Cronjob"**
2. Preencha:
   - **Title:** `TLGrupos - Remover Expirados`
   - **URL:** `https://tl-grupos.vercel.app/api/cron/remove-expired`
   - **Schedule:**
     - Every day at: `00:00` (meia-noite)
   - **Request method:** `GET`
   - **Headers:** (opcional)
     ```
     Authorization: Bearer SEU_CRON_SECRET
     ```
3. Clique em **"Create"**

---

### 🔹 Cron Job 3: Processar Pagamentos

1. Clique em **"Create Cronjob"**
2. Preencha:
   - **Title:** `TLGrupos - Processar Pagamentos`
   - **URL:** `https://tl-grupos.vercel.app/api/processar-pagamentos`
   - **Schedule:**
     - Every: `30 minutes`
   - **Request method:** `GET`
   - **Headers:** (opcional)
     ```
     Authorization: Bearer SEU_CRON_SECRET
     ```
3. Clique em **"Create"**

---

## 🌟 OPÇÃO 2: EasyCron

### ✅ Vantagens:
- Gratuito até 20 cron jobs
- Interface simples
- Logs detalhados

### 📋 Como Configurar:

1. Acesse: https://www.easycron.com
2. Clique em **"Sign Up"** (gratuito)
3. Adicione os 3 cron jobs com as mesmas URLs

**Expressões Cron:**
- Diariamente às 9h: `0 9 * * *`
- Diariamente à meia-noite: `0 0 * * *`
- A cada 30 minutos: `*/30 * * * *`

---

## 🌟 OPÇÃO 3: GitHub Actions (Para Devs)

Se você já usa GitHub, pode usar GitHub Actions gratuitamente!

### 📋 Como Configurar:

Crie o arquivo: `.github/workflows/cron.yml`

```yaml
name: Cron Jobs

on:
  schedule:
    # Notificações às 9h (12h UTC = 9h BRT)
    - cron: '0 12 * * *'
    # Remover expirados à meia-noite (3h UTC = 0h BRT)
    - cron: '0 3 * * *'
    # Processar pagamentos a cada 30 min
    - cron: '*/30 * * * *'

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Send Notifications
        run: |
          curl -X GET https://tl-grupos.vercel.app/api/cron/send-notifications \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  remove-expired:
    runs-on: ubuntu-latest
    steps:
      - name: Remove Expired
        run: |
          curl -X GET https://tl-grupos.vercel.app/api/cron/remove-expired \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  process-payments:
    runs-on: ubuntu-latest
    steps:
      - name: Process Payments
        run: |
          curl -X GET https://tl-grupos.vercel.app/api/processar-pagamentos \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Adicione o secret:**
1. GitHub → Settings → Secrets → Actions
2. Adicione: `CRON_SECRET` com o valor do `.env.vercel.production`

---

## 🌟 OPÇÃO 4: Render (Alternativa ao Vercel)

Se preferir, pode fazer deploy no **Render.com** que oferece cron jobs gratuitos!

1. Acesse: https://render.com
2. Importe repositório do GitHub
3. Configure cron jobs nativamente

---

## 🔒 Segurança: Proteger Cron Jobs

Para evitar que outras pessoas chamem seus cron jobs, adicione autenticação:

### No código da API:

```typescript
// src/app/api/cron/send-notifications/route.ts
export async function GET(request: NextRequest) {
  // Verificar autorização
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Resto do código...
}
```

Já está implementado! ✅

---

## 📊 Monitoramento

### cron-job.org:
- Dashboard mostra execuções
- Email em caso de falha
- Histórico de logs

### GitHub Actions:
- Veja em: Actions → Workflows
- Logs detalhados de cada execução

---

## 🎯 RESUMO - O QUE FAZER AGORA

1. ✅ Faça deploy no Vercel (sem cron jobs)
2. ✅ Aguarde receber a URL do Vercel
3. ✅ Crie conta no cron-job.org
4. ✅ Configure os 3 cron jobs
5. ✅ Pronto! Sistema funcionando 100%

---

## 🆚 Comparação

| Serviço | Grátis? | Limite | Facilidade |
|---------|---------|--------|------------|
| **cron-job.org** | ✅ Sim | 50 jobs | ⭐⭐⭐⭐⭐ |
| **EasyCron** | ✅ Sim | 20 jobs | ⭐⭐⭐⭐ |
| **GitHub Actions** | ✅ Sim | 2000 min/mês | ⭐⭐⭐ |
| **Render** | ✅ Sim | Ilimitado | ⭐⭐⭐⭐ |
| **Vercel Pro** | ❌ $20/mês | Ilimitado | ⭐⭐⭐⭐⭐ |

---

## 💡 Recomendação

Use **cron-job.org** - é o mais simples e confiável!

---

## ❓ FAQ

**P: Os cron jobs são obrigatórios?**
R: Não! O sistema funciona normalmente sem eles. Eles apenas automatizam:
- Envio de lembretes de vencimento
- Remoção automática de expirados
- Verificação de pagamentos PIX

**P: Posso usar apenas alguns cron jobs?**
R: Sim! Você pode usar apenas o que precisar. O mais importante é o de **Remover Expirados**.

**P: E se eu não usar cron jobs?**
R: Você pode fazer manualmente:
- Dashboard → Auto Removal → Remover Expirados
- Dashboard → Notifications → Enviar Notificações

---

**Pronto! Agora você pode fazer deploy no Vercel gratuitamente! 🚀**
