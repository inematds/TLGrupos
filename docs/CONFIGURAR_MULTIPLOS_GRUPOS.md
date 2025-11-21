# 🔧 Configurar Múltiplos Grupos Telegram

## 📋 Visão Geral

O bot TLGrupos suporta **múltiplos grupos simultaneamente** usando uma única variável de ambiente com IDs separados por vírgula.

---

## ⚙️ Configuração

### 1. Formato da Variável de Ambiente

No arquivo `.env.local`, configure `TELEGRAM_GROUP_ID` com um ou mais IDs separados por vírgula:

#### Um grupo único (configuração tradicional):
```env
TELEGRAM_GROUP_ID=-1002414487357
```

#### Múltiplos grupos:
```env
TELEGRAM_GROUP_ID=-1002414487357,-1002345678901,-1002567890123
```

### 2. Formato dos IDs

- IDs de grupos do Telegram sempre começam com `-100`
- Formato completo: `-100XXXXXXXXXX` (números negativos)
- Não adicione espaços antes/depois das vírgulas (espaços são removidos automaticamente)
- Exemplos válidos:
  - `-1002414487357`
  - `-1002414487357,-1002345678901`
  - `-1002414487357, -1002345678901, -1002567890123` (espaços são aceitos)

---

## 🔍 Como Obter o ID de um Grupo

### Método 1: Usando @getidsbot (Recomendado)
1. Adicione o bot `@getidsbot` ao seu grupo
2. O bot enviará automaticamente o ID do grupo
3. O ID terá formato: `-1002414487357`
4. Copie o ID completo (incluindo o `-`)
5. Remova o `@getidsbot` do grupo

### Método 2: Usando @userinfobot
1. Adicione o bot `@userinfobot` ao seu grupo
2. Digite `/start` no grupo
3. O bot mostrará o ID do grupo
4. Copie o ID completo
5. Remova o bot do grupo

### Método 3: Via Telegram Web
1. Abra o grupo no Telegram Web (web.telegram.org)
2. Veja a URL: `https://web.telegram.org/k/#-1002414487357`
3. O número no final é o ID do grupo (com o `-`)

---

## 🚀 Passo a Passo Completo

### 1. Adicionar o Bot nos Grupos

Para cada grupo que deseja monitorar:

1. Abra o grupo no Telegram
2. Adicione o bot: `@seu_bot_username`
3. **Promova o bot a Administrador** (OBRIGATÓRIO)
4. Conceda as permissões:
   - ✅ Adicionar membros
   - ✅ Banir usuários
   - ✅ Gerenciar convites
   - ✅ Deletar mensagens (opcional)

### 2. Obter os IDs dos Grupos

Para cada grupo:
1. Use `@getidsbot` para obter o ID
2. Anote os IDs em um lugar seguro

Exemplo:
```
Grupo VIP Premium: -1002414487357
Grupo Free Trial: -1002345678901
Grupo Parceiros: -1002567890123
```

### 3. Atualizar .env.local

Edite o arquivo `.env.local` e adicione todos os IDs separados por vírgula:

```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_GROUP_ID=-1002414487357,-1002345678901,-1002567890123
```

### 4. Reiniciar o Bot

Após editar `.env.local`, reinicie o bot:

```bash
# Parar o bot atual (Ctrl+C)
# Iniciar novamente
npm run start:bot
```

Você verá no console:
```
📱 Bot configurado para 3 grupo(s): [ -1002414487357, -1002345678901, -1002567890123 ]
🤖 [Webhook] Monitorando 3 grupo(s): [ -1002414487357, -1002345678901, -1002567890123 ]
```

### 5. Testar em Cada Grupo

Para cada grupo, teste os comandos:

```
/status - Verifica seu cadastro
/registrar - Auto-registro no sistema
/cadastro - Link do formulário de cadastro
```

---

## 🎯 Como Funciona

### Dados Compartilhados

O sistema mantém **dados de membros compartilhados** entre todos os grupos:

- **Um membro pode estar em múltiplos grupos**
- **Status e data de vencimento são únicos** (compartilhados entre grupos)
- **Se vencido em um grupo, é removido de TODOS os grupos**

### Exemplo de Fluxo

1. João se cadastra no "Grupo VIP Premium" (ID: -1002414487357)
2. João recebe 30 dias de acesso
3. João também é adicionado ao "Grupo Parceiros" (ID: -1002567890123)
4. O sistema identifica que é o mesmo João (pelo telegram_user_id)
5. Mantém o mesmo vencimento de 30 dias
6. Quando João vencer, será removido de AMBOS os grupos automaticamente

### Detecção de Eventos

O bot detecta eventos em **TODOS os grupos configurados**:

- ✅ Novos membros entrando
- ✅ Membros saindo
- ✅ Mensagens (se Privacy Mode estiver desabilitado)
- ✅ Comandos (`/status`, `/registrar`, etc.)

---

## 📊 Logs e Monitoramento

Ao iniciar o bot, você verá:

```bash
📱 Bot configurado para 3 grupo(s): [ -1002414487357, -1002345678901, -1002567890123 ]
🤖 [Webhook] Monitorando 3 grupo(s): [ -1002414487357, -1002345678901, -1002567890123 ]
Bot Telegram iniciado com sucesso!
```

Quando eventos ocorrem:

