/**
 * Script para sincronizar grupos do banco de dados com .env.local
 * Busca todos os grupos ativos no banco e atualiza TELEGRAM_GROUP_ID
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function syncGruposToEnv() {
  console.log('🔍 Buscando grupos ativos no banco de dados...\n');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Tentar buscar na tabela telegram_groups
    const { data: groups, error } = await supabase
      .from('telegram_groups')
      .select('id, nome, telegram_group_id, descricao, ativo')
      .eq('ativo', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('❌ Erro ou tabela não existe:', error.message);
      console.log('\n💡 Dica: A tabela telegram_groups ainda não foi criada.');
      console.log('   Você pode gerenciar grupos manualmente editando .env.local\n');
      return;
    }

    if (!groups || groups.length === 0) {
      console.log('⚠️  Nenhum grupo ativo encontrado no banco de dados');
      console.log('   Acesse http://192.168.1.91:3000/dashboard/grupos para cadastrar grupos\n');
      return;
    }

    // Mostrar grupos encontrados
    console.log(`✅ ${groups.length} grupo(s) ativo(s) encontrado(s):\n`);
    groups.forEach((g, i) => {
      console.log(`${i + 1}. ${g.nome}`);
      console.log(`   ID: ${g.telegram_group_id}`);
      if (g.descricao) console.log(`   Descrição: ${g.descricao}`);
      console.log('');
    });

    // Gerar string de IDs
    const groupIds = groups.map(g => g.telegram_group_id).join(',');
    console.log('📋 IDs para configurar:');
    console.log(`TELEGRAM_GROUP_ID=${groupIds}\n`);

    // Ler .env.local atual
    const envPath = path.join(__dirname, '..', '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Substituir TELEGRAM_GROUP_ID
    const regex = /TELEGRAM_GROUP_ID=.*/;
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `TELEGRAM_GROUP_ID=${groupIds}`);
      console.log('✏️  Atualizando .env.local...');
    } else {
      console.log('⚠️  TELEGRAM_GROUP_ID não encontrado no .env.local');
      console.log('   Adicione manualmente: TELEGRAM_GROUP_ID=' + groupIds);
      return;
    }

    // Salvar .env.local
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ .env.local atualizado com sucesso!\n');

    console.log('🔄 Próximo passo: Reinicie o bot para aplicar as mudanças');
    console.log('   npm run start:bot\n');

  } catch (error) {
    console.error('❌ Erro ao sincronizar grupos:', error.message);
  }
}

syncGruposToEnv();
