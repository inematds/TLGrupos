# 📱 Como Adicionar o Bot em Múltiplos Grupos Telegram

## Passo 1: Adicionar o Bot como Administrador

Para que o bot funcione corretamente em um grupo, você precisa:

### 1.1 Adicionar o bot ao grupo
1. Abra o grupo Telegram onde deseja adicionar o bot
2. Clique em "Adicionar membro"
3. Procure pelo seu bot: `@seu_bot_username`
4. Adicione o bot ao grupo

### 1.2 Promover o bot a Administrador
**IMPORTANTE:** O bot PRECISA ser administrador para funcionar!

1. Vá em **Configurações do Grupo** (ícone de 3 pontinhos)
2. Clique em **"Administradores"**
3. Clique em **"Adicionar Administrador"**
4. Selecione o seu bot
5. Marque as seguintes permissões:
   - ✅ **Adicionar membros** (para gerar convites)
   - ✅ **Banir usuários** (para remover membros vencidos)
   - ✅ **Gerenciar convites** (para criar links de convite)
   - ✅ **Deletar mensagens** (opcional, para moderar)
6. Clique em **"Salvar"**

---

## Passo 2: Obter o ID do Grupo

Para cadastrar o grupo no sistema, você precisa do ID numérico do grupo:

### Método 1: Usando @getidsbot (Recomendado)
1. Adicione o bot `@getidsbot` ao seu grupo
2. O bot enviará automaticamente uma mensagem com o ID
3. O ID terá formato: `-1002414487357` (sempre começa com `-100`)
4. **Copie o ID completo** (incluindo o sinal de menos `-`)
5. Remova o `@getidsbot` do grupo

### Método 2: Usando @userinfobot
1. Adicione o bot `@userinfobot` ao seu grupo
2. Digite `/start` no grupo
3. O bot mostrará o ID do grupo
4. Copie o ID completo
5. Remova o bot do grupo

---

## Passo 3: Cadastrar o Grupo no Sistema

1. Acesse o dashboard: `http://192.168.1.91:3000/dashboard/grupos`
2. Clique em **"Adicionar Grupo"**
3. Preencha os campos:
   - **Nome do Grupo**: Um nome amigável (ex: "Grupo VIP Premium")
   - **ID do Grupo Telegram**: Cole o ID que você copiou (ex: `-1002414487357`)
   - **Descrição**: Informação opcional sobre o grupo
   - **Grupo Ativo**: Marque para ativar o grupo
   - **Auto-Remoção Habilitada**: Marque se quiser remoção automática de vencidos
   - **Horário de Auto-Remoção**: Defina quando executar a remoção (padrão: 00:00)
4. Clique em **"Criar Grupo"**

---

## Passo 4: Testar o Bot no Novo Grupo

Vá ao grupo Telegram e teste os comandos:

### Comandos disponíveis:
- `/start` - Mensagem de boas-vindas
- `/cadastro` - Link para formulário de cadastro completo
- `/registrar` - Auto-registro rápido no sistema
- `/entrar` - Gera link de convite para o grupo
- `/status` - Verifica status da sua assinatura

### Exemplo de teste:
1. No grupo, digite: `/status`
2. O bot deve responder com suas informações
3. Se não responder, verifique se o bot é administrador

---

## ✅ Checklist de Verificação

Antes de considerar o grupo configurado, verifique:

- [ ] Bot adicionado ao grupo
- [ ] Bot promovido a **Administrador**
- [ ] Permissões corretas concedidas (adicionar membros, banir, gerenciar convites)
- [ ] ID do grupo obtido corretamente (formato: `-100XXXXXXXXXX`)
- [ ] Grupo cadastrado no sistema via `/dashboard/grupos`
- [ ] Status do grupo marcado como **Ativo**
- [ ] Bot responde aos comandos no grupo

---

## 🚨 Problemas Comuns

### Bot não responde aos comandos
**Causa:** Bot não é administrador
**Solução:** Promova o bot a administrador com as permissões corretas

### Erro ao gerar convite
**Causa:** Bot não tem permissão de "Gerenciar convites"
**Solução:** Edite as permissões do bot e marque "Gerenciar convites"

### Erro ao remover membros
**Causa:** Bot não tem permissão de "Banir usuários"
**Solução:** Edite as permissões do bot e marque "Banir usuários"

### Bot não detecta novos membros
**Causa:** Grupo privado sem bot configurado para receber eventos
**Solução:** Certifique-se que o bot está rodando (verifique logs)

### ID do grupo não funciona
**Causa:** ID copiado incorretamente (faltou o `-` ou parte do número)
**Solução:** Copie novamente o ID completo, incluindo o sinal de menos

---

## 📊 Logs e Monitoramento

Para verificar se o bot está funcionando:

1. Verifique os logs do bot:
   ```bash
   npm run start:bot
   ```

2. Procure por mensagens como:
   ```
   [Bot] Iniciado e escutando comandos em múltiplos grupos
   [Comando] /status de João (123456789) no grupo -1002414487357
   ```

3. Se ver erros de permissão, verifique as permissões de administrador

---

## 🎯 Grupos Múltiplos

O sistema suporta **múltiplos grupos simultaneamente**!

- Cada grupo pode ter configurações independentes
- Auto-remoção pode ser habilitada/desabilitada por grupo
- Horários de remoção podem ser diferentes para cada grupo
- Cada membro é vinculado ao grupo onde se cadastrou (via `group_id`)

Para adicionar mais grupos, repita os passos 1-4 para cada grupo novo.

---

## 💡 Dicas

1. **Nomes descritivos**: Use nomes claros para diferenciar os grupos (ex: "VIP Mensal", "VIP Trimestral", "Free Trial")
2. **Documentação**: Anote os IDs dos grupos para referência futura
3. **Backup**: Salve uma lista dos grupos e seus IDs em um lugar seguro
4. **Teste sempre**: Após adicionar um grupo, sempre teste os comandos básicos
5. **Monitore os logs**: Mantenha o bot rodando e monitore os logs para detectar problemas

---

## 📞 Comandos Úteis do Bot

### Para Membros:
- `/cadastro` - Fazer cadastro completo
- `/status` - Ver status da assinatura
- `/entrar` - Obter link de convite

### Para Administradores (no privado do bot):
- `/sync` - Sincronizar membros do grupo com o banco
- `/stats` - Ver estatísticas do sistema

---

**Última atualização:** 2025-01-21
