/**
 * Script de verificação: Sistema de Cadastro Externo
 * Verifica se a tabela e configurações estão corretas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltam variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSetup() {
  console.log('🔍 Verificando configuração do Sistema de Cadastro Externo...\n');

  let allOk = true;

  // 1. Verificar se tabela existe
  console.log('1️⃣  Verificando tabela system_config...');
  const { data: tableCheck, error: tableError } = await supabase
    .from('system_config')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('   ❌ Tabela system_config NÃO EXISTE!');
    console.error('   📝 Execute o SQL em: migrations/create-system-config.sql');
    console.error('   🔗 Ou veja: SETUP-CADASTRO-EXTERNO.md\n');
    allOk = false;
  } else {
    console.log('   ✅ Tabela system_config existe\n');
  }

  // 2. Verificar configurações necessárias
  console.log('2️⃣  Verificando configurações...');
  const { data: configs, error: configError } = await supabase
    .from('system_config')
    .select('*')
    .in('chave', ['cadastro_url', 'cadastro_externo', 'nome_sistema']);

  if (configError || !configs || configs.length === 0) {
    console.error('   ❌ Configurações não encontradas!');
    console.error('   📝 Execute o INSERT no SQL do SETUP-CADASTRO-EXTERNO.md\n');
    allOk = false;
  } else {
    console.log(`   ✅ ${configs.length} configurações encontradas:`);
    configs.forEach(cfg => {
      console.log(`      ${cfg.chave.padEnd(20)} = ${cfg.valor}`);
    });
    console.log('');

    // Verificar valores específicos
    const cadastroUrl = configs.find(c => c.chave === 'cadastro_url');
    const cadastroExterno = configs.find(c => c.chave === 'cadastro_externo');

    if (!cadastroUrl) {
      console.error('   ⚠️  Falta configuração: cadastro_url');
      allOk = false;
    }

    if (!cadastroExterno) {
      console.error('   ⚠️  Falta configuração: cadastro_externo');
      allOk = false;
    }
  }

  // 3. Verificar APIs
  console.log('3️⃣  Verificando arquivos de API...');
  const fs = require('fs');
  const path = require('path');

  const apiFiles = [
    'src/app/api/config/route.ts',
    'src/app/api/generate-cadastro-html/route.ts',
  ];

  apiFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.error(`   ❌ ${file} NÃO ENCONTRADO!`);
      allOk = false;
    }
  });
  console.log('');

  // 4. Verificar dashboard
  console.log('4️⃣  Verificando dashboard settings...');
  const settingsPath = path.join(process.cwd(), 'src/app/dashboard/settings/page.tsx');
  if (fs.existsSync(settingsPath)) {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    if (content.includes('getCadastroUrl') || content.includes('cadastro_url')) {
      console.log('   ✅ Dashboard settings atualizado\n');
    } else {
      console.error('   ⚠️  Dashboard pode estar desatualizado (não encontrou referências ao cadastro_url)\n');
    }
  } else {
    console.error('   ❌ Dashboard settings não encontrado!\n');
    allOk = false;
  }

  // 5. Testar API
  console.log('5️⃣  Testando endpoint /api/config...');
  try {
    const testUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log(`   🔗 URL base: ${testUrl}`);

    // Não vamos fazer fetch real aqui, só mostrar como testar
    console.log('   💡 Para testar manualmente:');
    console.log(`      curl ${testUrl}/api/config`);
    console.log('');
  } catch (error) {
    console.error('   ⚠️  Não foi possível testar API (normal se servidor não estiver rodando)\n');
  }

  // Resumo final
  console.log('─'.repeat(60));
  if (allOk) {
    console.log('✅ TUDO OK! Sistema de Cadastro Externo está configurado!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('   1. Acesse: http://157.180.72.42/dashboard/settings');
    console.log('   2. Baixe o cadastro.html');
    console.log('   3. Hospede o arquivo');
    console.log('   4. Configure a URL');
    console.log('   5. Teste com /cadastro no Telegram');
  } else {
    console.log('❌ PROBLEMAS ENCONTRADOS!');
    console.log('');
    console.log('📝 Leia o guia completo em: SETUP-CADASTRO-EXTERNO.md');
    console.log('   Ou execute o SQL em: migrations/create-system-config.sql');
  }
  console.log('─'.repeat(60));
}

checkSetup().catch(console.error);
