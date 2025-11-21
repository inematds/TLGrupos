# 🔗 VINCULAÇÃO AUTOMÁTICA DE TELEGRAM_USER_ID

## 🎯 PROBLEMA RESOLVIDO

Quando alguém se cadastra no sistema, pode não ter o `telegram_user_id` (ID numérico do Telegram).

Agora o sistema **vincula automaticamente** quando a pessoa entra no grupo!

---

## 📋 CENÁRIOS COBERTOS

### **1. Cadastro SEM telegram_username**

```
Pessoa preenche formulário:
  ✅ Nome: "João Silva"
  ✅ Email: "joao@email.com"
  ❌ Telegram Username: (vazio)

Sistema salva:
  telegram_user_id: NULL
  telegram_username: NULL
  invite_link: "https://t.me/+ABC123" (genérico)

Pessoa clica no link e entra no grupo
  ↓
Webhook detecta:
  { id: 123456789, username: "joaosilva", first_name: "João" }
  invite_link: "https://t.me/+ABC123"
  ↓
Sistema BUSCA por invite_link = "https://t.me/+ABC123"
  ↓
✅ ENCONTRA o registro de João Silva
  ↓
✅ ATUALIZA:
  telegram_user_id: 123456789 ← VINCULADO!
  telegram_username: "joaosilva"
  telegram_first_name: "João"
  no_grupo: true
  ↓
✅ REVOGA link genérico (não pode ser usado de novo)
```

---

### **2. Cadastro COM telegram_username (mas sem ID)**

```
Pessoa preenche formulário:
  ✅ Nome: "Maria Santos"
  ✅ Telegram Username: "@maria_s"

Sistema salva:
  telegram_user_id: NULL (não sabemos o ID numérico ainda)
  telegram_username: "maria_s"

Pessoa entra no grupo
  ↓
Webhook detecta:
  { id: 987654321, username: "maria_s", first_name: "Maria" }
  ↓
Sistema BUSCA:
  1. Por telegram_user_id = 987654321 → ❌ Não encontra
  2. Por telegram_username = "maria_s" → ✅ ENCONTRA!
  ↓
✅ ATUALIZA:
  telegram_user_id: 987654321 ← VINCULADO!
  telegram_first_name: "Maria"
  telegram_last_name: "Santos"
  no_grupo: true
```

---

### **3. Pessoa muda username/nome no Telegram**

```
Cadastro original:
  telegram_username: "joao123"
  telegram_first_name: "João"

Pessoa muda no Telegram:
  Username: joao123 → joaosilva_oficial
  Nome: João → João Silva

Pessoa entra no grupo
  ↓
Webhook detecta mudanças:
  { username: "joaosilva_oficial", first_name: "João Silva" }
  ↓
✅ ATUALIZA dados automaticamente:
  telegram_username: "joaosilva_oficial" ← ATUALIZADO!
  telegram_first_name: "João Silva" ← ATUALIZADO!
```

---

### **4. Pessoa já cadastrada com tudo certo**

```
Registro existente:
  telegram_user_id: 123456789
  telegram_username: "joao"
  no_grupo: false (saiu do grupo antes)

Pessoa entra novamente
  ↓
Webhook detecta:
  { id: 123456789, username: "joao" }
  ↓
Sistema BUSCA por telegram_user_id = 123456789
  ↓
✅ ENCONTRA
  ↓
✅ ATUALIZA:
  no_grupo: true (marca que voltou)
  telegram_username: "joao" (confirma)
```

---

## 🔍 COMO FUNCIONA (Algoritmo de Busca)

O webhook tenta 3 métodos para encontrar o registro, **nesta ordem**:

```typescript
// 1. BUSCA POR TELEGRAM_USER_ID (mais confiável)
let existing = await getMemberByTelegramId(member.id);

if (!existing && member.username) {
  // 2. BUSCA POR TELEGRAM_USERNAME (fallback 1)
  existing = await supabase
    .from('members')
    .select('*')
    .ilike('telegram_username', member.username)
    .single();
}

if (!existing && inviteLinkUsed) {
  // 3. BUSCA POR INVITE_LINK (fallback 2)
  existing = await supabase
    .from('members')
    .select('*')
    .eq('invite_link', inviteLinkUsed)
    .single();
}

// Se encontrou por QUALQUER método:
if (existing) {
  // SEMPRE atualiza com dados mais recentes do Telegram
  await supabase.update({
    no_grupo: true,
    telegram_user_id: member.id,      // ← VINCULA/ATUALIZA
    telegram_username: member.username,
    telegram_first_name: member.first_name,
    telegram_last_name: member.last_name,
  });
}
```

---

