#!/usr/bin/env tsx

/**
 * Script para sincronizar membros do grupo Telegram com o banco de dados
 *
 * IMPORTANTE: A API Bot do Telegram tem limitações de privacidade:
 * - Não é possível listar TODOS os membros de um grupo
 * - Apenas administradores podem ser listados automaticamente
 * - Para membros regulares, você precisa fornecer os IDs
 *
 * USO:
 *
 * 1. Sincronizar apenas administradores (automático):
 *    npm run sync:members -- --admins
 *
 * 2. Sincronizar lista de IDs específicos:
 *    npm run sync:members -- --ids "123456789,987654321,555666777"
 *
 * 3. Sincronizar de um arquivo:
 *    npm run sync:members -- --file members.txt
 *    (arquivo com um ID por linha)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Carregar variáveis de ambiente ANTES de importar qualquer coisa
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// Agora importar as dependências
import { getGroupAdministrators, getGroupMembersByIds, getGroupMemberCount } from '../src/lib/telegram';
import { getServiceSupabase } from '../src/lib/supabase';
import { getMemberByTelegramId } from '../src/services/member-service';

const supabase = getServiceSupabase();

interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Sincroniza um membro individual
 */
async function syncMember(
  telegramId: number,
  firstName: string,
  lastName?: string,
  username?: string,
  defaultExpiryDays: number = 30
): Promise<'created' | 'updated' | 'skipped' | 'error'> {
  try {
    // Verificar se já existe
    const existing = await getMemberByTelegramId(telegramId);

    if (existing) {
      console.log(`  ⏭️  Membro ${firstName} (${telegramId}) já existe - pulando`);
      return 'skipped';
    }

    // Calcular data de vencimento padrão (30 dias a partir de hoje)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + defaultExpiryDays);

    // Criar novo membro
    const { data, error } = await supabase
      .from('members')
      .insert({
        telegram_user_id: telegramId,
        telegram_username: username || null,
        telegram_first_name: firstName,
        telegram_last_name: lastName || null,
        nome: `${firstName}${lastName ? ' ' + lastName : ''}`,
        data_vencimento: expiryDate.toISOString(),
        status: 'ativo',
      })
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Erro ao criar ${firstName}:`, error.message);
      return 'error';
    }

    console.log(`  ✅ Criado: ${firstName} (${telegramId}) - vence em ${expiryDate.toLocaleDateString()}`);
    return 'created';
  } catch (error: any) {
    console.error(`  ❌ Erro ao sincronizar ${firstName}:`, error.message);
    return 'error';
  }
}

/**
 * Sincroniza administradores do grupo
 */
async function syncAdministrators(defaultExpiryDays: number): Promise<SyncResult> {
  console.log('\n📋 Buscando administradores do grupo...\n');

  const result = await getGroupAdministrators();

  if (!result.success) {
    console.error('❌ Erro ao buscar administradores:', result.error);
    return { total: 0, created: 0, updated: 0, skipped: 0, errors: [result.error] };
  }

  const admins = result.data.filter(admin => !admin.is_bot);
  console.log(`📊 Encontrados ${admins.length} administradores (excluindo bots)\n`);

  const syncResult: SyncResult = {
    total: admins.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const admin of admins) {
    const result = await syncMember(
      admin.id,
      admin.first_name,
      admin.last_name,
      admin.username,
      defaultExpiryDays
    );

    if (result === 'created') syncResult.created++;
    else if (result === 'updated') syncResult.updated++;
    else if (result === 'skipped') syncResult.skipped++;
    else if (result === 'error') syncResult.errors.push(`Erro ao sincronizar ${admin.first_name}`);
  }

  return syncResult;
}

/**
 * Sincroniza lista de IDs
 */
async function syncMemberIds(userIds: number[], defaultExpiryDays: number): Promise<SyncResult> {
  console.log(`\n📋 Buscando informações de ${userIds.length} membros...\n`);

  const result = await getGroupMembersByIds(userIds);

  if (!result.success) {
    console.error('❌ Erro ao buscar membros:', result.error);
    return { total: 0, created: 0, updated: 0, skipped: 0, errors: [result.error] };
  }

  const members = result.data.filter(member => !member.is_bot);
  console.log(`📊 Encontrados ${members.length} membros válidos (excluindo bots)\n`);

  const syncResult: SyncResult = {
    total: members.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const member of members) {
    const result = await syncMember(
      member.id,
      member.first_name,
      member.last_name,
      member.username,
      defaultExpiryDays
    );

    if (result === 'created') syncResult.created++;
    else if (result === 'updated') syncResult.updated++;
    else if (result === 'skipped') syncResult.skipped++;
    else if (result === 'error') syncResult.errors.push(`Erro ao sincronizar ${member.first_name}`);
  }

  return syncResult;
}

/**
 * Lê IDs de um arquivo
 */
function readIdsFromFile(filePath: string): number[] {
  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const ids = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => parseInt(line))
      .filter(id => !isNaN(id));

    return ids;
  } catch (error: any) {
    console.error('❌ Erro ao ler arquivo:', error.message);
    process.exit(1);
  }
}

/**
 * Main
 */
async function main() {
  console.log('🎯 TLGrupos - Sincronização de Membros\n');

  // Parse argumentos
  const args = process.argv.slice(2);
  const adminsMode = args.includes('--admins');
  const idsIndex = args.indexOf('--ids');
  const fileIndex = args.indexOf('--file');
  const daysIndex = args.indexOf('--days');

  const defaultExpiryDays = daysIndex >= 0 ? parseInt(args[daysIndex + 1]) : 30;

  // Mostrar info do grupo
  const countResult = await getGroupMemberCount();
  if (countResult.success) {
    console.log(`📊 Total de membros no grupo: ${countResult.count}\n`);
  }

  let syncResult: SyncResult;

  if (adminsMode) {
    // Modo: sincronizar administradores
    syncResult = await syncAdministrators(defaultExpiryDays);
  } else if (idsIndex >= 0) {
    // Modo: sincronizar IDs da linha de comando
    const idsString = args[idsIndex + 1];
    if (!idsString) {
      console.error('❌ Erro: forneça os IDs após --ids');
      console.error('Exemplo: npm run sync:members -- --ids "123456789,987654321"');
      process.exit(1);
    }

    const ids = idsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (ids.length === 0) {
      console.error('❌ Erro: nenhum ID válido fornecido');
      process.exit(1);
    }

    syncResult = await syncMemberIds(ids, defaultExpiryDays);
  } else if (fileIndex >= 0) {
    // Modo: sincronizar IDs de arquivo
    const filePath = args[fileIndex + 1];
    if (!filePath) {
      console.error('❌ Erro: forneça o caminho do arquivo após --file');
      console.error('Exemplo: npm run sync:members -- --file members.txt');
      process.exit(1);
    }

    const ids = readIdsFromFile(filePath);

    if (ids.length === 0) {
      console.error('❌ Erro: nenhum ID encontrado no arquivo');
      process.exit(1);
    }

    console.log(`📁 Lidos ${ids.length} IDs do arquivo ${filePath}`);
    syncResult = await syncMemberIds(ids, defaultExpiryDays);
  } else {
    // Nenhum modo especificado
    console.log('❌ Erro: você precisa especificar um modo de sincronização\n');
    console.log('Opções disponíveis:\n');
    console.log('  --admins                  Sincronizar apenas administradores');
    console.log('  --ids "id1,id2,id3"       Sincronizar IDs específicos');
    console.log('  --file members.txt        Sincronizar IDs de um arquivo');
    console.log('  --days 60                 Dias até vencimento (padrão: 30)\n');
    console.log('Exemplos:\n');
    console.log('  npm run sync:members -- --admins');
    console.log('  npm run sync:members -- --ids "123456789,987654321"');
    console.log('  npm run sync:members -- --file members.txt --days 60\n');
    process.exit(1);
  }

  // Exibir resultado
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADO DA SINCRONIZAÇÃO\n');
  console.log(`Total processados: ${syncResult.total}`);
  console.log(`✅ Criados: ${syncResult.created}`);
  console.log(`🔄 Atualizados: ${syncResult.updated}`);
  console.log(`⏭️  Já existiam: ${syncResult.skipped}`);
  console.log(`❌ Erros: ${syncResult.errors.length}`);

  if (syncResult.errors.length > 0) {
    console.log('\nErros:');
    syncResult.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('='.repeat(50));

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
