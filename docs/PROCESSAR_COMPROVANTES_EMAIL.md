# 📧 PROCESSAR COMPROVANTES RECEBIDOS POR EMAIL

## 📋 Como Funciona

Se você quer que clientes enviem comprovantes por **email** em vez de fazer upload, siga este guia.

---

## 🔄 Fluxo Simplificado (Manual)

### 1️⃣ Cliente Faz Cadastro
Use a mesma página: `http://192.168.1.91:3020/register-pix-upload`

O cliente:
- Preenche dados
- Vê QR Code PIX
- Faz pagamento
- **Envia comprovante por EMAIL** para você (em vez de fazer upload)

### 2️⃣ Você Recebe o Email
Cliente envia para: **seu@email.com** (ou cria email específico como `comprovantes@seudominio.com`)

### 3️⃣ Você Salva o Comprovante Manualmente
Opção A - Fazer Upload na Tela de Validação:
1. Salve a imagem do email no computador
2. Acesse: `http://192.168.1.91:3020/dashboard/validar-pagamentos`
3. **Não há cadastro ainda**, então volte e faça um cadastro manual

Opção B - Usar a Página de Upload:
1. Peça para o cliente usar a página de upload: `http://192.168.1.91:3020/register-pix-upload`
2. Ele mesmo faz o upload

---

## ⚡ Fluxo Automático (Com Webhook)

Se você quiser **receber emails automaticamente** e processar:

### 1️⃣ Configurar Resend Inbound Email

1. Acesse: https://resend.com/domains
2. Clique no seu domínio
3. Vá em **"Inbound"**
4. Configure:
   - Forward To: `http://192.168.1.91:3020/api/webhook/email-comprovante`
   - MX Records: Adicione os registros DNS que o Resend fornece

### 2️⃣ Email Configurado
Clientes poderão enviar para: `comprovantes@seudominio.com`

### 3️⃣ Sistema Processa Automaticamente
- Email chega
- Webhook extrai anexos
- Salva em `cadastros_pendentes`
- Aparece na tela de validação

---

## 🎯 Qual Opção Escolher?

### Opção 1: PIX com Upload (Recomendado) ✅
**Vantagens:**
- Já está funcionando
- Cliente faz upload direto
- Mais simples

**Como usar:**
- Cliente acessa: `http://192.168.1.91:3020/register-pix-upload`
- Faz todo o processo no site

### Opção 2: Manual (Email Normal)
**Vantagens:**
- Não precisa configurar nada
- Usa seu email normal

**Desvantagens:**
- Você precisa salvar e enviar link manualmente
- Mais trabalhoso

**Como usar:**
1. Cliente te envia email normal
2. Você cria membro manual no dashboard
3. Sistema gera link
4. Você envia link por email para ele

### Opção 3: Webhook Automático
**Vantagens:**
- Totalmente automático
- Cliente envia por email
- Sistema processa sozinho

**Desvantagens:**
- Precisa configurar Resend Inbound
- Precisa domínio próprio
- Requer configuração DNS

---

## 💡 Recomendação

**Use a Opção 1 (PIX com Upload)** que já está funcionando!

Compartilhe este link com seus clientes:
```
http://192.168.1.91:3020/register-pix-upload
```

Eles fazem:
1. Cadastro
2. Veem QR Code PIX
3. Pagam
4. Fazem UPLOAD do comprovante
5. Sistema notifica você
6. Você valida e aprova
7. Sistema envia link automaticamente

**É o mais simples e já está 100% funcionando!**

---

## 🔧 Se Realmente Quiser Email

Se você REALMENTE quer que clientes enviem por email:

### Solução Simples:
1. Peça para enviarem para seu email normal
2. Quando receber, acesse: `http://192.168.1.91:3020/dashboard/new`
3. Crie o membro manualmente
4. Sistema gera link automaticamente
5. Cliente recebe email com link

### Solução Automática (Avançada):
- Vou criar o webhook em seguida
- Você precisa configurar Resend Inbound Email
- DNS do seu domínio

---

## ❓ Dúvidas Comuns

**P: Posso usar qualquer email?**
R: Sim, mas precisa configurar webhook se quiser automático

**P: Precisa ser meu domínio?**
R: Para webhook automático, sim. Para manual, não.

**P: É difícil configurar?**
R: Webhook requer conhecimento de DNS. Upload é mais simples.

**P: Qual é mais rápido?**
R: Upload é instantâneo. Email depende de você ler e processar.

---

## 🚀 Próximo Passo

Se você quer o webhook automático de emails, me avise que eu crio a API!

Caso contrário, **use o PIX com Upload** que já funciona perfeitamente! 🎯