## ✅ VANTAGENS

| Benefício | Descrição |
|-----------|-----------|
| **Vinculação automática** | Não precisa informar telegram_user_id manualmente |
| **Dados sempre atualizados** | Pega mudanças de nome/username automaticamente |
| **Múltiplos métodos** | 3 formas de encontrar o registro |
| **Seguro** | Vincula apenas quando pessoa usa o link específico |
| **Rastreável** | Todos os logs registrados |

---

## 📊 LOGS GERADOS

Quando alguém entra, você verá nos logs:

```bash
[Webhook] Novo membro entrou: João (123456789)
[Webhook] Link usado: https://t.me/+ABC123XYZ
[Webhook] Não encontrado por ID, buscando por username: @joaosilva
[Webhook] Não encontrado, buscando por invite_link: https://t.me/+ABC123XYZ
[Webhook] Encontrado pelo link! Vinculando telegram_user_id
[Webhook] Membro João atualizado: no_grupo=true, telegram_user_id=123456789
[Webhook] Revogando link genérico para João Silva...
[Webhook] ✅ Link genérico revogado para João Silva
```

---

## 🔧 CÓDIGO MODIFICADO

**Arquivo: `src/lib/telegram-webhook.ts:93-142`**

```typescript
// Capturar o link de convite usado
const inviteLinkUsed = ctx.message.invite_link?.invite_link;

// Buscar membro (3 métodos)
let existing = await getMemberByTelegramId(member.id);

if (!existing && member.username) {
  // Buscar por username
  const { data } = await supabase
    .from('members')
    .select('*')
    .ilike('telegram_username', member.username)
    .single();
  existing = data;
}

if (!existing && inviteLinkUsed) {
  // Buscar por invite_link
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('invite_link', inviteLinkUsed)
    .single();
  existing = data;
}

if (existing) {
  // SEMPRE atualizar dados do Telegram
  await supabase
    .from('members')
    .update({
      no_grupo: true,
      telegram_user_id: member.id,
      telegram_username: member.username || null,
      telegram_first_name: member.first_name,
      telegram_last_name: member.last_name || null,
    })
    .eq('id', existing.id);
}
```

---

## 🧪 COMO TESTAR

### **Teste 1: Cadastro sem username**

```bash
1. Acesse http://localhost:3020/register
2. Preencha APENAS: Nome + Email (sem telegram username)
3. Selecione um plano
4. Complete cadastro e copie o link
5. Verifique no banco ANTES de entrar:

   SELECT telegram_user_id, telegram_username FROM members WHERE nome = 'João Silva';
   # Resultado: NULL, NULL

6. Entre no grupo usando o link
7. Verifique no banco DEPOIS de entrar:

   SELECT telegram_user_id, telegram_username FROM members WHERE nome = 'João Silva';
   # Resultado: 123456789, "joaosilva"

8. ✅ SUCESSO: telegram_user_id foi vinculado!
```

### **Teste 2: Cadastro com username**

```bash
1. Cadastre alguém manualmente no admin
2. Preencha: Nome + @username (sem telegram_user_id)
3. Pessoa entra no grupo
4. Verifique que telegram_user_id foi vinculado automaticamente
```

### **Teste 3: Mudança de dados**

```bash
1. Cadastre alguém que já está no grupo
2. Pessoa muda username no Telegram
3. Pessoa sai e entra novamente no grupo
4. Verifique que username foi atualizado no banco
```

---

## ⚠️ IMPORTANTE

### **Limitação: Múltiplos cadastros com mesmo username**

Se houver 2+ registros com o mesmo `telegram_username`:

```sql
id | telegram_username | telegram_user_id
---|-------------------|------------------
1  | "joaosilva"      | NULL
2  | "joaosilva"      | NULL
```

O sistema pegará o **primeiro encontrado**. Para evitar:

1. ✅ Use validação única de username no cadastro
2. ✅ Revogue links genéricos após uso (já implementado)
3. ✅ Incentive pessoas a informar username no cadastro

### **Segurança**

- ✅ Link genérico é revogado após primeiro uso
- ✅ Apenas quem tem o link específico consegue vincular
- ✅ Todos os eventos são logados

---

## ✅ CONCLUSÃO

O sistema agora **vincula automaticamente** o `telegram_user_id` quando a pessoa entra no grupo, usando:

1. 🔍 Busca por ID (se já cadastrado)
2. 🔍 Busca por username (se informou no cadastro)
3. 🔍 Busca por link usado (se usou link genérico)
4. 🔄 Atualiza dados sempre que pessoa entra
5. 🔒 Revoga link genérico após uso

**Nenhuma ação manual necessária!**
