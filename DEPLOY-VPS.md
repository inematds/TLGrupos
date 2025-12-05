# 🚀 Guia de Deploy na VPS - TLGrupos v1.1.0

## 📋 Pré-requisitos

- ✅ VPS com acesso SSH (IP: 157.180.72.42)
- ✅ Node.js 18+ instalado
- ✅ Git configurado
- ✅ PM2 instalado globalmente
- ✅ Arquivo `.env.local` configurado

---

## 🔧 Passo a Passo para Deploy

### 1️⃣ **Conectar na VPS**
```bash
ssh seu-usuario@157.180.72.42
```

### 2️⃣ **Navegar para o diretório do projeto**
```bash
cd /caminho/do/projeto/TLGrupos
```

### 3️⃣ **Atualizar código do GitHub**
```bash
git pull origin main
```

**Saída esperada:**
```
remote: Enumerating objects: X, done.
remote: Counting objects: 100% (X/X), done.
remote: Compressing objects: 100% (X/X), done.
Updating 5887aa0..e957660
Fast-forward
 src/app/api/payments/route.ts    | 3 +--
 src/app/novo-membro/page.tsx     | 18 +++++++++++++-----
 2 files changed, 17 insertions(+), 4 deletions(-)
```

### 4️⃣ **Instalar PM2 (se ainda não tiver)**
```bash
npm install -g pm2
```

### 5️⃣ **Startar o sistema**
```bash
chmod +x prod-start.sh
./prod-start.sh
```

**O script irá:**
- ✅ Verificar dependências
- ✅ Fazer `npm install` se necessário
- ✅ Executar `npm run build`
- ✅ Iniciar Dashboard com PM2 (porta 3000)
- ✅ Iniciar Bot Telegram com PM2
- ✅ Salvar configuração do PM2

**Saída esperada:**
```
🚀 Iniciando TLGrupos (PRODUÇÃO com PM2)
═══════════════════════════════════════════════════
📦 Verificando dependências...
🔨 Fazendo build do projeto...
   ✓ Compiled successfully
   ✓ Linting and checking validity of types
   ✓ Collecting page data
   ✓ Generating static pages (75/75)
   ✓ Collecting build traces
   ✓ Finalizing page optimization

🌐 Iniciando Next.js com PM2...
   ✅ Dashboard iniciado com PM2
🤖 Iniciando Bot do Telegram com PM2...
   ✅ Bot iniciado com PM2
💾 Salvando configuração do PM2...
✅ Sistema iniciado em PRODUÇÃO com sucesso!
```

---

## 📊 Verificar Status

### **Ver processos rodando**
```bash
pm2 status
```

**Saída esperada:**
```
┌────┬──────────────────────┬─────────┬─────────┬─────────┬──────────┐
│ id │ name                 │ mode    │ status  │ cpu     │ memory   │
├────┼──────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0  │ tlgrupos-dashboard   │ fork    │ online  │ 0%      │ 150 MB   │
│ 1  │ tlgrupos-bot         │ fork    │ online  │ 0%      │ 50 MB    │
└────┴──────────────────────┴─────────┴─────────┴─────────┴──────────┘
```

### **Ver logs em tempo real**
```bash
pm2 logs
```

### **Ver logs apenas do Dashboard**
```bash
pm2 logs tlgrupos-dashboard
```

### **Ver logs apenas do Bot**
```bash
pm2 logs tlgrupos-bot
```

### **Monitoramento interativo (CPU, RAM)**
```bash
pm2 monit
```

---

## 🌐 Acessar o Sistema

Após o deploy, acesse:
```
http://157.180.72.42
```

---

## 🔄 Comandos de Gerenciamento

### **Reiniciar tudo**
```bash
./prod-restart.sh
```

### **Parar tudo**
```bash
./prod-stop.sh
```

### **Ver status detalhado**
```bash
./prod-status.sh
```

