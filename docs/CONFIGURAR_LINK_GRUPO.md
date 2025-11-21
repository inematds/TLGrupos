# 🔗 CONFIGURAR LINK GENÉRICO DO GRUPO

## ⚠️ ATUALIZAÇÃO

**Agora o sistema gera links automaticamente via API do Telegram!**

Não é mais necessário configurar link manualmente. O sistema usa a mesma configuração do bot (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_GROUP_ID`) para gerar links dinamicamente.

---

## 🎯 COMO FUNCIONA AGORA

### **Fluxo de Geração de Link:**

```
1. Criar membro na API
2. API retorna inviteLink?
   ├─ SIM → Usar link retornado (link único, 1 uso)
   └─ NÃO → Gerar via API /telegram/invite-link com generic: true
       ├─ Sucesso → Usar link genérico gerado (múltiplos usos)
       └─ Falha → Mostrar erro ao usuário
```

### **Tipos de Link:**

1. **Link Único** (quando há `telegram_username`):
   - Expira em 7 dias
   - Apenas 1 pessoa pode usar
   - Mais seguro

2. **Link Genérico** (quando NÃO há `telegram_username`):
   - Permanente (não expira)
   - Múltiplas pessoas podem usar
   - Útil para registro público

---

## 🔧 CONFIGURAÇÃO NECESSÁRIA

Apenas certifique-se que no `.env.local` estão configurados:

```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_GROUP_ID=seu_group_id_aqui
```

**Isso é tudo!** O resto é automático.

---

## 📋 CÓDIGO RELEVANTE

- `src/lib/telegram.ts:51` - Função `createGenericInviteLink()`
- `src/app/api/telegram/invite-link/route.ts:17` - API com parâmetro `generic`
- `src/app/register/page.tsx:79` - Página de registro usando a API

---

## ✅ BENEFÍCIOS

- ✅ Links gerados automaticamente
- ✅ Usa mesma configuração do bot
- ✅ Links únicos quando possível
- ✅ Links genéricos como fallback
- ✅ Sem configuração manual
