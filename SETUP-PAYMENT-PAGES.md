# 💰 Setup: Páginas de Pagamento Externas

## 📝 Visão Geral

Assim como o formulário de cadastro, as páginas de pagamento podem ser hospedadas externamente (fora do servidor principal). Isso oferece:

- **Isolamento**: Páginas de pagamento em domínio/servidor separado
- **Segurança**: Reduz superfície de ataque no servidor principal
- **Escalabilidade**: Hospede em CDN gratuitos (Netlify, Vercel, GitHub Pages)
- **Custo Zero**: Não precisa de servidor adicional, apenas hospedagem estática
- **HTTPS Gratuito**: CDNs fornecem certificado SSL automaticamente

---

## 🎯 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FLUXO EXTERNO                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Cliente acessa: https://seusite.com/payment-pix.html│
│                     (hospedado em Netlify/Vercel/etc)   │
│                                                         │
│  2. Página carrega informações via API:                 │
│     GET http://157.180.72.42/api/cadastro/{id}         │
│                                                         │
│  3. Cliente faz pagamento e envia comprovante:          │
│     POST http://157.180.72.42/api/enviar-comprovante    │
│                                                         │
│  4. Dados salvos no Supabase                            │
│                                                         │
│  5. Sistema processa e libera acesso                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Vantagens**:
- Página estática (HTML puro) hospedada em CDN
- Comunicação direta com Supabase para leitura/escrita
- Sem necessidade de servidor Node.js adicional
- HTTPS gratuito via CDN
- Baixa latência (CDN global)

---

## 🚀 Passo a Passo

### 1. Executar Migration

Execute a migration no Supabase SQL Editor:

```bash
# Conecte-se ao Supabase e execute:
migrations/add-payment-urls-config.sql
```

Isso criará as seguintes configurações:

- `payment_externo` - Flag para usar URLs externas
- `payment_pix_url` - URL externa da página PIX
- `payment_pix_titulo` - Título da página
- `payment_pix_subtitulo` - Subtítulo
- `payment_pix_instrucoes` - Instruções de pagamento

### 2. Baixar Arquivo HTML

1. Acesse: `http://157.180.72.42/dashboard/settings`
2. Role até a seção **"URLs de Pagamento PIX"**
3. Clique em **"Baixar payment-pix.html"**
4. Salve o arquivo no seu computador

### 3. Hospedar o Arquivo

Você tem várias opções gratuitas:

#### Opção A: Netlify (Recomendado)

1. Crie uma conta em https://www.netlify.com/
2. Arraste e solte o arquivo `payment-pix.html`
3. Netlify gera URL tipo: `https://seu-site.netlify.app/payment-pix.html`
4. (Opcional) Configure domínio customizado

**Vantagens**:
- HTTPS gratuito
- Deploy em segundos
- CDN global
- Domínio customizado gratuito

#### Opção B: Vercel

1. Crie uma conta em https://vercel.com/
2. Crie novo projeto
3. Faça upload do `payment-pix.html`
4. URL gerada: `https://seu-projeto.vercel.app/payment-pix.html`

#### Opção C: GitHub Pages

1. Crie repositório no GitHub
2. Faça upload do arquivo
3. Ative GitHub Pages nas configurações
4. URL: `https://seuusuario.github.io/repo/payment-pix.html`

#### Opção D: Seu Próprio Servidor

Se você já tem um servidor web (Apache, Nginx, etc):

```bash
# Copie o arquivo para a pasta do servidor
sudo cp payment-pix.html /var/www/html/
```

### 4. Configurar no Dashboard

1. Acesse: `http://157.180.72.42/dashboard/settings`
2. Na seção **"URLs de Pagamento PIX"**:
   - Cole a URL onde você hospedou (ex: `https://seu-site.netlify.app/payment-pix.html`)
   - Ative o toggle **"Usar URL Externa"**
   - (Opcional) Edite os textos da página
3. Clique em **"Salvar Alterações"**

### 5. Testar

1. No dashboard, clique em **"Testar URL"**
2. Deve abrir a página externa
3. Teste o fluxo completo:
   - Página carrega informações do cadastro
   - Chave PIX é exibida
   - Upload de comprovante funciona

---

## 🔧 Configuração de CORS

Se a página externa não conseguir se comunicar com a API, configure CORS:

### Next.js (arquivo: `next.config.js`)

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://seu-site.netlify.app' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

**Ou permita todas as origens (menos seguro, mas mais simples)**:

```javascript
{ key: 'Access-Control-Allow-Origin', value: '*' }
```

---

## 📊 Como Funciona Internamente

### 1. Geração do HTML

A API `GET /api/generate-payment-pix-html`:
- Busca textos configuráveis do banco
- Gera HTML standalone com CSS e JS inline
- Retorna arquivo para download

### 2. Comunicação com a API

O HTML gerado faz requisições para:

```javascript
// Buscar informações do cadastro
GET /api/cadastro/{cadastro_id}
Response: {
  plano_nome,
  plano_valor,
  chave_pix
}

// Enviar comprovante
POST /api/enviar-comprovante
Body: {
  cadastro_id,
  comprovante_base64,
  filename
}
```

### 3. Fluxo de Pagamento

```
Cliente acessa URL com ?cadastro_id=xyz
    ↓
Página busca informações do cadastro via API
    ↓
Exibe plano, valor e chave PIX
    ↓
Cliente faz pagamento no banco
    ↓
Cliente faz upload do comprovante
    ↓
API salva no Supabase Storage
    ↓
Status do cadastro muda para 'comprovante_enviado'
    ↓
Admin valida no dashboard
    ↓
Sistema libera acesso ao grupo
```

---

## 🔒 Segurança

