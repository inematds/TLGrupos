# 🐳 Guia Docker - TLGrupos

## 🚀 Início Rápido

### 1. Pré-requisitos

```bash
# Verificar se Docker está instalado
docker --version

# Verificar se Docker Compose está instalado
docker-compose --version
```

**Não tem Docker?** Instale:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker run hello-world
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env
```

### 3. Construir e Iniciar

```bash
# Construir a imagem
docker-compose build

# Iniciar os containers
docker-compose up -d

# Ver logs
docker-compose logs -f
```

**Pronto!** Acesse: http://localhost:3000

---

## 📦 Estrutura dos Containers

Este projeto usa **2 containers**:

### 1. `tlgrupos-app` (Aplicação Principal)
- Next.js server
- API REST
- Interface web
- Porta: 3000

### 2. `tlgrupos-cron` (Automação)
- Cron jobs para notificações
- Remoção de membros vencidos
- Roda em background

---

## 🔧 Comandos Úteis

### Gerenciamento Básico

```bash
# Iniciar containers
docker-compose up -d

# Parar containers
docker-compose down

# Reiniciar containers
docker-compose restart

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f tlgrupos-app

# Ver status dos containers
docker-compose ps
```

### Build e Atualização

```bash
# Rebuildar após mudanças no código
docker-compose build

# Rebuildar e reiniciar
docker-compose up -d --build

# Forçar rebuild sem cache
docker-compose build --no-cache
```

### Debug e Manutenção

```bash
# Entrar no container
docker-compose exec tlgrupos-app sh

# Ver uso de recursos
docker stats

# Limpar containers parados
docker-compose down

# Limpar tudo (containers, volumes, imagens)
docker-compose down -v --rmi all

# Ver tamanho das imagens
docker images
```

### Executar Scripts Manualmente

```bash
# Verificar configuração do bot
docker-compose exec tlgrupos-app npx tsx scripts/setup-bot.ts

# Enviar notificações manualmente
docker-compose exec tlgrupos-app npx tsx scripts/send-expiry-notifications.ts

# Remover membros vencidos
docker-compose exec tlgrupos-app npx tsx scripts/check-expired-members.ts
```

---

## 📁 Volumes e Persistência

### Logs Persistentes

Os logs são salvos fora do container em `./logs/`:

```bash
# Ver logs de notificações
cat logs/notifications.log

# Ver logs de remoções
cat logs/expired.log

