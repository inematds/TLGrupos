# 📍 ONDE CONFIGURAR A URL DO CADASTRO

## ✅ A tabela JÁ EXISTE! Tudo está pronto!

---

## 🔗 URL para acessar:

```
http://157.180.72.42/dashboard/settings
```

---

## 👀 O que você vai VER na página:

A página de Settings tem VÁRIAS seções. Role a página e procure por:

### 🔝 NO TOPO DA PÁGINA (logo após o header):

```
┌────────────────────────────────────────────────────┐
│ 🔗 URL do Formulário de Cadastro                   │
│                                                    │
│ URL Completa do Cadastro                          │
│ ┌────────────────────────────────────────────┐   │
│ │ http://157.180.72.42/cadastro.html         │   │
│ └────────────────────────────────────────────┘   │
│ Esta URL será enviada pelo bot do Telegram...    │
│                                                    │
│ Usar URL Externa                          [ON] ●  │
│ Se ativado, usa a URL acima...                   │
│                                                    │
│ 💡 Dica: Baixe o arquivo cadastro.html...        │
│                                                    │
│ ┌──────────────────┐  ┌─────────────────┐        │
│ │ ⬇️ Baixar         │  │ 🔗 Testar URL   │        │
│ │   cadastro.html  │  │                 │        │
│ └──────────────────┘  └─────────────────┘        │
└────────────────────────────────────────────────────┘
```

Esta seção aparece **ANTES** de:
- ❌ Configurações Gerais
- ❌ Configurações do Bot
- ❌ Informações do Sistema

---

## 📱 Se NÃO estiver vendo:

### 1. Limpe o cache do navegador
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 2. Abra em modo anônimo
```
Ctrl + Shift + N (Chrome)
Ctrl + Shift + P (Firefox)
```

### 3. Verifique se está na página certa
```
URL correta: http://157.180.72.42/dashboard/settings
NÃO é:      http://157.180.72.42/dashboard
```

### 4. Abra o Console do navegador (F12) e execute:
```javascript
fetch('/api/config')
  .then(r => r.json())
  .then(data => {
    console.log('Configurações carregadas:', data);
  })
  .catch(err => {
    console.error('Erro ao buscar configs:', err);
  });
```

Se retornar dados, a API está funcionando!

### 5. Verifique se o servidor Next.js está rodando
```bash
# Ver processos
pm2 list

# Reiniciar se necessário
pm2 restart all
```

---

## 🎯 O que fazer quando encontrar:

### 1. **Baixar o cadastro.html**
   - Clique no botão roxo "⬇️ Baixar cadastro.html"
   - Arquivo será baixado para seu computador

### 2. **Hospedar o arquivo**
   ```bash
   # No servidor
   sudo cp cadastro.html /var/www/html/cadastro.html
   sudo chmod 644 /var/www/html/cadastro.html

   # Testar
   curl http://157.180.72.42/cadastro.html
   ```

### 3. **Configurar a URL**
   - No campo "URL Completa do Cadastro", cole:
     ```
     http://157.180.72.42/cadastro.html
     ```

### 4. **Ativar URL Externa**
   - Clique no toggle para ficar VERDE (ON)

### 5. **Salvar**
   - Role até o final da página
   - Clique no botão azul "💾 Salvar Alterações"
   - Aguarde mensagem verde de sucesso

### 6. **Testar**
   - No Telegram, digite: `/cadastro`
   - Deve enviar o link: `http://157.180.72.42/cadastro.html?telegram_id=...`

---

## 🐛 Debug

Se ainda não aparecer, verifique os logs:

```bash
# Ver logs do Next.js
pm2 logs

# Procurar por erros ao carregar a página
# Ou ao fazer fetch de /api/config
```

---

## ✅ Checklist Visual

Quando abrir http://157.180.72.42/dashboard/settings você deve ver:

- [ ] Header "⚙️ Configurações" no topo
- [ ] Logo abaixo, seção "🔗 URL do Formulário de Cadastro" (PRIMEIRA SEÇÃO)
- [ ] Campo de input para URL
- [ ] Toggle verde/cinza para "Usar URL Externa"
- [ ] Box azul com dica sobre baixar o HTML
- [ ] Botão roxo "Baixar cadastro.html"
- [ ] Botão azul "Testar URL" (se houver URL configurada)
- [ ] Mais abaixo: "Configurações Gerais"
- [ ] Mais abaixo: "Configurações do Bot"
- [ ] Mais abaixo: "Informações do Sistema"
- [ ] No final: Botões "Salvar Alterações" e "Recarregar"

---

**Você VÊ tudo isso?**

- ✅ **SIM** → Ótimo! Basta configurar a URL e salvar
- ❌ **NÃO** → Execute: `pm2 restart all` e atualize a página com Ctrl+Shift+R

---

📞 **Ainda com problema?**

Execute e me envie o resultado:

```bash
node scripts/check-cadastro-setup.js
```
