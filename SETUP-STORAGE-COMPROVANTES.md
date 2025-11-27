# 🗂️ Setup: Storage de Comprovantes

## ⚠️ Erro Comum

Se ao enviar comprovante aparece erro:
```
Bucket de armazenamento não configurado
```

Significa que o bucket `comprovantes` não existe no Supabase Storage.

---

## 📋 Passo a Passo para Configurar

### 1. Acessar Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**

### 2. Criar o Bucket

1. Clique em **"New bucket"** (ou **"Criar bucket"**)
2. Preencha:
   - **Name**: `comprovantes`
   - **Public**: ✅ **SIM** (marcar como público)
   - **File size limit**: `10 MB` (ou maior se precisar)
   - **Allowed MIME types**: (deixe vazio ou adicione):
     ```
     image/jpeg
     image/png
     image/gif
     image/webp
     application/pdf
     ```

3. Clique em **"Create bucket"**

### 3. Configurar Permissões (RLS)

Após criar o bucket, configure as políticas de acesso:

1. Clique no bucket `comprovantes`
2. Vá em **"Policies"** ou **"Políticas"**
3. Clique em **"New Policy"**

#### Policy 1: Permitir Upload

```sql
CREATE POLICY "Permitir upload de comprovantes"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'comprovantes');
```

#### Policy 2: Permitir Leitura Pública

```sql
CREATE POLICY "Permitir leitura pública"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'comprovantes');
```

#### Policy 3: Permitir Atualização (Service Role)

```sql
CREATE POLICY "Permitir atualização pelo service role"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'comprovantes');
```

#### Policy 4: Permitir Deleção (Service Role)

```sql
CREATE POLICY "Permitir deleção pelo service role"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'comprovantes');
```

---

## 🔍 Verificar se Está Funcionando

### Método 1: Teste pela Interface

1. Acesse: `http://157.180.72.42/register-pix-upload`
2. Preencha os dados
3. Selecione um plano
4. Faça o "pagamento" (clique em próximo)
5. Faça upload de uma imagem ou PDF
6. Deve funcionar sem erros!

### Método 2: Teste via Script

Crie um arquivo `test-upload-comprovante.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpload() {
  console.log('🧪 Testando upload de comprovante...\n');

  // Criar arquivo de teste
  const testContent = Buffer.from('Test file content');
  const fileName = `test_${Date.now()}.txt`;

  console.log(`📤 Fazendo upload: ${fileName}`);

  const { data, error } = await supabase.storage
    .from('comprovantes')
    .upload(fileName, testContent, {
      contentType: 'text/plain',
    });

  if (error) {
    console.error('❌ Erro:', error.message);
    if (error.message.includes('Bucket not found')) {
      console.log('\n⚠️  O bucket "comprovantes" não existe!');
      console.log('   Crie o bucket seguindo o guia SETUP-STORAGE-COMPROVANTES.md\n');
    }
    return;
  }

  console.log('✅ Upload bem-sucedido!');
  console.log('📁 Path:', data.path);

  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from('comprovantes')
    .getPublicUrl(fileName);

  console.log('🔗 URL pública:', urlData.publicUrl);

  // Limpar arquivo de teste
  const { error: deleteError } = await supabase.storage
    .from('comprovantes')
    .remove([fileName]);

  if (!deleteError) {
    console.log('🗑️  Arquivo de teste removido\n');
  }

  console.log('✅ Tudo funcionando corretamente!\n');
}

testUpload();
```

Execute:
```bash
node test-upload-comprovante.js
```

---

## 🐛 Problemas Comuns

### Erro: "Bucket not found"

**Causa**: Bucket não foi criado no Supabase Storage

**Solução**: Siga o passo 2 acima para criar o bucket

### Erro: "new row violates row-level security policy"

**Causa**: Políticas RLS muito restritivas

**Solução**:
1. Vá em Storage → comprovantes → Policies
2. Certifique-se que tem policy para INSERT com `TO public`
3. Ou temporariamente desabilite RLS:
   ```sql
   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
   ```
   ⚠️ **Não recomendado em produção!**

### Erro: "File size exceeds limit"

**Causa**: Arquivo muito grande

**Solução**:
1. Vá em Storage → comprovantes → Settings
2. Aumente o **File size limit** para 10MB ou mais

### Erro: "Invalid MIME type"

**Causa**: Tipo de arquivo não permitido

**Solução**:
1. Vá em Storage → comprovantes → Settings
2. Em **Allowed MIME types**, adicione:
   - `image/*` (todas as imagens)
   - `application/pdf` (PDFs)
   - Ou deixe vazio para permitir todos

---

## 📊 Estrutura do Bucket

Após configurado, os arquivos ficarão assim:

```
comprovantes/
├── comprovante_uuid1_timestamp.jpg
├── comprovante_uuid2_timestamp.png
├── comprovante_uuid3_timestamp.pdf
└── ...
```

**Padrão de nome**: `comprovante_{cadastro_id}_{timestamp}.{extensão}`

---

## ✅ Checklist

- [ ] Bucket `comprovantes` criado
- [ ] Bucket marcado como **público**
- [ ] Policy de INSERT criada
- [ ] Policy de SELECT criada
- [ ] File size limit adequado (10MB+)
- [ ] MIME types permitidos configurados
- [ ] Teste de upload funcionando

---

## 🔗 Links Úteis

- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- Supabase RLS Policies: https://supabase.com/docs/guides/auth/row-level-security

---

**Após configurar, teste novamente em:**
```
http://157.180.72.42/register-pix-upload
```
