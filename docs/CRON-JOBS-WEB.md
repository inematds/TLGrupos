# 🌐 Gerenciamento de Cron Jobs via Web

Sistema completo para gerenciar processos automáticos (cron jobs) através da interface web, sem precisar SSH na VPS.

---

## ✨ Funcionalidades

### Interface Web Completa

✅ **Visualizar** todos os cron jobs configurados
✅ **Adicionar** novos processos automáticos
✅ **Editar** frequência, endpoint, descrição
✅ **Ativar/Desativar** processos com toggle
✅ **Executar manualmente** qualquer processo
✅ **Excluir** processos não utilizados
✅ **Monitorar** estatísticas (execuções, sucessos, erros)
✅ **Atualização automática** do crontab na VPS

---

## 🎯 Como Funciona

```
┌─────────────────────────────────────────────────────────┐
│  1. Você acessa /admin/cron-jobs                        │
│  2. Cria/edita/remove processos via interface           │
│  3. Ao salvar, sistema atualiza banco de dados          │
│  4. Serviço crontab-manager regenera arquivo crontab    │
│  5. Novo crontab é instalado na VPS automaticamente     │
│  6. Processos rodam nos horários configurados           │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Arquivos Criados

### 1. Banco de Dados
**`scripts/create-cron-jobs-table.js`**
- Script para criar tabela `cron_jobs` no Supabase
- Já inclui os 4 processos padrão do sistema

### 2. Serviço de Gerenciamento
**`src/services/crontab-manager.ts`**
- `atualizarCrontab()` - Regenera e instala crontab
- `traduzirFrequencia()` - Converte cron expression para texto
- `calcularProximaExecucao()` - Calcula próxima rodada

### 3. API REST
**`src/app/api/admin/cron-jobs/route.ts`**
- `GET` - Listar todos os cron jobs
- `POST` - Criar novo cron job
- `PUT` - Atualizar cron job existente
- `DELETE` - Remover cron job

**`src/app/api/admin/cron-jobs/execute/route.ts`**
- `POST` - Executar cron job manualmente

### 4. Interface Web
**`src/app/admin/cron-jobs/page.tsx`**
- Página completa de gerenciamento
- Tabela com todos os processos
- Modal para criar/editar
- Botões de ação (executar, editar, excluir)
- Estatísticas em tempo real

### 5. Menu Sidebar
**`src/components/Sidebar.tsx`** (modificado)
- Adicionado item "Cron Jobs" abaixo de "Status"
- Ícone de relógio (Clock)

---

## 🚀 Instalação

### Passo 1: Criar Tabela no Supabase

```bash
# Executar script para ver SQL
node scripts/create-cron-jobs-table.js
```

**Ou copie e execute este SQL no Supabase Dashboard:**

```sql
-- Tabela para gerenciar cron jobs via web
CREATE TABLE IF NOT EXISTS cron_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  endpoint VARCHAR(255) NOT NULL,
  frequencia VARCHAR(50) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ultimo_exec TIMESTAMP,
  proximo_exec TIMESTAMP,
  total_execucoes INTEGER DEFAULT 0,
  total_sucessos INTEGER DEFAULT 0,
  total_erros INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cron_jobs_ativo ON cron_jobs(ativo);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_proximo_exec ON cron_jobs(proximo_exec);

-- Processos padrão
INSERT INTO cron_jobs (nome, descricao, endpoint, frequencia, ativo) VALUES
('Processar Pagamentos', 'Gera links de convite para pagamentos aprovados sem link', '/api/cron/process-approved-payments', '*/15 * * * *', true),
('Verificar Expirações', 'Verifica membros com data de vencimento próxima', '/api/cron/check-expirations', '0 * * * *', true),
('Enviar Notificações', 'Envia avisos de vencimento por email e Telegram', '/api/cron/send-notifications', '0 8 * * *', true),
('Remover Expirados', 'Remove automaticamente membros com vencimento expirado', '/api/cron/remove-expired', '0 3 * * *', true)
ON CONFLICT DO NOTHING;
```

### Passo 2: Acessar Interface Web

1. Fazer login no sistema
2. Clicar em **"Cron Jobs"** no menu lateral (abaixo de Status)
3. Visualizar os 4 processos padrão já configurados

### Passo 3: Atualizar Crontab na VPS (Primeira Vez)

**Na VPS:**

```bash
ssh root@157.180.72.42
cd /var/www/TLGrupos

# O crontab será atualizado automaticamente quando você:
# - Adicionar um novo cron job via web
# - Editar um cron job existente
# - Ativar/desativar um processo
# - Excluir um processo

