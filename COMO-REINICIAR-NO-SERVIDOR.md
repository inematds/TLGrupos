# 🔄 Como Reiniciar o Sistema no Servidor VPS

## 📋 Passo a Passo

### 1. Conectar no Servidor via SSH

```bash
ssh usuario@157.180.72.42
```

### 2. Ir para o Diretório do Projeto

```bash
cd /caminho/do/projeto/TLGrupos
```

### 3. Atualizar Código do GitHub

```bash
git pull origin main
```

### 4. Instalar Dependências (se necessário)

```bash
npm install
```

### 5. Reiniciar Tudo

```bash
./restart-all.sh
```

**Ou executar comandos individuais**:

```bash
# Parar tudo
./stop-all.sh

# Iniciar tudo
./start-all.sh
```

---

## 🛠️ Scripts Disponíveis

### `./start-all.sh`
Inicia todo o sistema:
- Next.js (Dashboard) na porta 3000
- Bot do Telegram

### `./stop-all.sh`
Para todo o sistema:
- Mata processos na porta 3000
- Para o bot do Telegram

### `./restart-all.sh`
Reinicia tudo (stop + start)

### `./status.sh`
Mostra status do sistema:
- Bot rodando ou não
- Next.js rodando ou não
- Porta 3000 em uso ou livre

---

## 📊 Verificar Status

```bash
./status.sh
```

Saída esperada:
```
📊 Status do TLGrupos
═══════════════════════════════════════════════════
🤖 Bot do Telegram:
   ✅ Bot está rodando (PID: 12345)

🌐 Next.js (Dashboard):
   ✅ Next.js está rodando (PID: 12346)

🔌 Porta 3000:
   ✅ Em uso (Dashboard acessível)
   🌐 http://157.180.72.42
```

---

## 🔍 Ver Logs em Tempo Real

### Logs do Next.js (Dashboard)
```bash
tail -f logs/nextjs.log
```

### Logs do Bot
```bash
tail -f logs/bot.log
```

---

## 🚨 Troubleshooting

### Erro: "Porta 3000 já em uso"

```bash
# Descobrir o processo
lsof -ti:3000

# Matar o processo
kill -9 $(lsof -ti:3000)

# Reiniciar
./start-all.sh
```

### Erro: "Build falhou"

```bash
# Limpar cache
rm -rf .next node_modules

# Reinstalar dependências
npm install

# Tentar build novamente
npm run build

# Se ainda falhar, iniciar em modo dev
npm run dev
```

### Erro: "Bot não conecta"

Verifique `.env.local`:
```bash
cat .env.local | grep TELEGRAM
```

Certifique-se que tem:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_GROUP_ID`

---

## 📝 Comandos Úteis Adicionais

### Verificar Processos Node.js Rodando
```bash
ps aux | grep node
```

### Matar Todos os Processos Node.js (CUIDADO!)
```bash
pkill -9 node
```

### Verificar Porta 3000
```bash
lsof -i:3000
```

### Reiniciar Nginx (se usar)
```bash
sudo systemctl restart nginx
```

---

## 🔄 Fluxo Completo de Deploy

1. **No seu computador local**:
   ```bash
   git add -A
   git commit -m "Suas mudanças"
   git push origin main
   ```

2. **No servidor VPS**:
   ```bash
   cd /caminho/do/projeto/TLGrupos
   git pull origin main
   npm install  # se houver novas dependências
   ./restart-all.sh
   ```

3. **Verificar**:
   ```bash
   ./status.sh
   ```

4. **Testar**:
   - Acesse: http://157.180.72.42
   - Teste o bot no Telegram

---

## 💡 Dicas

- **Sempre faça `git pull` antes de reiniciar** para pegar as últimas mudanças
- **Use `./status.sh`** frequentemente para verificar se está tudo rodando
- **Mantenha os logs abertos** em um terminal separado durante deploys:
  ```bash
  tail -f logs/nextjs.log logs/bot.log
  ```

---

## 📞 Checklist Rápido

Quando algo não funciona:

- [ ] `./status.sh` - Ver o que está rodando
- [ ] `./stop-all.sh` - Parar tudo
- [ ] `git pull` - Atualizar código
- [ ] `npm install` - Atualizar dependências
- [ ] `./start-all.sh` - Iniciar tudo
- [ ] Verificar logs em `logs/`
- [ ] Testar no navegador: http://157.180.72.42
- [ ] Testar bot no Telegram

---

**Data**: 2025-11-27
**Sistema**: TLGrupos
**Servidor**: 157.180.72.42
