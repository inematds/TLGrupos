# ⚡ Guia Rápido: Alterar Grupos do Telegram

## 📝 Checklist - Execute Sempre Que Alterar Grupos

### ✅ Passo 1: Obter ID do Novo Grupo

1. Adicione `@getidsbot` ao grupo
2. Copie o ID (formato: `-1002414487357`)
3. Remova o `@getidsbot`

### ✅ Passo 2: Adicionar Bot como Admin

1. Vá em **Configurações do Grupo** → **Administradores**
2. Clique em **Adicionar Administrador**
3. Selecione seu bot
4. Marque as permissões:
   - ✅ Adicionar membros
   - ✅ Banir usuários
   - ✅ Gerenciar convites
5. Salve

### ✅ Passo 3: Editar .env.local

Abra o arquivo `.env.local` e edite a linha `TELEGRAM_GROUP_ID`:

```env
# Formato: IDs separados por vírgula (sem espaços ou com espaços, tanto faz)
TELEGRAM_GROUP_ID=-1002414487357,-1002345678901,-1002567890123
```

### ✅ Passo 4: Reiniciar o Bot

```bash
# Pare o bot atual (Ctrl+C no terminal onde está rodando)

# Inicie novamente
npm run start:bot
```

### ✅ Passo 5: Verificar Logs

Procure por esta linha no console:

```
📱 Bot configurado para X grupo(s): [ -1002414487357, -1002345678901, ... ]
🤖 [Webhook] Monitorando X grupo(s): [ -1002414487357, -1002345678901, ... ]
```

### ✅ Passo 6: Testar no Grupo

No grupo do Telegram, digite:

```
/status
```

O bot deve responder. Se não responder, verifique:
- [ ] Bot é administrador?
- [ ] Permissões corretas?
- [ ] ID está correto no .env.local?

---

## 🔄 Exemplos Rápidos

### Adicionar Mais Um Grupo

**Antes:**
```env
TELEGRAM_GROUP_ID=-1002414487357,-1002345678901
```

**Depois:**
```env
TELEGRAM_GROUP_ID=-1002414487357,-1002345678901,-1002567890123
```

### Remover Um Grupo

**Antes:**
```env
TELEGRAM_GROUP_ID=-1002414487357,-1002345678901,-1002567890123
```

**Depois:**
```env
TELEGRAM_GROUP_ID=-1002414487357,-1002345678901
```

### Substituir Todos os Grupos

**Antes:**
```env
TELEGRAM_GROUP_ID=-1002414487357,-1002345678901
```

**Depois:**
```env
TELEGRAM_GROUP_ID=-1002999888777,-1002111222333
```

---

## ⚠️ IMPORTANTE

1. **Sempre reinicie o bot** após editar `.env.local`
2. **Sempre adicione o bot como admin** antes de adicionar o ID
3. **Sempre teste** com `/status` após adicionar um grupo
4. **Não use espaços extras** (ou use, o sistema remove automaticamente)
5. **Mantenha o sinal de menos** no início do ID

---

## 🚨 Problemas Comuns

| Problema | Solução |
|----------|---------|
| Bot não responde | Verifique se é admin com permissões corretas |
| "Grupo não monitorado" | ID não está no .env.local ou bot não foi reiniciado |
| Erro ao gerar convite | Falta permissão "Gerenciar convites" |
| Erro ao remover membros | Falta permissão "Banir usuários" |

---

## 📋 Template para Anotar Grupos

Use este template para organizar seus grupos:

```
GRUPO 1:
Nome: Grupo VIP Premium
ID: -1002414487357
Descrição: Membros pagantes mensais
Status: ✅ Ativo

GRUPO 2:
Nome: Grupo Free Trial
ID: -1002345678901
Descrição: Trial de 7 dias
Status: ✅ Ativo

GRUPO 3:
Nome: Grupo Parceiros
ID: -1002567890123
Descrição: Parceiros e afiliados
Status: ⏸️ Pausado
```

---

## 🔗 Documentação Completa

Para mais detalhes, consulte:
- [CONFIGURAR_MULTIPLOS_GRUPOS.md](./CONFIGURAR_MULTIPLOS_GRUPOS.md) - Guia completo
- [COMO_ADICIONAR_BOT_EM_GRUPOS.md](./COMO_ADICIONAR_BOT_EM_GRUPOS.md) - Como adicionar bot

---

**Última atualização:** 2025-11-21

🤖 Gerado com [Claude Code](https://claude.com/claude-code)