```bash
[Webhook] Novo membro em -1002414487357: João Silva
[Webhook] Comando /status de Maria (987654321) no grupo -1002345678901
[Webhook] Membro saiu de -1002567890123: Pedro
```

---

## 🔧 Detalhes Técnicos

### Implementação

Os arquivos modificados para suportar múltiplos grupos:

1. `/src/lib/telegram.ts`:
   - Constante `GROUP_IDS` (array com todos os IDs)
   - Constante `GROUP_ID` (primeiro ID, para compatibilidade)

2. `/src/lib/telegram-webhook.ts`:
   - Verificação `if (!GROUP_IDS.includes(chatId))` em 3 handlers:
     - Handler de novos membros (new_chat_members)
     - Handler de saída de membros (left_chat_member)
     - Handler de mensagens (message)

### Código de Verificação

```typescript
// Parseia a variável de ambiente
const GROUP_IDS = process.env.TELEGRAM_GROUP_ID!
  .split(',')
  .map(id => parseInt(id.trim()))
  .filter(id => !isNaN(id));

// Verifica se o chat é monitorado
const chatId = ctx.chat.id;
if (!GROUP_IDS.includes(chatId)) return;
```

---

## ⚠️ Observações Importantes

### 1. Privacy Mode

Se o bot não recebe mensagens de texto (apenas comandos com `/`):

1. Abra o @BotFather
2. Digite `/mybots`
3. Selecione seu bot
4. Vá em **Bot Settings** → **Group Privacy**
5. Escolha **Turn OFF**
6. Confirme a alteração

### 2. Permissões de Administrador

O bot **DEVE ser administrador** em TODOS os grupos. Sem permissões de admin:
- ❌ Não pode gerar links de convite
- ❌ Não pode remover membros vencidos
- ❌ Não pode detectar eventos corretamente

### 3. Limite de Grupos

Não há limite técnico no código, mas considere:
- Cada grupo adiciona carga de processamento
- Mantenha um número gerenciável (recomendado: até 10 grupos)
- Para mais de 10 grupos, considere usar múltiplos bots

### 4. Sincronização de Status

- Status do membro é **global** (compartilhado entre grupos)
- Data de vencimento é **global**
- Flags de notificação são **globais**
- Se renovado em um grupo, renova em todos

---

## 🚨 Problemas Comuns

### Bot não responde em um dos grupos

**Causa:** Bot não é administrador naquele grupo
**Solução:** Promova o bot a administrador com permissões corretas

### Mensagem "Grupo não monitorado"

**Causa:** ID do grupo não está em TELEGRAM_GROUP_ID
**Solução:**
1. Verifique o ID do grupo com @getidsbot
2. Adicione o ID à variável de ambiente
3. Reinicie o bot

### Bot funciona em um grupo mas não em outro

**Causa:** Privacy Mode pode estar interferindo
**Solução:** Desabilite Privacy Mode no @BotFather

### Erro ao parsear IDs

**Causa:** Formato incorreto na variável de ambiente
**Solução:**
- Use apenas números negativos
- Separe com vírgula
- Não use aspas ou caracteres especiais
- Formato correto: `-1002414487357,-1002345678901`

---

## 🔄 Adicionar/Remover Grupos

### Adicionar Novo Grupo

1. Adicione o bot ao novo grupo
2. Promova a administrador
3. Obtenha o ID com @getidsbot
4. Edite `.env.local` e adicione o ID:
   ```env
   TELEGRAM_GROUP_ID=-1002414487357,-1002345678901,-NOVO_ID_AQUI
   ```
5. Reinicie o bot
6. Teste com `/status` no novo grupo

### Remover Grupo

1. Edite `.env.local` e remova o ID
2. Reinicie o bot
3. (Opcional) Remova o bot do grupo no Telegram

---

## 📝 Exemplo Completo

### Cenário: Adicionar 3 grupos

```bash
# 1. Obter IDs dos grupos
Grupo Principal: -1002414487357
Grupo VIP: -1002345678901
Grupo Trial: -1002567890123

# 2. Editar .env.local
TELEGRAM_BOT_TOKEN=8211881890:AAHY6UJ2tXIRMxpVpDHGNMDDOna5DPHM3mI
TELEGRAM_GROUP_ID=-1002414487357,-1002345678901,-1002567890123

# 3. Reiniciar bot
npm run start:bot

# 4. Verificar logs
📱 Bot configurado para 3 grupo(s): [ -1002414487357, -1002345678901, -1002567890123 ]
✅ Bot iniciado com sucesso!

# 5. Testar em cada grupo
# No Grupo Principal: /status
# No Grupo VIP: /status
# No Grupo Trial: /status
```

---

## 🔗 Documentos Relacionados

- [COMO_ADICIONAR_BOT_EM_GRUPOS.md](./COMO_ADICIONAR_BOT_EM_GRUPOS.md) - Como adicionar bot e obter IDs
- [COMO_USAR_O_BOT.md](./COMO_USAR_O_BOT.md) - Comandos disponíveis
- [AUTO_REGISTRO_TELEGRAM_COMPLETO.md](./AUTO_REGISTRO_TELEGRAM_COMPLETO.md) - Sistema de auto-registro
- [REATIVACAO_AUTOMATICA.md](./REATIVACAO_AUTOMATICA.md) - Reativação de membros removidos

---

🤖 Gerado com [Claude Code](https://claude.com/claude-code)
