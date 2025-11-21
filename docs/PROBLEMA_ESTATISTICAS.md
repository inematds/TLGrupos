# 🔍 Problema com Estatísticas do Dashboard

## Situação Atual

O dashboard está mostrando **0 cadastros** quando você relatou que existem **2 pessoas cadastradas**.

## Diagnóstico Realizado

✅ **O que está funcionando:**
- A API `/api/stats` está respondendo corretamente
- A view `stats` no banco de dados existe e funciona
- O servidor Next.js está rodando normalmente

❌ **O problema identificado:**
- A tabela `members` no Supabase está retornando 0 registros
- Isso significa que ou não há membros salvos, ou há um problema de conexão/permissões

## Possíveis Causas

### 1. Membros foram cadastrados pelo bot mas não salvos no banco
- O bot do Telegram pode ter registrado as pessoas
- Mas a integração com o Supabase pode não estar funcionando
- Verificar logs do bot para confirmar se há erros de salvamento

### 2. Membros foram salvos em outra tabela
- Pode existir outra tabela de membros (ex: `cadastro_pendente`)
- Verificar se as pessoas estão na tabela `cadastro_pendente` aguardando aprovação

### 3. Problema de permissões no Supabase
- A tabela `members` pode existir mas sem permissões de leitura
- A service role key pode estar incorreta ou expirada

## Como Verificar

Execute o script de diagnóstico:

```bash
node scripts/check-database.js
```

Este script vai verificar:
- Se há dados na tabela `members`
- Se há dados na tabela `cadastro_pendente`
- As configurações de conexão com Supabase
- Se a view `stats` está retornando dados corretos

## Solução Temporária

Enquanto investigamos, você pode:

1. **Verificar no Supabase diretamente:**
   - Acesse o Supabase SQL Editor
   - Execute: `SELECT * FROM members;`
   - Execute: `SELECT * FROM cadastro_pendente;`
   - Veja se há dados em alguma das tabelas

2. **Verificar os logs do bot:**
   - Veja se há erros ao tentar salvar membros
   - Confirme se o bot está conectado ao Supabase corretamente

3. **Testar cadastro manual:**
   - Tente cadastrar um membro pela interface em `/dashboard/new`
   - Veja se aparece no dashboard depois

## Próximos Passos

Preciso que você me informe:
1. Como essas 2 pessoas se cadastraram? (pelo bot /registrar ou pelo formulário /cadastro?)
2. Você consegue ver essas 2 pessoas no Supabase SQL Editor com `SELECT * FROM members;`?
3. Há algum erro nos logs do bot?

Com essas informações, poderei corrigir o problema específico.
