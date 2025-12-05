# Fluxo Integrado: Cadastro + Pagamento + Link de Acesso

**Data:** 2025-12-04
**Status:** ✅ Implementado

---

## 📋 Visão Geral

Sistema unificado onde o usuário preenche seus dados, escolhe um plano, faz o pagamento PIX e envia comprovante por email. O sistema:

1. **Verifica se o email já existe** no sistema
2. **Cria ou reutiliza o cadastro** do membro
3. **Cria o pagamento** com status pendente
4. **Aguarda aprovação** do admin
5. **Gera link de acesso automaticamente** após aprovação

---

## 🔄 Fluxo Completo

### 1. Usuário Acessa a Página
**URL:** `http://localhost:3000/register-pix-email`

### 2. Preenche Dados Pessoais
- Nome completo *
- Email * (usado para verificar se já existe)
- Telefone
- Usuário do Telegram (opcional)
- Seleciona um plano *

### 3. Visualiza QR Code PIX
- QR Code gerado com valor do plano
- Chave PIX para copiar
- Instruções de pagamento

### 4. Sistema Processa (ao clicar "Já Fiz o Pagamento")

```javascript
// 1. Verifica se email já existe
const checkMemberRes = await fetch(`/api/members?email=${email}`);

if (membro_existe) {
  memberId = membro_existente.id;
} else {
  // 2. Cria novo membro
  const newMember = await fetch('/api/members', {
    method: 'POST',
    body: JSON.stringify({
      nome, email, telefone, telegram_username,
      data_vencimento: calculada_do_plano,
      status: 'ativo',
      plan_id
    })
  });
  memberId = newMember.id;
}

// 3. Cria pagamento pendente
const payment = await fetch('/api/payments', {
  method: 'POST',
  body: JSON.stringify({
    member_id: memberId,
    plan_id,
    valor: plano.valor,
    dias_acesso: plano.duracao_dias,
    data_vencimento: calculada,
    status: 'pendente',
    descricao: `Pagamento via PIX - ${plano.nome}`,
    observacoes: 'QR Code gerado. Aguardando comprovante por email.'
  })
});

// 4. Retorna payment_id como código de referência
cadastroId = payment.id;
```

### 5. Usuário Envia Comprovante por Email
- Email para: `email_configurado_no_sistema`
- Assunto: Código de referência (primeiros 8 caracteres do payment_id)
- Anexo: Comprovante de pagamento PIX
- De: Email cadastrado

### 6. Admin Aprova no Dashboard
**URL:** `http://localhost:3000/dashboard/pagamentos-gerenciar`

1. Admin vê pagamento pendente na lista
2. Clica em "Ver" para ver detalhes
3. Verifica comprovante (se tiver URL)
4. Clica em "Aprovar Pagamento"

### 7. Sistema Gera Link Automaticamente

Quando admin aprova (`/api/payments` PATCH com `action: 'approve'`):

```javascript
// 1. Atualiza pagamento
UPDATE payments SET
  status = 'aprovado',
  data_aprovacao = NOW(),
  aprovado_por = 'Admin'
WHERE id = payment_id;

// 2. Atualiza data de vencimento do membro
UPDATE members SET
  data_vencimento = NOW() + dias_acesso,
  ultimo_pagamento_data = NOW(),
  ultimo_pagamento_valor = valor
WHERE id = member_id;

// 3. Chama /api/processar-aprovacao para gerar link
const linkRes = await fetch('/api/processar-aprovacao', {
  method: 'POST',
  body: JSON.stringify({
    payment_id: payment_id,
    group_id: group_id_selecionado
  })
});

// Sistema gera:
// - Link único do Telegram (member_limit: 1, sem expire_date)
// - Salva em payment_access_codes
// - Retorna link
```

### 8. Admin Envia Link para Usuário
- Copiar link gerado
- Enviar por email para o usuário
- (Futuro: automático)

### 9. Usuário Clica no Link e Entra
- Clica no link recebido
- Entra no grupo Telegram automaticamente
- Bot detecta entrada e atualiza banco

### 10. Bot Atualiza Banco de Dados

