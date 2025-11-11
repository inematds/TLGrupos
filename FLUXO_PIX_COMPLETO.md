# 🔄 FLUXO COMPLETO PIX COM UPLOAD

## 📋 Resumo do Sistema

Este documento explica TODO o fluxo do sistema de PIX com upload de comprovante.

---

## 👥 LADO DO CLIENTE

### 1️⃣ Cliente Acessa o Formulário
**URL:** `http://192.168.1.91:3020/register-pix-upload`

### 2️⃣ Cliente Preenche Cadastro
- Nome completo
- Email
- Telefone (opcional)
- Username do Telegram (opcional)
- **Seleciona um plano** (carregado do banco de dados)

### 3️⃣ Sistema Mostra QR Code PIX
- QR Code gerado automaticamente
- Chave PIX para copiar
- Valor do plano selecionado

### 4️⃣ Cliente Faz o Pagamento
- Escaneia QR Code ou copia a chave
- Faz pagamento no banco

### 5️⃣ Cliente Faz Upload do Comprovante
- Anexa imagem (JPG, PNG) ou PDF
- Arquivo é enviado para Supabase Storage
- Status muda para: `comprovante_enviado`

---

## 👨‍💼 LADO DO ADMIN (VOCÊ)

### 6️⃣ Admin Acessa Validação
**URL:** `http://192.168.1.91:3020/dashboard/validar-pagamentos`

Aparece lista de:
- Nome do cliente
- Email
- Valor pago
- Botão "Ver Comprovante"
- Botão "Aprovar" (verde)
- Botão "Reprovar" (vermelho)

### 7️⃣ Admin Visualiza Comprovante
- Clica em "Ver Comprovante"
- Abre modal com a imagem/PDF
- Verifica se o pagamento é válido

### 8️⃣ Admin Decide:

#### ✅ APROVAR:
1. Clica em "Aprovar"
2. Confirma a ação

**O sistema faz AUTOMATICAMENTE:**
- ✅ Cria registro na tabela `members`
- ✅ Calcula data de vencimento (hoje + plano_dias)
- ✅ Gera link único do Telegram (member_limit: 1)
- ✅ Salva link no banco
- ✅ Marca `link_enviado = true`
- ✅ Atualiza status para `pago`
- ✅ **ENVIA EMAIL automaticamente via Resend**
- ✅ Registra log da ação

**Email enviado contém:**
- Template HTML bonito
- Nome do cliente
- Link de acesso ao grupo
- Dias de acesso
- Data de vencimento
- Instruções de uso

#### ❌ REPROVAR:
1. Clica em "Reprovar"
2. Digite motivo da reprovação

**O sistema faz AUTOMATICAMENTE:**
- ❌ Atualiza status para `cancelado`
- ❌ Marca validado_por e validado_em
- ❌ **ENVIA EMAIL de reprovação automaticamente**
- ❌ Registra log da ação

**Email de reprovação contém:**
- Template HTML
- Motivo da reprovação
- Dicas para nova tentativa
- Orientações

---

## 📧 QUEM ENVIA O EMAIL?

**Resposta:** O **sistema envia automaticamente** via Resend

### Serviço Usado: **Resend**
- Provedor de email transacional
- Similar ao SendGrid, Mailgun, AWS SES
- API Key: `re_42VrdCj2_NY3ZZ1u1goDaawgTLjPJVrV9`

### Remetente Atual: **onboarding@resend.dev**
- Domínio de teste do Resend
- ✅ Já funciona sem configuração
- ⚠️ Pode ser personalizado com seu domínio

### Quando os Emails São Enviados?

**AUTOMATICAMENTE** quando:
1. ✅ Você aprova um pagamento → Email de acesso
2. ❌ Você reprova um pagamento → Email de reprovação

**Não é manual!** Você não precisa enviar nada.

---

## 🔍 COMO VERIFICAR SE O EMAIL FOI ENVIADO

### Opção 1: Mensagem na Tela
Quando você aprova, aparece:
```
✅ Pagamento aprovado e email enviado com sucesso!

🔗 Link: https://t.me/+xxxxxxx

📧 Email enviado com sucesso!
```

### Opção 2: Histórico de Cadastros
**URL:** `http://192.168.1.91:3020/dashboard/cadastros`

Mostra todos os cadastros com badges:
- ✅ Link de acesso enviado com sucesso
- 📧 Email enviado com sucesso
- ⚠️ Erro ao enviar email

### Opção 3: Logs do Resend
**URL:** https://resend.com/emails

Ver histórico de TODOS os emails:
- Status: Delivered / Bounced
- Data e hora
- Destinatário
- Conteúdo

### Opção 4: Banco de Dados
Tabela `emails_enviados`:
```sql
SELECT * FROM emails_enviados
ORDER BY created_at DESC;
```

Mostra:
- destinatario
- assunto
- status ('enviado' ou 'erro')
- created_at

---

## 🎯 CADASTROS E SEUS STATUS

### Status Possíveis:

| Status | Descrição | Ação Necessária |
|--------|-----------|-----------------|
| `aguardando_pagamento` | Cliente ainda não enviou comprovante | Aguardar |
| `comprovante_enviado` | Comprovante recebido | **Validar!** |
| `validado` | Aprovado, processando | Automático |
| `pago` | Link enviado com sucesso | Nenhuma |
| `cancelado` | Reprovado | Nenhuma |
| `expirado` | Passou 24h sem ação | Nenhuma |

---

## 🗂️ ONDE ESTÃO OS DADOS

### Tabela: `cadastros_pendentes`
- Todos os cadastros (pendentes, aprovados, reprovados)
- Campos importantes:
  - `link_enviado` (boolean)
  - `invite_link` (text)
  - `status`
  - `comprovante_url`
  - `validado_por`
  - `validado_em`

### Tabela: `members`
- Apenas cadastros **aprovados**
- Criados automaticamente ao aprovar

### Tabela: `emails_enviados`
- Log de todos os emails enviados
- Status de sucesso/erro

### Storage: `comprovantes`
- Arquivos de imagem e PDF
- Bucket no Supabase Storage

---

## 🚀 RESUMO: VOCÊ NÃO FAZ NADA!

Quando você clica em **"Aprovar"**:

1. ✅ Sistema cria o membro
2. ✅ Sistema gera o link
3. ✅ Sistema salva tudo
4. ✅ **Sistema envia o email SOZINHO**
5. ✅ Cliente recebe email automaticamente
6. ✅ Você vê confirmação na tela

**Você só precisa:**
- Ver o comprovante
- Clicar em "Aprovar" ou "Reprovar"
- Pronto!

---

## 📱 URLs Importantes

**Para Admin:**
- Validar: `http://192.168.1.91:3020/dashboard/validar-pagamentos`
- Histórico: `http://192.168.1.91:3020/dashboard/cadastros`
- Formas de Pagamento: `http://192.168.1.91:3020/dashboard/formas-pagamento`

**Para Clientes:**
- Cadastro PIX: `http://192.168.1.91:3020/register-pix-upload`

**Para Configurar:**
- Resend Dashboard: https://resend.com/emails
- Resend API Keys: https://resend.com/api-keys
- Resend Domains: https://resend.com/domains