### Validações Implementadas

✅ **Cadastro existe**: API verifica se o ID é válido
✅ **Arquivo válido**: Aceita apenas imagens e PDFs
✅ **Tamanho limitado**: Configurável no Supabase Storage
✅ **HTTPS**: CDNs fornecem certificado SSL gratuito
✅ **Supabase RLS**: Políticas de acesso no banco

### Dados Não Expostos

❌ Dados sensíveis do cadastro (CPF, documentos)
❌ Service Role Key do Supabase
❌ Tokens internos do sistema

### O Que É Exposto

✅ Nome do plano
✅ Valor do plano
✅ Chave PIX
✅ Status do cadastro (público)

---

## 🧪 Testes

### Teste 1: Geração do HTML

```bash
curl http://157.180.72.42/api/generate-payment-pix-html -o payment-pix.html
```

Deve baixar um arquivo HTML válido.

### Teste 2: API de Cadastro

```bash
curl http://157.180.72.42/api/cadastro/{seu-cadastro-id}
```

Deve retornar JSON com informações do cadastro.

### Teste 3: Upload de Comprovante

Use a interface web para testar o fluxo completo.

---

## 💡 Casos de Uso

### Caso 1: Sistema Principal Fora do Ar

Se `http://157.180.72.42` cair, a página de pagamento (hospedada no Netlify) continua funcionando. Assim que o sistema voltar, as requisições são processadas normalmente.

### Caso 2: Múltiplos Domínios

Você pode hospedar várias cópias:
- `https://pagamentos.seudominio.com/pix.html`
- `https://checkout.outrocliente.com/payment.html`

Todas apontando para a mesma API central.

### Caso 3: Personalização por Cliente

Edite o HTML baixado:
- Adicione logo do cliente
- Mude cores e estilos
- Adicione textos personalizados

Depois hospede em domínio do cliente.

---

## 🎨 Personalização

### Editar Cores

No HTML baixado, procure por:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Mude para suas cores:

```css
background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
```

### Adicionar Logo

Adicione antes do `<h1>`:

```html
<div style="text-align: center; margin-bottom: 20px;">
  <img src="https://seusite.com/logo.png" alt="Logo" style="max-width: 200px;">
</div>
```

### Mudar Textos Dinamicamente

Edite no dashboard (seção "Textos da Página PIX") e baixe novamente o HTML atualizado.

---

## 📋 Checklist de Setup

- [ ] Migration executada no Supabase
- [ ] Arquivo `payment-pix.html` baixado
- [ ] Arquivo hospedado (Netlify/Vercel/etc)
- [ ] URL configurada no dashboard
- [ ] Toggle "Usar URL Externa" ativado
- [ ] CORS configurado (se necessário)
- [ ] Teste de acesso à página externa
- [ ] Teste de upload de comprovante
- [ ] Bucket 'comprovantes' criado no Supabase Storage
- [ ] Políticas RLS configuradas

---

## 🆘 Problemas Comuns

### Erro: "Failed to fetch"

**Causa**: CORS não configurado

**Solução**: Configure headers CORS no Next.js (veja seção acima)

### Erro: "Cadastro não encontrado"

**Causa**: URL sem parâmetro `cadastro_id` ou ID inválido

**Solução**: Certifique-se que a URL é: `https://site.com/payment-pix.html?cadastro_id=XXX`

### Erro: "Bucket not found" no upload

**Causa**: Bucket 'comprovantes' não existe no Supabase Storage

**Solução**: Veja o guia `SETUP-STORAGE-COMPROVANTES.md`

### Página não carrega CSS

**Causa**: HTML não foi baixado corretamente

**Solução**: Baixe novamente do dashboard. O CSS está inline no HTML.

---

## 🔄 Atualização de Textos

Se você mudar os textos no dashboard:

1. Baixe novamente o `payment-pix.html`
2. Substitua o arquivo hospedado
3. CDNs como Netlify/Vercel atualizam automaticamente

**Dica**: Use versionamento no nome do arquivo:
- `payment-pix-v1.html`
- `payment-pix-v2.html`

Assim você pode testar antes de trocar a URL configurada.

---

## 🌐 Exemplo de URL Completa

```
https://pagamentos.seudominio.com/payment-pix.html?cadastro_id=550e8400-e29b-41d4-a716-446655440000
```

Onde:
- `https://pagamentos.seudominio.com` - Seu domínio customizado (Netlify/Vercel)
- `/payment-pix.html` - Arquivo hospedado
- `?cadastro_id=...` - ID do cadastro pendente (gerado automaticamente)

---

## 📊 Monitoramento

### Ver Requisições no Dashboard

1. Acesse: `http://157.180.72.42/dashboard/pagamentos`
2. Veja cadastros com `comprovante_enviado`
3. Valide ou rejeite manualmente

### Logs do Servidor

```bash
# Ver logs da API
tail -f /var/log/tlgrupos/access.log | grep enviar-comprovante
```

---

## 🎯 Próximos Passos

Após configurar a página PIX:

1. Configure chave PIX nos planos (tabela `planos`)
2. Ou configure chave PIX global em `system_config`
3. Teste o fluxo completo com um cadastro real
4. Configure outras páginas de pagamento (cartão, etc)
5. Personalize o HTML conforme sua marca

---

## 📞 Suporte

Se precisar de ajuda:

1. Verifique os logs do navegador (F12 → Console)
2. Verifique os logs do servidor Next.js
3. Teste as APIs diretamente com `curl`
4. Consulte `SETUP-STORAGE-COMPROVANTES.md` para problemas de upload

---

**Criado em**: 2025-11-27
**Versão**: 1.0.0
**Sistema**: TLGrupos - Gerenciador de Membros Telegram
