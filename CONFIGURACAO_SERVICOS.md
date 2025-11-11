# 📋 Guia de Configuração dos Serviços

Este documento explica como configurar todos os serviços de terceiros necessários para o funcionamento completo do sistema TLGrupos.

## 📧 Serviços de Email

### Opção 1: Resend (Recomendado)

**Por que usar:** Interface simples, preço acessível, fácil configuração.

1. Acesse [resend.com](https://resend.com) e crie uma conta
2. Verifique seu domínio:
   - Vá em "Domains" e adicione seu domínio
   - Configure os registros DNS (SPF, DKIM, DMARC)
3. Crie uma API Key:
   - Vá em "API Keys" → "Create API Key"
   - Copie a key que começa com `re_`
4. Configure no `.env`:
   ```env
   EMAIL_PROVIDER=resend
   EMAIL_FROM=noreply@seudominio.com
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
   ```

### Opção 2: SendGrid

1. Acesse [sendgrid.com](https://sendgrid.com) e crie uma conta
2. Verifique seu domínio em "Settings" → "Sender Authentication"
3. Crie uma API Key:
   - Vá em "Settings" → "API Keys"
   - Crie com permissão "Mail Send"
4. Configure no `.env`:
   ```env
   EMAIL_PROVIDER=sendgrid
   EMAIL_FROM=noreply@seudominio.com
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
   ```

## 📥 Recebimento de Emails (Webhooks)

### CloudMailin (Recomendado para receber emails)

**Usado para:** Receber emails de clientes com comprovantes e emails do banco.

1. Acesse [cloudmailin.com](https://cloudmailin.com) e crie uma conta
2. Crie um novo endereço de email:
   - Escolha "HTTP Post Format: JSON"
   - URL do webhook: `https://seudominio.com/api/webhook/email-cliente`
3. Configure outro para emails do banco:
   - URL: `https://seudominio.com/api/webhook/email-banco`
4. Anote os endereços de email gerados (ex: `xxxxx@cloudmailin.net`)
5. Configure redirecionamento:
   - No seu provedor de email (Gmail, Outlook, etc)
   - Redirecione emails de `inemapix@gmail.com` para o CloudMailin

**Alternativas:**
- **SendGrid Inbound Parse:** Gratuito para baixo volume
- **Mailgun:** Robusto, usado por grandes empresas

## 💳 Gateway de Pagamento PIX

### Opção 1: Mercado Pago (Mais Popular)

1. Acesse [mercadopago.com.br](https://mercadopago.com.br) e crie uma conta vendedor
2. Vá em "Seu negócio" → "Configurações" → "Gestão e Administração"
3. Clique em "Credenciais"
4. Copie as credenciais de **Produção**:
   - Access Token
   - Public Key
5. Configure webhook:
   - URL: `https://seudominio.com/api/webhook/pix`
   - Eventos: `payment.created`, `payment.updated`
6. Configure no `.env`:
   ```env
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx
   MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx
   ```

### Opção 2: Asaas

1. Acesse [asaas.com](https://asaas.com) e crie uma conta
2. Vá em "Integrações" → "API"
3. Gere uma API Key
4. Configure webhook em "Integrações" → "Webhooks":
   - URL: `https://seudominio.com/api/webhook/pix`
   - Evento: `PAYMENT_RECEIVED`
5. Configure no `.env`:
   ```env
   ASAAS_API_KEY=sua-api-key
   ```

### Opção 3: PicPay

1. Entre em contato com PicPay para E-commerce
2. Receba suas credenciais (Token e Seller Token)
3. Configure webhook na dashboard
4. Configure no `.env`:
   ```env
   PICPAY_TOKEN=seu-token
   PICPAY_SELLER_TOKEN=seu-seller-token
   ```

## 🤖 Configuração do Telegram Bot

1. Abra o Telegram e converse com [@BotFather](https://t.me/botfather)
2. Envie `/newbot` e siga as instruções
3. Copie o token do bot (formato: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. Adicione o bot ao seu grupo como administrador
5. Obtenha o ID do grupo:
   ```bash
   npm run get-group-id
   ```
6. Configure no `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   TELEGRAM_GROUP_ID=-100xxxxxxxx
   ```

## 🗄️ Supabase Storage

1. Acesse seu projeto no [supabase.com](https://supabase.com)
2. Vá em "Storage"
3. Crie um novo bucket chamado `comprovantes`
4. Configure as políticas de acesso:
   ```sql
   -- Permitir upload para usuários autenticados
   CREATE POLICY "Permitir upload de comprovantes"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'comprovantes');

   -- Permitir leitura pública
   CREATE POLICY "Leitura pública de comprovantes"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'comprovantes');
   ```

## 🔐 Segurança

### CRON_SECRET

Usado para proteger rotas de cron jobs:

1. Gere uma senha segura:
   ```bash
   openssl rand -base64 32
   ```
2. Configure no `.env`:
   ```env
   CRON_SECRET=sua-senha-gerada
   ```

### Variáveis de Ambiente em Produção (Vercel)

1. Vá em seu projeto no Vercel
2. Settings → Environment Variables
3. Adicione todas as variáveis do `.env`
4. **IMPORTANTE:** Não commite o arquivo `.env` no Git!

## 🔄 Configuração de Cron Jobs (Vercel)

Se estiver usando Vercel, os cron jobs já estão configurados no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/processar-pagamentos",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

Isso processará pagamentos a cada 30 minutos automaticamente.

## 📊 Testando o Sistema

### 1. Teste de Email

Criar um script de teste:

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"seu@email.com"}'
```

### 2. Teste de Webhook PIX

```bash
curl -X POST http://localhost:3000/api/webhook/pix \
  -H "Content-Type: application/json" \
  -H "x-provider: mercadopago" \
  -d '{
    "type": "payment",
    "action": "payment.created",
    "data": {
      "id": "12345",
      "status": "approved",
      "transaction_amount": 29.90
    }
  }'
```

### 3. Teste de Email Inbound

Use o CloudMailin para enviar um email de teste para o endereço gerado.

## 🎯 Checklist de Configuração

- [ ] Supabase configurado (URL e Keys)
- [ ] Bot do Telegram criado e configurado
- [ ] Bucket `comprovantes` criado no Supabase Storage
- [ ] Migrações executadas (004 e 005)
- [ ] Serviço de email configurado (Resend ou SendGrid)
- [ ] CloudMailin configurado para receber emails
- [ ] Gateway de pagamento configurado (Mercado Pago, Asaas, etc)
- [ ] Webhooks configurados no gateway
- [ ] Variáveis de ambiente configuradas
- [ ] Testes realizados

## 🆘 Suporte

Se tiver dúvidas:
1. Verifique os logs em `console.log` na aplicação
2. Teste cada webhook individualmente
3. Verifique se todas as variáveis de ambiente estão corretas
4. Confirme que os webhooks estão recebendo requisições

## 📝 Próximos Passos

Após configurar tudo:
1. Teste o fluxo completo de cada tipo de cadastro
2. Configure notificações de erro (Sentry, etc)
3. Configure backups automáticos do Supabase
4. Implemente rate limiting nas APIs públicas
5. Adicione logs detalhados para debugging
