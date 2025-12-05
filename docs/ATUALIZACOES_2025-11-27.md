# Atualizações do Sistema - 27/11/2025

## Resumo das Alterações

Este documento descreve as atualizações realizadas no sistema TLGrupos em 27/11/2025.

---

## 1. Correção da Exclusão de Membros

### Problema Anterior
O endpoint DELETE de membros apenas marcava o status como "removido", mas não excluía permanentemente do banco de dados.

### Solução Implementada

Implementada a distinção correta entre **remover** e **excluir**:

#### **Excluir (DELETE) - Exclusão Permanente**
- **Função**: `deleteMember()` em `src/services/member-service.ts:293`
- **Comportamento**: Deleta permanentemente o membro do banco de dados
- **Auditoria**: Registra log antes de deletar para rastreamento
- **Endpoint**: `DELETE /api/members/[id]` em `src/app/api/members/[id]/route.ts:90`
- **Interface**: Aviso claro de que a ação é IRREVERSÍVEL

```typescript
/**
 * Exclui permanentemente um membro do banco de dados
 * ATENÇÃO: Esta ação é irreversível
 */
export async function deleteMember(id: string) {
  const member = await getMemberById(id);

  if (!member) {
    throw new Error('Membro não encontrado');
  }

  // Registrar log antes de deletar
  await supabase.from('logs').insert({
    member_id: id,
    acao: 'exclusao_permanente',
    detalhes: {
      nome: member.nome,
      telegram_user_id: member.telegram_user_id,
      status_antes_exclusao: member.status,
    },
    executado_por: 'admin',
  });

  // Deletar permanentemente do banco
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir membro: ${error.message}`);
  }

  return { success: true, message: 'Membro excluído permanentemente' };
}
```

#### **Removido (Status) - Marca como Removido**
- **Função**: `removeMember()` em `src/services/member-service.ts:259`
- **Comportamento**:
  - Remove do grupo Telegram
  - Marca status como "removido"
  - NÃO deleta do banco de dados
- **Uso**: Quando o sistema remove do grupo ou quando membro não está em nenhum grupo

```typescript
/**
 * Marca membro como removido (remove do grupo mas mantém no banco)
 * Usado quando: sistema remove do grupo, não está em grupo, ou erro de remoção
 */
