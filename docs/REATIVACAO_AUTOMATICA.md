# 🔄 Reativação Automática de Membros

## 📋 Visão Geral

Este documento explica o comportamento do sistema quando um membro **removido** entra novamente no grupo usando um link de convite.

---

## 🎯 Comportamento Atual

### Quando Membro Removido Entra Novamente

O sistema implementa **reativação automática**. Quando uma pessoa com `status='removido'` entra no grupo:

1. ✅ **Bot detecta a entrada** via evento `new_chat_members`
2. ✅ **Encontra registro existente** no banco de dados pelo `telegram_user_id`
3. ✅ **Verifica o status** e detecta que está como "removido"
4. ✅ **Reativa automaticamente** com as seguintes ações:
   - Altera `status` de `'removido'` para `'ativo'`
   - Calcula nova `data_vencimento` (hoje + 30 dias)
   - Reseta flags de notificação (`notificado_7dias`, `notificado_3dias`, `notificado_1dia` = false)
   - Atualiza `no_grupo = true`
   - Atualiza dados do Telegram (username, first_name, last_name)
5. ✅ **Registra log** com ação `'reativacao_automatica'`
6. ✅ **Envia mensagem de boas-vindas** personalizada

---

## 💬 Mensagens do Bot

### Membro Novo (primeira entrada)
```
🎉 Bem-vindo(a) [Nome]!

Você foi cadastrado automaticamente no sistema.
Seu acesso expira em 30 dias.

Use /status para verificar seu cadastro.
```

### Membro Reativado (re-entrada após remoção)
```
🎉 Bem-vindo(a) de volta, [Nome]!

Seu acesso foi reativado automaticamente.
Você tem mais 30 dias de acesso.

Use /status para verificar seu cadastro.
```

---

## 🔐 Controle de Acesso

### Por que Reativação Automática?

O controle de acesso é feito pelos **links de convite** do Telegram:

1. **Admin gera link** através do dashboard
2. **Link é único** para cada membro (ou genérico por tempo limitado)
3. **Se pessoa tem o link**, significa que foi autorizada a entrar
4. **Sistema confia no link** como autorização de acesso
5. **Reativação é automática** porque o link já é a autorização

### Tipos de Link

| Tipo | Descrição | Comportamento |
|------|-----------|---------------|
| **Único** | Link personalizado para 1 pessoa | Expira após uso |
| **Genérico** | Link válido por tempo limitado | Expira por tempo |

---

## 📊 Registro de Logs

Todas as reativações são registradas na tabela `logs` com:

```json
{
  "member_id": "uuid-do-membro",
  "acao": "reativacao_automatica",
  "detalhes": {
    "first_name": "Nome",
    "username": "username",
    "foi_removido": true,
    "nova_data_vencimento": "2025-12-21T00:00:00.000Z"
  },
  "telegram_user_id": 123456789,
  "telegram_username": "username",
  "executado_por": "sistema"
}
```

---

## 🔍 Cenários de Uso

### Cenário 1: Membro Vencido e Removido
1. Membro vence em 21/11/2025
2. Cron de auto-remoção remove do grupo (status = 'removido')
3. Membro **paga nova mensalidade**
4. Admin **gera novo link de convite**
5. Membro **usa link e entra no grupo**
6. Sistema **reativa automaticamente** (novo vencimento: 21/12/2025)

### Cenário 2: Remoção Manual
1. Admin remove membro manualmente (status = 'removido')
2. Admin **muda de ideia**
3. Admin **gera novo link de convite**
4. Membro **usa link e entra no grupo**
5. Sistema **reativa automaticamente** (+ 30 dias)

### Cenário 3: Membro Sai Voluntariamente
1. Membro sai do grupo voluntariamente
2. Sistema marca `no_grupo = false` (mas status continua 'ativo')
3. Membro **entra novamente com mesmo link**
4. Sistema **atualiza** `no_grupo = true`
5. **Não renova data** (continua com mesma data de vencimento)

---

## ⚙️ Detalhes Técnicos

### Arquivo: `/src/lib/telegram-webhook.ts`

#### Handler `new_chat_members` (linhas 147-223)