# Para forçar atualização manual (caso necessário):
# Execute qualquer alteração via web (ex: editar descrição)
```

---

## 💡 Como Usar

### Adicionar Novo Processo

1. Clicar em **"Adicionar Processo"**
2. Preencher formulário:
   - **Nome**: Ex: "Backup Diário"
   - **Descrição**: Ex: "Faz backup do banco de dados"
   - **Endpoint**: Ex: "/api/cron/backup-database"
   - **Frequência**: Selecionar da lista (5min, 15min, 1h, diário, etc.)
   - **Ativo**: Marcar se quiser ativar imediatamente
3. Clicar **"Criar Cron Job"**
4. ✅ Crontab atualizado automaticamente!

### Editar Processo Existente

1. Clicar no ícone de **lápis (✏️)** no processo
2. Alterar campos desejados
3. Clicar **"Salvar Alterações"**
4. ✅ Crontab atualizado automaticamente!

### Ativar/Desativar Processo

1. Clicar no **badge de status** (Ativo/Inativo)
2. Status alterna automaticamente
3. ✅ Crontab atualizado automaticamente!

### Executar Manualmente

1. Clicar no ícone de **play (▶️)**
2. Confirmar execução
3. Aguardar resultado (sucesso ou erro)
4. Estatísticas são atualizadas automaticamente

### Excluir Processo

1. Clicar no ícone de **lixeira (🗑️)**
2. Confirmar exclusão
3. ✅ Crontab atualizado automaticamente!

---

## 📊 Monitoramento

A interface mostra para cada processo:

### Informações Básicas
- Nome e descrição
- Endpoint que será chamado
- Frequência de execução

### Estatísticas
- **Total de execuções**
- **Total de sucessos** ✅
- **Total de erros** ❌
- **Última execução** (data/hora)
- **Próxima execução** (estimada)

### Status
- **Ativo** (verde) - Processo rodando normalmente
- **Inativo** (cinza) - Processo pausado

---

## 🔧 Frequências Disponíveis

| Opção | Cron Expression | Descrição |
|-------|----------------|-----------|
| A cada 5 minutos | `*/5 * * * *` | Muito frequente |
| A cada 10 minutos | `*/10 * * * *` | Frequente |
| **A cada 15 minutos** | `*/15 * * * *` | **Recomendado para pagamentos** |
| A cada 30 minutos | `*/30 * * * *` | Moderado |
| A cada 1 hora | `0 * * * *` | Econômico |
| A cada 2 horas | `0 */2 * * *` | Espaçado |
| A cada 6 horas | `0 */6 * * *` | 4x por dia |
| A cada 12 horas | `0 */12 * * *` | 2x por dia |
| Diariamente à meia-noite | `0 0 * * *` | 1x por dia (00:00) |
| **Diariamente às 03:00** | `0 3 * * *` | **Recomendado para remoções** |
| **Diariamente às 08:00** | `0 8 * * *` | **Recomendado para notificações** |
| Diariamente ao meio-dia | `0 12 * * *` | 1x por dia (12:00) |
| Semanalmente | `0 2 * * 0` | Todo domingo às 02:00 |

---

## 🔐 Segurança

### Proteção da API
- Todos os endpoints protegidos com autenticação
- Apenas usuários autorizados podem gerenciar cron jobs
- Endpoints de execução verificam `CRON_SECRET`

### Validações
- Endpoint deve começar com `/api/`
- Frequência deve ser expressão cron válida
- Não permite duplicação de processos críticos

---

## 🐛 Troubleshooting

### Problema: Crontab não atualiza na VPS

**Causa**: Código em desenvolvimento (NODE_ENV !== 'production')

**Solução**:
```bash
# Em desenvolvimento, o crontab NÃO é instalado automaticamente
# Para testar em produção:
export NODE_ENV=production
npm run build
npm start
```

### Problema: Erro ao criar cron job

**Verificar**:
1. Tabela `cron_jobs` existe no Supabase?
2. Endpoint começa com `/api/`?
3. Frequência é válida?

### Problema: Processo não executa

**Verificar**:
1. Status está **Ativo**?
2. Endpoint existe e está funcionando?
3. `CRON_SECRET` configurado no `.env.local`?
4. VPS tem acesso ao endpoint (localhost:3000)?

---

## 📋 Checklist de Instalação

- [ ] Executar SQL no Supabase (criar tabela)
- [ ] Acessar `/admin/cron-jobs`
- [ ] Verificar 4 processos padrão listados
- [ ] Testar executar manualmente um processo
- [ ] Editar frequência de algum processo
- [ ] Ver estatísticas atualizadas
- [ ] Verificar crontab na VPS: `crontab -l`

---

## 🎉 Vantagens do Sistema

### Antes (Manual)
❌ Precisava SSH na VPS
❌ Editar crontab manualmente
❌ Erros de sintaxe frequentes
❌ Sem histórico de execuções
❌ Difícil adicionar novos processos
❌ Sem estatísticas

### Agora (Web)
✅ Gerenciamento 100% via interface
✅ Sintaxe validada automaticamente
✅ Histórico completo
✅ Estatísticas em tempo real
✅ Adicionar processos em segundos
✅ Executar manualmente quando quiser
✅ Ativar/desativar com 1 clique

---

## 💻 Comandos Úteis

```bash
# Ver crontab instalado
crontab -l

# Ver logs de execução
tail -f /var/log/tlgrupos/*.log

# Forçar regeneração do crontab (via API)
curl -X PUT http://localhost:3000/api/admin/cron-jobs \
  -H "Content-Type: application/json" \
  -d '{"id":"uuid-do-job","descricao":"Nova descrição"}'
```

---

## 🔄 Próximos Passos

Possíveis melhorias futuras:

1. **Dashboard de Logs**: Página para ver logs de execução direto na web
2. **Alertas**: Email/Telegram quando processo falha X vezes seguidas
3. **Agendamento único**: Executar processo apenas 1 vez em data específica
4. **Dependências**: Processo A só roda se processo B teve sucesso
5. **Timeouts**: Cancelar processo se demorar mais que X minutos
6. **Retry automático**: Tentar novamente se falhar

---

## 📞 Suporte

Se tiver dúvidas ou problemas:

1. Verificar este documento
2. Acessar `/admin/cron-jobs` e ver estatísticas
3. Consultar logs em `/var/log/tlgrupos/`
4. Verificar documentação em `CRON-SETUP.md`

---

**Desenvolvido para TLGrupos**
Sistema de Gerenciamento de Grupos Telegram
Versão 1.3.0
