/**
 * Script de teste: Upload de comprovante
 * Verifica se o bucket 'comprovantes' está configurado corretamente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltam variáveis de ambiente!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  console.log('🧪 Testando Storage de Comprovantes\n');
  console.log('─'.repeat(60));

  // 1. Listar buckets
  console.log('\n1️⃣  Verificando buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('❌ Erro ao listar buckets:', bucketsError.message);
    return;
  }

  const comprovantesBucket = buckets.find(b => b.name === 'comprovantes');

  if (!comprovantesBucket) {
    console.log('❌ Bucket "comprovantes" NÃO ENCONTRADO!');
    console.log('\n📝 Crie o bucket seguindo o guia:');
    console.log('   SETUP-STORAGE-COMPROVANTES.md\n');
    return;
  }

  console.log('✅ Bucket "comprovantes" encontrado');
  console.log(`   ID: ${comprovantesBucket.id}`);
  console.log(`   Público: ${comprovantesBucket.public ? 'Sim' : 'Não'}`);

  // 2. Testar upload
  console.log('\n2️⃣  Testando upload...');

  const testContent = Buffer.from('Test file - ' + new Date().toISOString());
  const fileName = `test_${Date.now()}.txt`;

  console.log(`   Arquivo: ${fileName}`);

  const { data, error } = await supabase.storage
    .from('comprovantes')
    .upload(fileName, testContent, {
      contentType: 'text/plain',
    });

  if (error) {
    console.error('❌ Erro no upload:', error.message);

    if (error.message.includes('row-level security')) {
      console.log('\n⚠️  Problema de permissões (RLS)!');
      console.log('   Crie policies de INSERT e SELECT no bucket');
      console.log('   Veja: SETUP-STORAGE-COMPROVANTES.md\n');
    }

    return;
  }

  console.log('✅ Upload bem-sucedido!');
  console.log(`   Path: ${data.path}`);

  // 3. Obter URL pública
  console.log('\n3️⃣  Obtendo URL pública...');

  const { data: urlData } = supabase.storage
    .from('comprovantes')
    .getPublicUrl(fileName);

  console.log('✅ URL gerada:');
  console.log(`   ${urlData.publicUrl}`);

  // 4. Verificar se arquivo existe
  console.log('\n4️⃣  Verificando se arquivo existe...');

  const { data: files, error: listError } = await supabase.storage
    .from('comprovantes')
    .list('', {
      search: fileName,
    });

  if (listError) {
    console.error('❌ Erro ao listar:', listError.message);
  } else if (files && files.length > 0) {
    console.log('✅ Arquivo encontrado no storage');
    console.log(`   Nome: ${files[0].name}`);
    console.log(`   Tamanho: ${files[0].metadata?.size || '?'} bytes`);
  } else {
    console.log('⚠️  Arquivo não encontrado na listagem');
  }

  // 5. Limpar arquivo de teste
  console.log('\n5️⃣  Limpando arquivo de teste...');

  const { error: deleteError } = await supabase.storage
    .from('comprovantes')
    .remove([fileName]);

  if (deleteError) {
    console.error('❌ Erro ao deletar:', deleteError.message);
  } else {
    console.log('✅ Arquivo de teste removido');
  }

  // Resumo final
  console.log('\n' + '─'.repeat(60));
  console.log('✅ TESTE COMPLETO - Tudo funcionando!\n');
  console.log('📋 Próximos passos:');
  console.log('   1. Acesse: http://157.180.72.42/register-pix-upload');
  console.log('   2. Teste fazer upload de uma imagem ou PDF');
  console.log('   3. Verifique se o comprovante foi salvo\n');
}

// Executar teste
testUpload().catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});