```javascript
bot.on('new_chat_members', async (ctx) => {
  const link = ctx.message.invite_link?.invite_link;

  // Busca payment_access_code
  const accessCode = await db.payment_access_codes
    .where('invite_link', link)
    .first();

  // Tenta 3 vezes atualizar
  for (let i = 0; i < 3; i++) {
    try {
      // Atualiza payment_access_codes
      UPDATE payment_access_codes SET
        usado = true,
        data_acesso = NOW(),
        telegram_user_id_acesso = user.id,
        status = 'usado'

      // Atualiza payments
      UPDATE payments SET
        link_acessado = true,
        data_acesso = NOW(),
        entrada_confirmada = true

      // Atualiza members
      UPDATE members SET
        telegram_user_id = user.id,
        no_grupo = true,
        total_acessos = total_acessos + 1

      break; // Sucesso
    } catch (error) {
      if (i === 2) {
        // Falhou 3x, avisa admin
        bot.telegram.sendMessage(ADMIN_CHAT_ID,
          "⚠️ ERRO ao registrar entrada...");
      }
    }
  }
});
```

---

## 🗂️ Tabelas Envolvidas

### `members`
- Cadastro do usuário
- Criado/atualizado automaticamente
- Armazena: nome, email, telefone, telegram_username, data_vencimento

### `payments`
- Registro de pagamento
- Status: pendente → aprovado
- Relacionado com member_id e plan_id

### `payment_access_codes`
- Link de acesso único
- Criado automaticamente na aprovação
- Relacionado com payment_id, member_id, group_id

### `plans`
- Planos disponíveis
- Define valor e duração (dias)

---

## 📊 Estados do Fluxo

### Estado 1: Dados Preenchidos
- Usuário preenche formulário
- Sistema valida campos obrigatórios
- Mostra QR Code PIX

### Estado 2: Aguardando Comprovante
- Membro criado (se não existe)
- Pagamento criado com status `pendente`
- Usuário recebe código de referência
- Instrução para enviar email

### Estado 3: Comprovante Recebido
- Admin vê na lista de pagamentos pendentes
- Pode aprovar ou rejeitar

### Estado 4: Aprovado
- Pagamento → status `aprovado`
- Link gerado automaticamente
- Salvo em `payment_access_codes`
- Admin copia e envia para usuário

### Estado 5: Link Usado
- Usuário entra no grupo
- Bot atualiza todas as tabelas
- Marcado como `usado` em `payment_access_codes`

---

## ✅ Vantagens do Novo Fluxo

1. **Unificado**: Não usa mais `cadastros_pendentes`
2. **Automático**: Gera link automaticamente na aprovação
3. **Rastreável**: Tudo registrado em `payments` e `payment_access_codes`
4. **Resiliente**: Bot tenta 3x atualizar, avisa admin se falhar
5. **Flexível**: Reutiliza membros existentes ou cria novos
6. **Completo**: Mantém histórico de todos pagamentos e acessos

---

## 🔧 APIs Utilizadas

### `GET /api/members?email={email}`
- Verifica se membro já existe
- Retorna membro se encontrado

### `POST /api/members`
- Cria novo membro
- Retorna member_id

### `POST /api/payments`
- Cria pagamento pendente
- Retorna payment_id (usado como código de referência)

### `PATCH /api/payments`
- Aprova ou rejeita pagamento
- Chama `/api/processar-aprovacao` automaticamente

### `POST /api/processar-aprovacao`
- Gera link único do Telegram
- Salva em `payment_access_codes`
- Retorna link para admin enviar

---

## 📝 Próximas Melhorias

1. **Envio automático de email** com link de acesso
2. **Upload de comprovante** direto na página
3. **Webhook PIX** para aprovação automática
4. **Dashboard do usuário** para ver status do pagamento
5. **Notificações** por email em cada etapa

---

## 🚀 Como Testar

1. Acesse `http://localhost:3000/register-pix-email`
2. Preencha dados e selecione plano
3. Clique em "Ver Dados de Pagamento"
4. Clique em "Já Fiz o Pagamento"
5. Anote o código de referência
6. Vá em `http://localhost:3000/dashboard/pagamentos-gerenciar`
7. Veja o pagamento pendente na lista
8. Clique em "Ver" → "Aprovar Pagamento"
9. Sistema gera link automaticamente
10. Copie o link e teste entrando no grupo

---

## ⚠️ Importante

- **Email é a chave única** para verificar membros existentes
- **payment_id** é usado como código de referência (não gera código separado)
- **Link nunca expira** por tempo, só quando usado (member_limit: 1)
- **Datas são calculadas** a partir da aprovação do pagamento
- **Bot tenta 3x** atualizar banco, avisa admin se falhar