# Limpar logs
rm -f logs/*.log
```

---

## 🔒 Segurança

### Boas Práticas

1. **Nunca commite o arquivo `.env`**
```bash
# Adicione ao .gitignore (já está)
echo ".env" >> .gitignore
```

2. **Proteja suas chaves**
```bash
# Permissões apenas para você
chmod 600 .env
```

3. **Use secrets em produção**
```bash
# Docker Swarm secrets
docker secret create supabase_key ./supabase_key.txt
```

4. **Atualize regularmente**
```bash
# Atualizar imagens base
docker-compose pull
docker-compose up -d --build
```

---

## 🌍 Deploy em Produção

### Opção 1: VPS com Docker

```bash
# No servidor
git clone seu-repositorio
cd TLGrupos

# Configurar .env
nano .env

# Iniciar em produção
docker-compose -f docker-compose.yml up -d

# Habilitar restart automático
docker update --restart unless-stopped $(docker ps -q)
```

### Opção 2: Docker Swarm

```bash
# Inicializar swarm
docker swarm init

# Deploy da stack
docker stack deploy -c docker-compose.yml tlgrupos

# Ver serviços
docker stack services tlgrupos

# Escalar se necessário
docker service scale tlgrupos_tlgrupos-app=3
```

### Opção 3: Com Nginx Reverse Proxy

Crie `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - tlgrupos
    networks:
      - tlgrupos-network

  tlgrupos:
    # ... configuração existente
    expose:
      - "3000"
    # Remove 'ports' para não expor diretamente
```

---

## 📊 Monitoramento

### Logs em Tempo Real

```bash
# Todos os serviços
docker-compose logs -f

# Últimas 100 linhas
docker-compose logs --tail=100

# Filtrar por serviço
docker-compose logs -f tlgrupos-app
```

### Healthcheck

O container já tem healthcheck configurado:

```bash
# Ver status de saúde
docker inspect --format='{{.State.Health.Status}}' tlgrupos-app

# Ver histórico de healthchecks
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' tlgrupos-app
```

### Métricas de Recursos

```bash
# Ver uso de CPU e memória
docker stats tlgrupos-app

# Ver uso de disco
docker system df
```

---

## ❓ Troubleshooting

### Container não inicia

```bash
# Ver logs de erro
docker-compose logs tlgrupos-app

# Verificar variáveis de ambiente
docker-compose config

# Testar build
docker-compose build --no-cache
```

### Erro de permissão

```bash
# Dar permissão ao usuário
sudo usermod -aG docker $USER
newgrp docker

# Ou rodar com sudo
sudo docker-compose up -d
```

### Porta 3000 ocupada

```bash
# Mudar porta no docker-compose.yml
ports:
  - "8080:3000"  # Mudar 3000 para 8080

# Ou parar o que está usando a porta
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Container reiniciando constantemente

```bash
# Ver último erro
docker-compose logs --tail=50 tlgrupos-app

# Entrar no container para debug
docker-compose run --rm tlgrupos-app sh

# Verificar healthcheck
docker inspect tlgrupos-app | grep -A 10 Health
```

### Cron jobs não estão rodando

```bash
# Ver logs do container de cron
docker-compose logs tlgrupos-cron

# Entrar no container
docker-compose exec tlgrupos-cron sh

# Verificar crontab
crontab -l

# Testar script manualmente
npx tsx scripts/send-expiry-notifications.ts
```

---

## 🔄 Backup e Restore

### Backup dos Logs

```bash
# Criar backup
tar -czf backup-logs-$(date +%Y%m%d).tar.gz logs/

# Restaurar
tar -xzf backup-logs-20250101.tar.gz
```

### Exportar Container

```bash
# Salvar imagem
docker save tlgrupos-tlgrupos-app -o tlgrupos-app.tar

# Carregar em outro servidor
docker load -i tlgrupos-app.tar
```

---

## 📈 Otimizações

### Reduzir Tamanho da Imagem

A imagem já usa **multi-stage build** e **Alpine Linux**.

Tamanho aproximado: **~150MB**

### Melhorar Performance

```yaml
# Em docker-compose.yml, adicionar:
services:
  tlgrupos:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Cache de Build

```bash
# Usar buildkit para builds mais rápidos
DOCKER_BUILDKIT=1 docker-compose build
```

---

## 🆚 Docker vs Instalação Direta

| Característica | Docker | Instalação Direta |
|----------------|--------|-------------------|
| Isolamento | ✅ Sim | ❌ Não |
| Portabilidade | ✅ Fácil mover | ⚠️ Requer setup |
| Performance | ⚠️ ~5% overhead | ✅ Nativa |
| Segurança | ✅ Isolado | ⚠️ Depende do setup |
| Atualizações | ✅ Fácil | ⚠️ Manual |
| Complexidade | ⚠️ Média | ✅ Simples |
| Produção | ✅ Recomendado | ⚠️ OK |

**Recomendação**: Use Docker em **produção** e **staging**. Para desenvolvimento local, ambos funcionam bem.

---

## 🎓 Próximos Passos

1. ✅ Configure seu `.env`
2. ✅ Execute `docker-compose up -d`
3. ✅ Acesse http://localhost:3000
4. ✅ Configure SSL/HTTPS em produção
5. ✅ Configure backup automático dos logs
6. ✅ Configure monitoramento (Uptime Kuma, Grafana, etc)

---

**Dúvidas?** Consulte:
- [Documentação Docker](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [README.md](README.md) do projeto
