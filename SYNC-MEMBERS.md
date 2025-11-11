# 🔄 Sincronização de Membros do Telegram

## ⚠️ Limitação Importante da API do Telegram

A **Bot API do Telegram** tem limitações de privacidade que impedem listar todos os membros de um grupo:

- ✅ **Pode**: Listar administradores
- ✅ **Pode**: Buscar info de um membro específico (se souber o ID)
- ❌ **NÃO pode**: Listar todos os membros regulares automaticamente

Por isso, você tem **3 opções** para sincronizar membros:

---

## 📋 Opção 1: Sincronizar Administradores (Automático)

Esta é a forma mais simples. Sincroniza automaticamente todos os administradores do grupo.

### Via Terminal:

```bash
npm run sync:members -- --admins
```

### Via API:

```bash
curl -X POST http://localhost:3001/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "admins",
    "defaultExpiryDays": 30
  }'
```

**Vantagens:**
- ✅ Totalmente automático
- ✅ Não precisa de IDs

**Desvantagens:**
- ❌ Só pega administradores (não membros comuns)

---

## 📋 Opção 2: Sincronizar Lista de IDs Específicos

Você fornece os IDs dos membros e o sistema busca as informações deles.

### Como obter os IDs dos membros:

#### Método 1: Via @userinfobot (Recomendado)

1. Peça para cada membro abrir conversa com [@userinfobot](https://t.me/userinfobot)
2. O bot envia as informações incluindo o ID numérico
3. Anote os IDs

#### Método 2: Via @RawDataBot

1. Membro envia qualquer mensagem para [@RawDataBot](https://t.me/rawdatabot)
2. Bot retorna JSON com todas as informações
3. Procure por `"id": 123456789`

#### Método 3: Criar Bot Auxiliar

Posso criar um bot que quando alguém envia `/start` ele responde com o ID.

### Sincronizar via Terminal:

```bash
# Passar IDs direto na linha de comando
npm run sync:members -- --ids "123456789,987654321,555666777"

# Ou usar arquivo
# 1. Copie o exemplo
cp members.txt.example members.txt

# 2. Edite members.txt e adicione os IDs (um por linha)
nano members.txt

# 3. Execute
npm run sync:members -- --file members.txt
```

### Sincronizar via API:

```bash
curl -X POST http://localhost:3001/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "ids",
    "ids": [123456789, 987654321, 555666777],
    "defaultExpiryDays": 30
  }'
```

**Vantagens:**
- ✅ Funciona com qualquer membro
- ✅ Total controle sobre quem sincronizar

**Desvantagens:**
- ❌ Precisa coletar os IDs manualmente

---

## 📋 Opção 3: Auto-Captura (Webhook do Bot)

Configure o bot para **automaticamente cadastrar** novos membros quando eles entram no grupo.

**Status**: Posso implementar se você quiser!

Funcionaria assim:
1. Bot monitora eventos do grupo
2. Quando alguém entra → Automaticamente cria no banco
3. Você só define a data de vencimento padrão

---

## 🎯 Exemplos Práticos

### Exemplo 1: Sincronizar apenas admins

```bash
npm run sync:members -- --admins --days 90
```

Resultado:
```
🎯 TLGrupos - Sincronização de Membros

📊 Total de membros no grupo: 45

📋 Buscando administradores do grupo...

📊 Encontrados 3 administradores (excluindo bots)

  ✅ Criado: João Silva (123456789) - vence em 09/02/2026
  ⏭️  Membro Maria Santos (987654321) já existe - pulando
  ✅ Criado: Pedro Costa (555666777) - vence em 09/02/2026

==================================================
📊 RESULTADO DA SINCRONIZAÇÃO

Total processados: 3
✅ Criados: 2
🔄 Atualizados: 0
⏭️  Já existiam: 1
❌ Erros: 0
==================================================
```

### Exemplo 2: Sincronizar de arquivo

```bash
# 1. Crie o arquivo members.txt
cat > members.txt << EOF
# Membros do grupo
123456789
987654321
555666777
444333222
EOF

# 2. Execute
npm run sync:members -- --file members.txt --days 60
```

### Exemplo 3: Sincronizar via API

```javascript
// No frontend ou outro sistema
async function syncMembers() {
  const response = await fetch('http://localhost:3001/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'ids',
      ids: [123456789, 987654321],
      defaultExpiryDays: 30,
    }),
  });

  const result = await response.json();
  console.log(result);
}
```

---

## 🔍 Verificar Quantos Membros Tem no Grupo

### Via API:

```bash
curl http://localhost:3001/api/sync
```

Resposta:
```json
{
  "success": true,
  "data": {
    "totalMembersInGroup": 45
  }
}
```

---

## 💡 Recomendações

### Primeiro Setup (Grupo Já Existente):

1. **Sincronize os admins primeiro:**
   ```bash
   npm run sync:members -- --admins
   ```

2. **Colete os IDs dos membros comuns:**
   - Envie mensagem pedindo para cada membro enviar `/start` para @userinfobot
   - Anote os IDs

3. **Sincronize os IDs:**
   ```bash
   npm run sync:members -- --ids "id1,id2,id3,..."
   ```

### Para Novos Membros:

**Opção A: Manual**
- Use o formulário web em `/dashboard`
- Preencha nome, data, Telegram ID
- Sistema gera link de convite

**Opção B: Automático (Implementar webhook)**
- Bot detecta quando alguém entra
- Cria automaticamente no banco
- Você só ajusta data de vencimento depois

---

## 🚨 Troubleshooting

### Erro: "Unauthorized" ou "Forbidden"

**Causa**: Bot não tem permissão de administrador

**Solução**:
1. Vá em configurações do grupo
2. Administradores → Adicionar administrador
3. Adicione seu bot
4. Dê permissões de "Adicionar usuários" e "Banir usuários"

### Erro: "Chat not found"

**Causa**: GROUP_ID incorreto no `.env.local`

**Solução**:
1. Adicione @RawDataBot ao grupo
2. Copie o `chat_id`
3. Atualize `TELEGRAM_GROUP_ID` no `.env.local`

### Membros não aparecem

**Causa**: API do Telegram só lista admins automaticamente

**Solução**: Use a Opção 2 (sincronizar com IDs)

---

## ❓ FAQ

**P: Por que não consigo ver todos os membros do grupo?**

R: A Bot API do Telegram não permite isso por privacidade. Você precisa ter os IDs dos membros.

**P: Como obter os IDs de todos os membros?**

R: Peça para cada membro enviar uma mensagem para @userinfobot. Ele responderá com o ID.

**P: Posso automatizar isso?**

R: Sim! Posso criar um webhook que auto-cadastra quando alguém entra no grupo.

**P: Quanto tempo os membros têm por padrão?**

R: 30 dias, mas você pode mudar com `--days 60` ou no parâmetro `defaultExpiryDays`.

**P: E se eu adicionar alguém que já existe?**

R: O sistema detecta e pula (não duplica).

---

## 🎯 Próximos Passos

Quer que eu implemente alguma dessas funcionalidades?

1. **Webhook automático** - Auto-cadastrar quando alguém entra
2. **Bot auxiliar de coleta** - Bot que responde com ID quando recebe /start
3. **Interface web de sincronização** - Botão no dashboard para sincronizar
4. **Importação de CSV** - Upload de planilha com dados dos membros

Me diga o que você precisa! 🚀
