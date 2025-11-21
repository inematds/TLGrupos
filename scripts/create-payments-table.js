const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPaymentsTable() {
  console.log('🚀 Iniciando criação da tabela de pagamentos...\n');

  // Ler o arquivo SQL
  const sqlFile = path.join(__dirname, '..', 'sql', 'EXECUTAR_MIGRACOES_PAGAMENTOS.sql');

  if (!fs.existsSync(sqlFile)) {
    console.error('❌ Arquivo EXECUTAR_MIGRACOES_PAGAMENTOS.sql não encontrado!');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('📄 SQL carregado do arquivo EXECUTAR_MIGRACOES_PAGAMENTOS.sql');
  console.log('📦 Executando migração no Supabase...\n');

  try {
    // Executar o SQL completo
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se a função exec_sql não existir, tentar executar diretamente
      console.log('⚠️  Função exec_sql não encontrada, tentando método alternativo...\n');

      // Dividir o SQL em comandos individuais
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        console.log(`   [${i + 1}/${commands.length}] Executando comando...`);

        try {
          // Usar o método .from() para comandos DDL não funciona bem
          // Vamos apenas informar que precisa ser executado manualmente
          if (i === 0) {
            console.log('\n⚠️  ATENÇÃO: O Supabase não permite executar DDL via API JavaScript.');
            console.log('   Você precisa executar o SQL manualmente no Supabase SQL Editor.\n');
            break;
          }
        } catch (cmdError) {
          console.error(`   ❌ Erro no comando ${i + 1}:`, cmdError.message);
        }
      }

      console.log('\n📋 INSTRUÇÕES PARA EXECUTAR A MIGRAÇÃO:\n');
      console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Selecione seu projeto');
      console.log('3. Vá em "SQL Editor" no menu lateral');
      console.log('4. Clique em "New query"');
      console.log('5. Copie o conteúdo do arquivo: sql/EXECUTAR_MIGRACOES_PAGAMENTOS.sql');
      console.log('6. Cole no editor');
      console.log('7. Clique em "Run" (ou pressione Ctrl+Enter)');
      console.log('8. Aguarde a confirmação de sucesso\n');
      console.log('📁 Arquivo SQL localizado em: ' + sqlFile + '\n');

      // Abrir o arquivo SQL para facilitar
      console.log('💡 Dica: O conteúdo do SQL está disponível no arquivo mencionado acima.');
      console.log('   Você pode abrir com: cat sql/EXECUTAR_MIGRACOES_PAGAMENTOS.sql\n');

      process.exit(0);
    }

    console.log('✅ Migração executada com sucesso!');
    console.log('✅ Tabela "payments" criada!');
    console.log('✅ Funções "approve_payment" e "reject_payment" criadas!');
    console.log('✅ Políticas RLS configuradas!\n');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    console.error('\n📋 Por favor, execute manualmente no Supabase SQL Editor:');
    console.error('   Arquivo: sql/EXECUTAR_MIGRACOES_PAGAMENTOS.sql\n');
    process.exit(1);
  }
}

// Verificar se a tabela já existe
async function checkTableExists() {
  console.log('🔍 Verificando se a tabela payments já existe...\n');

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('not found')) {
        console.log('⚠️  Tabela "payments" não existe ainda.\n');
        return false;
      }
      throw error;
    }

    console.log('✅ Tabela "payments" já existe!\n');
    console.log('ℹ️  Não é necessário executar a migração novamente.\n');
    return true;

  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error.message);
    return false;
  }
}

// Executar
async function main() {
  const exists = await checkTableExists();

  if (exists) {
    console.log('✅ Tudo pronto! A tabela de pagamentos já está configurada.\n');
    process.exit(0);
  }

  await createPaymentsTable();
}

main();