export async function removeMember(id: string) {
  const member = await getMemberById(id);

  if (!member) {
    throw new Error('Membro não encontrado');
  }

  // Remover do grupo Telegram
  if (member.telegram_user_id) {
    const result = await removeMemberFromGroup(member.telegram_user_id);
    if (!result.success) {
      console.error('Erro ao remover do Telegram:', result.error);
    }
  }

  // Marcar como removido no banco (mas NÃO deleta)
  const { data, error } = await supabase
    .from('members')
    .update({ status: 'removido' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao remover membro: ${error.message}`);
  }

  return data as Member;
}
```

#### **Interface do Dashboard**
Alterado em `src/app/dashboard/members/page.tsx`:

- **Confirmação de exclusão**: Aviso claro sobre irreversibilidade
```javascript
if (!confirm(`⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nDeseja EXCLUIR PERMANENTEMENTE ${member.nome} do banco de dados?\n\nEsta ação NÃO apenas marca como "removido", mas DELETE o registro completamente.\n\nPara apenas remover do grupo, altere o status para "removido" na edição.`)) {
  return;
}
```

- **Tooltip do botão**: "Excluir permanentemente (IRREVERSÍVEL)"

### Arquivos Alterados
- `src/services/member-service.ts` - Adicionada função `deleteMember()`
- `src/app/api/members/[id]/route.ts` - Endpoint DELETE atualizado
- `src/app/dashboard/members/page.tsx` - Interface com avisos claros

---

## 2. Scripts de Produção com PM2

### Contexto
O sistema tinha apenas scripts de desenvolvimento (`dev-start.sh`, `dev-stop.sh`, etc.). Era necessário criar scripts específicos para produção usando PM2.

### Scripts Criados

#### **`prod-start.sh`** - Iniciar Sistema em Produção
**Funcionalidades:**
- Verifica se está no diretório correto
- Valida presença do arquivo `.env.local`
- Verifica se PM2 está instalado
- Instala dependências se necessário
- Faz build do projeto (obrigatório)
- Inicia dashboard com PM2: `pm2 start npm --name "tlgrupos-dashboard" -- run start`
- Inicia bot com PM2: `pm2 start npm --name "tlgrupos-bot" -- run start:bot`
- Salva configuração do PM2
- Exibe status e comandos úteis

**Uso:**
```bash
./prod-start.sh
```

#### **`prod-stop.sh`** - Parar Sistema em Produção
**Funcionalidades:**
- Verifica se PM2 está instalado
- Para processo do dashboard
- Para processo do bot
- Salva estado do PM2
- Exibe status final

**Uso:**
```bash
./prod-stop.sh
```

#### **`prod-restart.sh`** - Reiniciar Sistema em Produção
**Funcionalidades:**
- Verifica se PM2 está instalado
- Reinicia dashboard com `pm2 restart`
- Reinicia bot com `pm2 restart`
- Se processo não existir, tenta iniciar
- Salva estado do PM2
- Exibe status final

**Uso:**
```bash
./prod-restart.sh
```

#### **`prod-status.sh`** - Verificar Status em Produção
**Funcionalidades:**
- Verifica se PM2 está instalado
- Exibe status dos processos PM2
- Mostra status detalhado do dashboard:
  - Status (online/stopped/não configurado)
  - PID do processo
  - Status da porta 3000
  - URL de acesso
- Mostra status detalhado do bot:
  - Status (online/stopped/não configurado)
  - PID do processo
- Lista grupos do Telegram configurados
- Exibe comandos úteis do PM2

**Uso:**
```bash
./prod-status.sh
```

### Características dos Scripts

✅ **Permissões**: Todos os scripts têm permissão de execução (`chmod +x`)
✅ **Line Endings**: Todos usam LF (Unix), não CRLF (Windows)
✅ **Mensagens**: Uso de emojis e cores para clareza
✅ **Validações**: Verificam pré-requisitos antes de executar
✅ **Error Handling**: Tratamento adequado de erros
✅ **Documentação**: Comentários claros no início de cada script

### Comandos PM2 Úteis

Comandos disponíveis após iniciar com os scripts de produção:

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs apenas do dashboard
pm2 logs tlgrupos-dashboard

# Ver logs apenas do bot
pm2 logs tlgrupos-bot

# Monitor interativo
pm2 monit

# Reiniciar um serviço específico
pm2 restart tlgrupos-dashboard
pm2 restart tlgrupos-bot

# Parar um serviço específico
pm2 stop tlgrupos-dashboard
pm2 stop tlgrupos-bot

# Deletar processos (remove da lista PM2)
pm2 delete all

# Configurar para iniciar com o sistema
pm2 startup
pm2 save
```

---

## 3. Organização dos Scripts

### Scripts de Desenvolvimento
Para uso local ou em ambiente de desenvolvimento:

- `dev-start.sh` - Inicia com `npm run dev` em background
- `dev-stop.sh` - Mata processos nas portas 3000/3001
- `dev-restart.sh` - Reinicia chamando stop + start

### Scripts de Produção
Para uso em servidor de produção com PM2:

- `prod-start.sh` - Inicia com PM2 após build
- `prod-stop.sh` - Para processos PM2
- `prod-restart.sh` - Reinicia processos PM2
- `prod-status.sh` - Status detalhado do sistema

### Scripts Utilitários
- `status.sh` - Verificação geral do sistema
- `diagnostico.sh` - Diagnóstico completo

---

## 4. Diferenças: Desenvolvimento vs Produção

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| **Gerenciamento** | Processos manuais (nohup) | PM2 |
| **Build** | Opcional (pode usar dev) | Obrigatório |
| **Comando Next.js** | `npm run dev` | `npm run start` |
| **Auto-restart** | Não | Sim (PM2) |
| **Logs** | `logs/nextjs.log`, `logs/bot.log` | PM2 logs |
| **Monitoramento** | Manual | `pm2 monit` |
| **Startup no boot** | Não | Sim (com `pm2 startup`) |

---

## Observações Importantes

### Exclusão de Membros
- A exclusão permanente cria um log para auditoria antes de deletar
- Para apenas remover do grupo, use a edição e mude o status para "removido"
- A exclusão é irreversível e não pode ser desfeita

### PM2 em Produção
- É necessário ter PM2 instalado globalmente: `npm install -g pm2`
- Configure PM2 para iniciar com o sistema: `pm2 startup` e `pm2 save`
- Após mudanças no código, sempre faça build antes de reiniciar: `npm run build && ./prod-restart.sh`

### Status dos Membros
- **ativo**: Membro ativo no sistema e no grupo
- **removido**: Membro removido do grupo (por vencimento ou manualmente)
- **pausado**: Membro temporariamente pausado
- **erro_remocao**: Erro ao tentar remover do grupo Telegram
- **sem_grupo**: Não está em nenhum grupo (campo `group_id` NULL)

---

## Referências

### Arquivos Modificados
- `src/services/member-service.ts` - Funções de gerenciamento de membros
- `src/app/api/members/[id]/route.ts` - Endpoint de API
- `src/app/dashboard/members/page.tsx` - Interface do dashboard

### Arquivos Criados
- `prod-start.sh` - Script de inicialização produção
- `prod-stop.sh` - Script de parada produção
- `prod-restart.sh` - Script de reinicialização produção
- `prod-status.sh` - Script de status produção
- `docs/ATUALIZACOES_2025-11-27.md` - Este documento

---

## Comandos Rápidos

```bash
# PRODUÇÃO
./prod-start.sh      # Iniciar sistema
./prod-stop.sh       # Parar sistema
./prod-restart.sh    # Reiniciar sistema
./prod-status.sh     # Ver status

# DESENVOLVIMENTO
./dev-start.sh       # Iniciar em modo dev
./dev-stop.sh        # Parar processos dev
./dev-restart.sh     # Reiniciar dev

# PM2 (quando em produção)
pm2 logs            # Ver todos os logs
pm2 monit           # Monitor interativo
pm2 status          # Status dos processos
```

---

**Data da Atualização**: 27/11/2025
**Autor**: Claude Code
**Versão do Sistema**: TLGrupos v1.0