### **Reiniciar apenas o Dashboard**
```bash
pm2 restart tlgrupos-dashboard
```

### **Reiniciar apenas o Bot**
```bash
pm2 restart tlgrupos-bot
```

### **Ver informações de um processo**
```bash
pm2 info tlgrupos-dashboard
```

---

## ⚡ Configurar Auto-Start no Boot

Para garantir que o sistema reinicie automaticamente após reboot da VPS:

```bash
pm2 startup
```

**Siga as instruções na tela, depois:**
```bash
pm2 save
```

**Pronto! O PM2 irá iniciar automaticamente no boot.**

---

## 🆕 Atualizar após Mudanças no Código

Sempre que houver mudanças no código:

```bash
# 1. Puxar mudanças
git pull origin main

# 2. Instalar dependências novas (se houver)
npm install

# 3. Reiniciar
./prod-restart.sh
```

---

## 🐛 Troubleshooting

### **Erro de build**
```bash
# Ver detalhes do erro
npm run build

# Limpar cache e tentar novamente
rm -rf .next
npm run build
```

### **Porta já em uso**
```bash
# Parar processos antigos
./prod-stop.sh

# Ou matar manualmente
pm2 delete all

# Verificar portas
lsof -i :3000

# Reiniciar
./prod-start.sh
```

### **Permissão negada nos scripts**
```bash
chmod +x prod-start.sh
chmod +x prod-stop.sh
chmod +x prod-restart.sh
chmod +x prod-status.sh
```

### **PM2 não salvou a configuração**
```bash
pm2 save
pm2 startup
```

### **Ver erros detalhados**
```bash
# Logs com stack trace
pm2 logs --err

# Flush logs antigos
pm2 flush
```

### **Processo travado**
```bash
# Matar processo específico
pm2 delete tlgrupos-dashboard
pm2 delete tlgrupos-bot

# Reiniciar tudo
./prod-start.sh
```

---

## 📝 Checklist de Deploy

- [ ] VPS conectada via SSH
- [ ] Git pull executado (`git pull origin main`)
- [ ] PM2 instalado (`npm install -g pm2`)
- [ ] `.env.local` configurado com credenciais corretas
- [ ] Scripts com permissão de execução (`chmod +x prod-*.sh`)
- [ ] Build executado com sucesso (`npm run build`)
- [ ] Processos rodando (`pm2 status`)
- [ ] Dashboard acessível (http://157.180.72.42)
- [ ] Bot respondendo no Telegram
- [ ] Auto-start configurado (`pm2 startup` + `pm2 save`)
- [ ] Logs sem erros críticos (`pm2 logs`)

---

## 🔐 Variáveis de Ambiente Necessárias

Certifique-se de que o `.env.local` contém:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Telegram
TELEGRAM_BOT_TOKEN=seu-token-do-bot
TELEGRAM_GROUP_ID=-1002242190548,-1002466217981,...

# Email (Resend)
RESEND_API_KEY=sua-chave-resend

# URLs
NEXT_PUBLIC_APP_URL=http://157.180.72.42
```

---

## 📊 Monitoramento de Performance

### **Ver uso de recursos**
```bash
pm2 monit
```

### **Estatísticas do PM2**
```bash
pm2 stats
```

### **Informações do sistema**
```bash
pm2 describe tlgrupos-dashboard
```

---

## ✅ Tudo Pronto!

Após seguir este guia, seu sistema estará rodando em produção na VPS! 🎉

**Links úteis:**
- Dashboard: http://157.180.72.42
- PM2 Docs: https://pm2.keymetrics.io/docs/usage/quick-start/
- Next.js Docs: https://nextjs.org/docs

**Comandos rápidos:**
```bash
pm2 status    # Ver status
pm2 logs      # Ver logs
pm2 monit     # Monitorar
./prod-restart.sh   # Reiniciar tudo
./prod-stop.sh      # Parar tudo
```
