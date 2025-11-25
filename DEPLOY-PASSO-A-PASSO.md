# 🚀 Deploy na VPS - Passo a Passo

**Você está logado na VPS? Ótimo! Siga os passos abaixo:**

---

## 📋 PASSO 1: Verificar Node.js e instalar dependências

```bash
# Verificar versão do Node.js
node --version

# Se for menor que 20, atualizar:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar novamente
node --version
npm --version
```

---

## 📋 PASSO 2: Instalar PM2 (gerenciador de processos)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalação
pm2 --version
```

---

## 📋 PASSO 3: Instalar Nginx (servidor web)

```bash
# Atualizar sistema
sudo apt update

# Instalar Nginx
sudo apt install nginx -y

# Verificar status
sudo systemctl status nginx

# Iniciar Nginx se não estiver rodando
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📋 PASSO 4: Clonar o repositório

```bash
# Ir para o diretório de aplicações
cd /var/www

# Clonar repositório (substitua pela URL do seu repo)
sudo git clone https://github.com/SEU-USUARIO/tlgrupos.git

# Entrar no diretório
cd tlgrupos

# Listar arquivos para confirmar
ls -la
```

**⚠️ IMPORTANTE:** Se você não tem permissão para /var/www, use:
```bash
# Dar permissão ao seu usuário
sudo chown -R $USER:$USER /var/www/tlgrupos
```

---

## 📋 PASSO 5: Configurar variáveis de ambiente

```bash
# Criar arquivo .env.local
nano .env.local
```

**Cole o seguinte conteúdo (ajuste com seus valores):**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xdvetjrrrifddoowuqhz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY_AQUI

# Telegram
TELEGRAM_BOT_TOKEN=SEU_BOT_TOKEN_AQUI
TELEGRAM_GROUP_ID=-1002414487357,-1002242190548,-1002475673809,-1002315381358,-1002466217981,-1002307181433,-1002286953019

# Next.js
NEXTAUTH_URL=http://SEU_IP_OU_DOMINIO
NEXTAUTH_SECRET=GERE_UM_SECRET_ALEATORIO_AQUI

# Resend (Email)
RESEND_API_KEY=SEU_RESEND_KEY_AQUI
```

**Para salvar:**
- Pressione `Ctrl + O` (salvar)
- Pressione `Enter` (confirmar)
- Pressione `Ctrl + X` (sair)

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## 📋 PASSO 6: Instalar dependências do projeto

```bash
# Instalar dependências
npm install

# Aguardar instalação (pode demorar alguns minutos)
```

---

## 📋 PASSO 7: Build do projeto

```bash
# Fazer build do Next.js
npm run build

# Aguardar build (pode demorar)
```

---

## 📋 PASSO 8: Criar diretório de logs

```bash
# Criar pasta de logs
mkdir -p logs
```

---

## 📋 PASSO 9: Iniciar aplicação com PM2

```bash
# Iniciar usando o arquivo de configuração
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Você deve ver:
# ┌─────┬──────────────────┬─────────────┬─────────┬─────────┐
# │ id  │ name             │ status      │ restart │ uptime  │
# ├─────┼──────────────────┼─────────────┼─────────┼─────────┤
# │ 0   │ tlgrupos-web     │ online      │ 0       │ 0s      │
# │ 1   │ tlgrupos-bot     │ online      │ 0       │ 0s      │
# └─────┴──────────────────┴─────────────┴─────────┴─────────┘
```

---

## 📋 PASSO 10: Salvar configuração do PM2

```bash
# Salvar processos
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup

# Copie e execute o comando que aparecer (algo como):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u seu-usuario --hp /home/seu-usuario
```

---

## 📋 PASSO 11: Configurar Nginx

```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/sites-available/tlgrupos

# Editar para colocar seu domínio/IP
sudo nano /etc/nginx/sites-available/tlgrupos
```

**Encontre a linha:**
```nginx
server_name seu-dominio.com www.seu-dominio.com;
```

**Substitua por:**
```nginx
server_name SEU_IP_AQUI;
# Exemplo: server_name 123.45.67.89;
```

**Salvar:** `Ctrl + O`, `Enter`, `Ctrl + X`

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/tlgrupos /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se estiver OK, reiniciar Nginx
sudo systemctl restart nginx
```

---

## 📋 PASSO 12: Testar se está funcionando

```bash
# Ver logs em tempo real
pm2 logs

# Ou ver logs específicos
pm2 logs tlgrupos-web
pm2 logs tlgrupos-bot

# Testar localmente
curl http://localhost:3000

# Você deve ver HTML do Next.js
```

---

## 📋 PASSO 13: Configurar Firewall (UFW)

```bash
# Permitir SSH (IMPORTANTE!)
sudo ufw allow ssh
sudo ufw allow 22

# Permitir HTTP e HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

---

## 📋 PASSO 14: Verificar no navegador

Abra seu navegador e acesse:
```
http://SEU_IP_AQUI
```

Você deve ver o dashboard do TLGrupos! 🎉

---

## 🔄 COMO ATUALIZAR DEPOIS

Quando fizer mudanças no código:

```bash
# Na VPS, entrar no diretório
cd /var/www/tlgrupos

# Executar script de deploy
./deploy.sh
```

Pronto! O script vai:
1. Puxar código do GitHub
2. Instalar dependências
3. Fazer build
4. Reiniciar serviços

---

## 🐛 TROUBLESHOOTING

### Problema: PM2 não inicia

```bash
# Ver logs de erro
pm2 logs --err

# Reiniciar tudo
pm2 restart all
```

### Problema: Nginx não funciona

```bash
# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Testar configuração
sudo nginx -t
```

### Problema: Porta 3000 em uso

```bash
# Ver o que está usando a porta
sudo lsof -i :3000

# Matar processo
sudo kill -9 PID
```

### Ver status geral

```bash
# Status PM2
pm2 status

# Status Nginx
sudo systemctl status nginx

# Logs do bot
pm2 logs tlgrupos-bot

# Logs do web
pm2 logs tlgrupos-web
```

---

## 📞 COMANDOS ÚTEIS

```bash
# Reiniciar bot
pm2 restart tlgrupos-bot

# Reiniciar web
pm2 restart tlgrupos-web

# Reiniciar tudo
pm2 restart all

# Parar tudo
pm2 stop all

# Ver uso de recursos
pm2 monit

# Ver logs
pm2 logs
```

---

## ✅ CHECKLIST FINAL

- [ ] Node.js 20+ instalado
- [ ] PM2 instalado
- [ ] Nginx instalado
- [ ] Repositório clonado em /var/www/tlgrupos
- [ ] .env.local configurado com suas credenciais
- [ ] npm install executado
- [ ] npm run build executado
- [ ] PM2 iniciado (pm2 start ecosystem.config.js)
- [ ] PM2 salvo (pm2 save)
- [ ] PM2 startup configurado
- [ ] Nginx configurado
- [ ] Firewall configurado (UFW)
- [ ] Aplicação acessível no navegador

---

**Pronto! Seu sistema está no ar! 🚀**

Qualquer dúvida durante o processo, me avise qual passo você está e qual erro apareceu.
