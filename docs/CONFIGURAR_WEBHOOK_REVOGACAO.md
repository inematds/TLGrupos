# 🔗 LINKS ÚNICOS AUTOMÁTICOS

## ✅ SISTEMA SIMPLIFICADO

Todos os links agora são **únicos** (`member_limit: 1`), mesmo quando não há `telegram_user_id`.

**O Telegram garante que cada link só pode ser usado uma vez!** Não precisa revogar manualmente.

---

## 🎯 COMO FUNCIONA

### **Quando Alguém Entra no Grupo:**

```
1. João se cadastra (com ou sem telegram_username)
   ↓
2. Sistema gera link ÚNICO (member_limit = 1)
   ↓
3. João entra no grupo usando o link
   ↓
4. Telegram AUTOMATICAMENTE invalida o link (1 uso)
   ↓
5. Bot detecta nova entrada (telegram-webhook.ts)
   ↓
6. Sistema vincula telegram_user_id ao registro
   ↓
7. Sistema marca link como usado no banco
   ↓
8. Outras pessoas NÃO conseguem usar (Telegram bloqueia)
```

---

## 📋 PASSO A PASSO DE CONFIGURAÇÃO

### **1. Execute o SQL no Supabase**

Siga as instruções em `EXECUTAR_SQL_INVITE_LINK.md`:

```bash
# Acesse: https://supabase.com/dashboard/project/xetowlvhhnxewvglxklo/editor
# Execute o SQL para adicionar as colunas:
# - invite_link
# - invite_link_revoked
# - invite_link_type
```

### **2. Pronto!**

Não precisa fazer mais nada. O sistema já está configurado para:

✅ Gerar links únicos (member_limit = 1) para todos
✅ Telegram invalida links automaticamente após 1 uso
✅ Vincular telegram_user_id quando pessoa entra
✅ Auto-cadastrar membros não cadastrados
✅ Registrar logs de todas as ações

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### **Teste Completo:**

1. Acesse http://localhost:3020/register
2. Preencha formulário **SEM** telegram_username
3. Selecione um plano
4. Complete cadastro
5. Copie o link gerado
6. Entre no grupo usando o link
7. Verifique logs do servidor:

```bash
# Você deve ver algo como:
[Webhook] Novo membro entrou: João (123456789)
[Webhook] Link usado: https://t.me/+ABC123XYZ
[Webhook] Encontrado pelo link! Vinculando telegram_user_id
[Webhook] Membro João atualizado: no_grupo=true, telegram_user_id=123456789
[Webhook] Link marcado como usado (expira automaticamente)
```

8. Tente usar o link novamente:
   - ❌ Deve dar erro "Link inválido"

9. Verifique no banco:

```sql
SELECT nome, invite_link, invite_link_type, invite_link_revoked
FROM members
WHERE nome = 'João Silva';

-- Resultado esperado:
-- invite_link_revoked = true
```

---

## 🔧 CÓDIGO MODIFICADO

### **Arquivo: `src/lib/telegram-webhook.ts:104-149`**

A lógica de revogação foi integrada no handler de `new_chat_members`:

```typescript
// REVOGAÇÃO AUTOMÁTICA DE LINKS GENÉRICOS
if (
  existing.invite_link &&
  existing.invite_link_type === 'generic' &&
  !existing.invite_link_revoked
) {
  console.log(`[Webhook] Revogando link genérico para ${existing.nome}...`);

  try {
    // Revogar link no Telegram
    await bot.telegram.revokeChatInviteLink(GROUP_ID, existing.invite_link);

    // Atualizar banco
    await supabase
      .from('members')
      .update({ invite_link_revoked: true })
      .eq('id', existing.id);

    // Registrar log
    await supabase.from('logs').insert({
      member_id: existing.id,
      acao: 'link_revogado',
      detalhes: {
        link: existing.invite_link,
        tipo: 'generic',
        motivo: 'primeiro_uso',
      },
      executado_por: 'sistema',
    });

    console.log(`[Webhook] ✅ Link genérico revogado para ${existing.nome}`);
  } catch (error: any) {
    console.error('[Webhook] Erro ao revogar link:', error);
    // ...registra erro
  }
}
```

---

## 📊 CENÁRIOS COBERTOS

| Cenário | Comportamento |
|---------|---------------|
| **Cadastro COM telegram_username** | ✅ Link único (member_limit = 1, expira em 7 dias) |
| **Cadastro SEM telegram_username** | ✅ Link único (member_limit = 1, expira em 7 dias) |
| **Pessoa usa o link e entra** | ✅ Telegram invalida automaticamente (1 uso) |
| **Pessoa tenta usar link de novo** | ❌ Telegram bloqueia (link já usado) |
| **Pessoa NÃO cadastrada entra** | ✅ Auto-cadastrada (30 dias) |
| **Pessoa já cadastrada entra novamente** | ✅ Marca `no_grupo = true`, atualiza dados |

---

## 🎉 VANTAGENS

✅ **Todos os links são únicos** - member_limit = 1 para todos
✅ **Telegram garante segurança** - Não precisa revogar manualmente
✅ **Mais simples** - Menos código, menos complexidade
✅ **Vinculação automática** - telegram_user_id vinculado ao entrar
✅ **Rastreamento pelo link** - Sabe exatamente quem usou qual link
✅ **Auto-registro** continua funcionando normalmente
✅ **Logs unificados** - Tudo no mesmo lugar

---

## 🛠️ ARQUIVOS MODIFICADOS

- ✅ `src/lib/telegram-webhook.ts:104-149` - Adicionada lógica de revogação
- ✅ `src/types/index.ts:33-35` - Adicionados campos de invite_link
- ✅ `src/services/member-service.ts:163-188` - Salva link gerado
- ✅ `src/app/api/telegram/invite-link/route.ts:38-46` - Salva link genérico
- ✅ `supabase/migrations/013_add_invite_link_tracking.sql` - Novas colunas

---

## ⚠️ IMPORTANTE

### **Webhook já está configurado?**

Se você já tem o bot rodando e processando mensagens no grupo, **não precisa configurar nada novo**.

O sistema de revogação usa o **mesmo webhook** do auto-registro.

### **Caso o bot não esteja rodando:**

Verifique se o bot está sendo inicializado. Procure por algo como:

```typescript
// scripts/start-bot.ts ou similar
import bot from '@/lib/telegram-webhook';

bot.launch();
```

---

## 🐛 TROUBLESHOOTING

### Link não expira após uso

- O Telegram garante `member_limit = 1` automaticamente
- Se conseguir usar 2x, verifique se são links diferentes
- Veja nos logs qual link foi usado em cada entrada

### Auto-registro parou de funcionar

- Improvável, a lógica foi ADICIONADA, não substituída
- Verifique logs de erro no servidor

### Erro "Column not found: invite_link"

- Execute o SQL em `EXECUTAR_SQL_INVITE_LINK.md`

---

## ✅ CONCLUSÃO

O sistema agora gera **links únicos para todos** (member_limit = 1).

**Benefícios:**
- ✅ Telegram garante que cada link só pode ser usado 1 vez
- ✅ Não precisa revogar manualmente
- ✅ Mais simples e seguro
- ✅ Vinculação automática de telegram_user_id

**Para ativar:**
1. Execute SQL (EXECUTAR_SQL_INVITE_LINK.md)
2. Certifique-se que o bot está rodando
3. Teste o fluxo de registro

**Nenhuma configuração adicional necessária!**