```typescript
if (existing) {
  // Verificar se o membro estava removido e precisa ser reativado
  const foiRemovido = existing.status === 'removido';

  // Preparar dados de atualização
  const updateData: any = {
    no_grupo: true,
    telegram_user_id: member.id,
    telegram_username: member.username || null,
    telegram_first_name: member.first_name,
    telegram_last_name: member.last_name || null,
  };

  // Se estava removido, reativar automaticamente
  if (foiRemovido) {
    console.log(`[Webhook] Membro ${member.first_name} estava removido. Reativando automaticamente...`);

    // Calcular nova data de vencimento (+ 30 dias)
    const hoje = new Date();
    const novaDataVencimento = new Date(hoje);
    novaDataVencimento.setDate(novaDataVencimento.getDate() + DEFAULT_EXPIRY_DAYS);

    updateData.status = 'ativo';
    updateData.data_vencimento = novaDataVencimento.toISOString();
    updateData.notificado_7dias = false;
    updateData.notificado_3dias = false;
    updateData.notificado_1dia = false;
  }

  // Atualizar dados do Telegram e reativar se necessário
  await supabase
    .from('members')
    .update(updateData)
    .eq('id', existing.id);

  if (foiRemovido) {
    console.log(`[Webhook] Membro reativado com sucesso! Nova data de vencimento: ${updateData.data_vencimento}`);

    // Enviar mensagem de boas-vindas para membro reativado
    await ctx.reply(
      `🎉 Bem-vindo(a) de volta, ${member.first_name}!\n\n` +
      `Seu acesso foi reativado automaticamente.\n` +
      `Você tem mais ${DEFAULT_EXPIRY_DAYS} dias de acesso.\n\n` +
      `Use /status para verificar seu cadastro.`
    );
  }

  // Registrar log de entrada
  await supabase.from('logs').insert({
    member_id: existing.id,
    acao: foiRemovido ? 'reativacao_automatica' : 'entrada_grupo',
    detalhes: {
      first_name: member.first_name,
      username: member.username,
      foi_removido: foiRemovido,
      nova_data_vencimento: foiRemovido ? updateData.data_vencimento : null,
    },
    telegram_user_id: member.id,
    telegram_username: member.username,
    executado_por: 'sistema',
  });
}
```

---

## 📊 Fluxograma

```
┌─────────────────────────┐
│  Membro entra no grupo  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Bot detecta new_chat_   │
│      members event      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Busca membro no banco   │
│   por telegram_user_id  │
└───────────┬─────────────┘
            │
      ┌─────┴─────┐
      │           │
   Existe?      Não existe
      │           │
      │           ▼
      │     ┌─────────────┐
      │     │Auto-cadastra│
      │     │   30 dias   │
      │     └─────────────┘
      │
      ▼
┌─────────────────┐
│ Status atual?   │
└────┬────────────┘
     │
     ├──── removido ────► ┌─────────────────────┐
     │                    │ Reativa             │
     │                    │ Status = 'ativo'    │
     │                    │ + 30 dias           │
     │                    │ Mensagem especial   │
     │                    └─────────────────────┘
     │
     └──── ativo ────────► ┌─────────────────────┐
                           │ Apenas atualiza     │
                           │ no_grupo = true     │
                           │ Sem renovar data    │
                           └─────────────────────┘
```

---

## 🔧 Configuração

### Variáveis de Ambiente

- `DEFAULT_EXPIRY_DAYS`: Dias de acesso padrão (default: 30)
- `TELEGRAM_BOT_TOKEN`: Token do bot
- `TELEGRAM_GROUP_ID`: ID do grupo (ou múltiplos separados por vírgula)

### Alterar Período de Acesso

Para alterar o período padrão de 30 dias, modifique a constante em `/src/lib/telegram-webhook.ts`:

```typescript
const DEFAULT_EXPIRY_DAYS = 30; // Alterar aqui
```

---

## ⚠️ Observações Importantes

1. **Reativação é permanente**: Uma vez reativado, o membro tem acesso por mais 30 dias completos

2. **Controle pelo link**: Se você não quer que alguém entre novamente, **não gere novo link de convite**

3. **Logs completos**: Toda reativação fica registrada na tabela `logs` para auditoria

4. **Multi-grupo**: Se sistema tem múltiplos grupos, a reativação ocorre ao entrar em **qualquer** grupo

5. **Status compartilhado**: O status e vencimento são compartilhados entre todos os grupos

---

## 📝 Histórico

- **21/11/2025**: Implementação da reativação automática
- **Razão**: Controle de acesso via link de convite (link = autorização)

---

## 🔗 Documentos Relacionados

- [COMO_USAR_O_BOT.md](./COMO_USAR_O_BOT.md) - Guia de uso do bot
- [AUTO_REGISTRO_TELEGRAM_COMPLETO.md](./AUTO_REGISTRO_TELEGRAM_COMPLETO.md) - Sistema de auto-registro
- [CONFIGURAR_LINK_GRUPO.md](./CONFIGURAR_LINK_GRUPO.md) - Configuração de links de convite
- [SYNC-MEMBERS.md](./SYNC-MEMBERS.md) - Sincronização de membros

---

🤖 Gerado com [Claude Code](https://claude.com/claude-code)
