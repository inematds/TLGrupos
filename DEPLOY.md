# 🚀 Guia de Deploy - TLGrupos

Este guia mostra como fazer deploy do projeto em uma VPS e como atualizar.

---

## 📋 Pré-requisitos na VPS

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# 4. Instalar Nginx
sudo apt install nginx -y

# 5. Instalar Git (se não tiver)
sudo apt install git -y
```

---

## 🏁 Deploy Inicial (Primeira vez)

```bash
# 1. Clonar repositório
cd /var/www
sudo git clone https://github.com/seu-usuario/tlgrupos.git
cd tlgrupos

# 2. Criar diretório de logs
mkdir -p logs

# 3. Copiar e configurar variáveis de ambiente
cp .env.example .env.local
nano .env.local
# Cole suas variáveis de ambiente aqui

# 4. Instalar dependências
npm install

# 5. Build do projeto
npm run build

# 6. Iniciar serviços com PM2
pm2 start ecosystem.config.js

# 7. Salvar configuração PM2
pm2 save

# 8. Configurar PM2 para iniciar no boot
pm2 startup
# Copie e execute o comando que aparecer

# 9. Configurar Nginx
sudo cp nginx.conf /etc/nginx/sites-available/tlgrupos
sudo ln -s /etc/nginx/sites-available/tlgrupos /etc/nginx/sites-enabled/

# Editar e substituir 'seu-dominio.com' pelo seu domínio ou IP
sudo nano /etc/nginx/sites-available/tlgrupos

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# 10. (Opcional) Configurar SSL com Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

---

## 🔄 Atualizando o Projeto (Depois de mudanças)

### **Método 1: Script Automático (RECOMENDADO)**

```bash
cd /var/www/tlgrupos
chmod +x deploy.sh  # Só precisa fazer uma vez
./deploy.sh
```

### **Método 2: Manual**

```bash
cd /var/www/tlgrupos

# Puxar mudanças
git pull origin main

# Instalar dependências (se houve mudanças)
npm install

# Rebuild
npm run build

# Reiniciar serviços
pm2 restart all

# Verificar status
pm2 status
```

---

## 📊 Comandos Úteis PM2

```bash
# Ver status de todos os processos
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs do dashboard
pm2 logs tlgrupos-web

# Ver logs do bot
pm2 logs tlgrupos-bot

# Reiniciar tudo
pm2 restart all

# Reiniciar apenas web
pm2 restart tlgrupos-web

# Reiniciar apenas bot
pm2 restart tlgrupos-bot

# Parar tudo
pm2 stop all

# Deletar processos
pm2 delete all

# Monitoramento
pm2 monit
```

---

## 🔍 Verificar se está funcionando

```bash
# Verificar se Next.js está rodando
curl http://localhost:3000

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/tlgrupos-access.log
sudo tail -f /var/log/nginx/tlgrupos-error.log

# Verificar processos Node.js
ps aux | grep node
```

---

## 🐛 Troubleshooting

### **Problema: Porta 3000 em uso**

```bash
# Encontrar processo
sudo lsof -i :3000

# Matar processo
sudo kill -9 PID
```

### **Problema: PM2 não inicia no boot**

```bash
pm2 startup
pm2 save
```

### **Problema: Nginx não inicia**

```bash
# Testar configuração
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log
```

### **Problema: .env.local não está sendo lido**

```bash
# Verificar se existe
ls -la .env.local

# PM2 não carrega .env automaticamente
# Certifique-se que as variáveis estão definidas no ecosystem.config.js
# Ou use: pm2 start ecosystem.config.js --update-env
```

---

## 🔐 Segurança

### **Firewall (UFW)**

```bash
# Permitir SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### **Fail2ban (Proteção contra ataques)**

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📝 Workflow Completo de Desenvolvimento

### **No seu computador:**

```bash
# 1. Fazer alterações no código
# 2. Testar localmente
npm run dev

# 3. Commit e push
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

### **Na VPS:**

```bash
# Executar script de deploy
cd /var/www/tlgrupos
./deploy.sh
```

---

## 📞 Suporte

Se algo der errado:

1. Verifique os logs: `pm2 logs`
2. Verifique status: `pm2 status`
3. Verifique Nginx: `sudo nginx -t`
4. Reinicie tudo: `pm2 restart all && sudo systemctl restart nginx`
