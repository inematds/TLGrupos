#!/usr/bin/env node
/**
 * Script de Diagnóstico de Saúde da Produção
 * Verifica se todos os serviços estão funcionando corretamente
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🏥 DIAGNÓSTICO DE SAÚDE - TLGrupos Produção');
console.log('═══════════════════════════════════════════════════\n');

async function checkHealth() {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // 1. Verificar conexão com Supabase
  console.log('📊 1. Testando conexão com Supabase...');
  try {
    const { data, error } = await supabase.from('members').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('   ✅ Conexão OK - Supabase respondendo');
    results.passed++;
  } catch (error) {
    console.log('   ❌ ERRO na conexão:', error.message);
    results.failed++;
  }

  // 2. Verificar estatísticas
  console.log('\n📈 2. Verificando estatísticas gerais...');
  try {
    const { data: stats, error } = await supabase.from('stats').select('*').single();
    if (error) throw error;

    console.log('   ✅ View stats funcionando:');
    console.log(`      • Total de Cadastros: ${stats.total_cadastros}`);
    console.log(`      • Membros Ativos: ${stats.total_ativos}`);
    console.log(`      • Vencidos: ${stats.total_vencidos}`);
    console.log(`      • Removidos: ${stats.total_removidos}`);
    console.log(`      • Erro Remoção: ${stats.erro_remocao}`);

    if (stats.ativos_mas_vencidos > 0) {
      console.log(`   ⚠️  ATENÇÃO: ${stats.ativos_mas_vencidos} membros ativos mas vencidos (requer ação)`);
      results.warnings++;
    }

    results.passed++;
  } catch (error) {
    console.log('   ❌ ERRO ao buscar stats:', error.message);
    results.failed++;
  }

  // 3. Verificar membros ativos
  console.log('\n👥 3. Verificando membros ativos...');
  try {
    const { data: ativos, error } = await supabase
      .from('members')
      .select('id, nome, data_vencimento, no_grupo, telegram_user_id')
      .eq('status', 'ativo')
      .order('data_vencimento', { ascending: true })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ ${ativos.length} membros ativos encontrados (mostrando 5 primeiros):`);
    ativos.forEach(m => {
      const venc = new Date(m.data_vencimento);
      const hoje = new Date();
      const diasRestantes = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
      const status = diasRestantes < 0 ? '🔴 VENCIDO' : diasRestantes <= 7 ? '🟡 VENCE EM BREVE' : '🟢 OK';

      console.log(`      ${status} ${m.nome} - Vence: ${venc.toLocaleDateString('pt-BR')} (${diasRestantes}d) - ${m.no_grupo ? 'No grupo' : 'Fora do grupo'}`);
    });

    results.passed++;
  } catch (error) {
    console.log('   ❌ ERRO ao buscar membros ativos:', error.message);
    results.failed++;
  }

  // 4. Verificar grupos Telegram
  console.log('\n🤖 4. Verificando grupos Telegram...');
  try {
    const { data: grupos, error } = await supabase
      .from('telegram_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`   ✅ ${grupos.length} grupos configurados:`);
    grupos.forEach(g => {
      const isPrincipal = g.is_paid_group ? '💰 PAGO' : '🆓 FREE';
      console.log(`      ${isPrincipal} ${g.nome} (ID: ${g.group_id})`);
    });

    results.passed++;
  } catch (error) {
    console.log('   ❌ ERRO ao buscar grupos:', error.message);
    results.failed++;
  }

  // 5. Verificar pagamentos recentes
  console.log('\n💰 5. Verificando pagamentos recentes...');
  try {
    const { data: pagamentos, error } = await supabase
      .from('payments')
      .select('id, status, valor, data_pagamento, member:members(nome)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Últimos 5 pagamentos:`);
    pagamentos.forEach(p => {
      const statusIcon = p.status === 'aprovado' ? '✅' : p.status === 'pendente' ? '⏳' : '❌';
      const memberName = p.member?.nome || 'N/A';
      console.log(`      ${statusIcon} ${p.status.toUpperCase()} - R$ ${parseFloat(p.valor).toFixed(2)} - ${memberName}`);
    });

    // Contar pendentes
    const { count: pendentes } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente');

    if (pendentes > 0) {
      console.log(`   ⚠️  ATENÇÃO: ${pendentes} pagamentos pendentes de aprovação`);
      results.warnings++;
    }

    results.passed++;
  } catch (error) {
    console.log('   ❌ ERRO ao buscar pagamentos:', error.message);
    results.failed++;
  }

  // 6. Verificar variáveis de ambiente
  console.log('\n🔐 6. Verificando variáveis de ambiente...');
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_GROUP_ID',
    'RESEND_API_KEY',
    'CRON_SECRET'
  ];

  let envOk = true;
  envVars.forEach(varName => {
    if (process.env[varName]) {
      const preview = process.env[varName].substring(0, 20) + '...';
      console.log(`   ✅ ${varName}: ${preview}`);
    } else {
      console.log(`   ❌ ${varName}: NÃO CONFIGURADA`);
      envOk = false;
    }
  });

  if (envOk) {
    results.passed++;
  } else {
    console.log('   ⚠️  Algumas variáveis de ambiente não estão configuradas');
    results.failed++;
  }

  // 7. Verificar configuração do Bot
  console.log('\n🤖 7. Verificando configuração do Bot Telegram...');
  const groupIds = process.env.TELEGRAM_GROUP_ID?.split(',').filter(id => id.trim());
  if (groupIds && groupIds.length > 0) {
    console.log(`   ✅ Bot configurado para ${groupIds.length} grupos:`);
    groupIds.forEach((id, idx) => {
      console.log(`      ${idx + 1}. ${id.trim()}`);
    });
    results.passed++;
  } else {
    console.log('   ❌ Nenhum grupo configurado para o bot');
    results.failed++;
  }

  // 8. Verificar logs recentes
  console.log('\n📝 8. Verificando logs de atividade...');
  try {
    const { data: logs, error } = await supabase
      .from('logs')
      .select('acao, detalhes, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Últimas 5 atividades:`);
    logs.forEach(log => {
      const data = new Date(log.created_at).toLocaleString('pt-BR');
      const tipo = log.detalhes?.tipo || log.acao;
      console.log(`      📌 ${data} - ${tipo}`);
    });

    results.passed++;
  } catch (error) {
    console.log('   ⚠️  Tabela de logs não disponível ou vazia:', error.message);
    results.warnings++;
  }

  // Resumo Final
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 RESUMO DO DIAGNÓSTICO\n');
  console.log(`   ✅ Testes Passados: ${results.passed}`);
  console.log(`   ❌ Testes Falhados: ${results.failed}`);
  console.log(`   ⚠️  Avisos: ${results.warnings}`);

  console.log('\n🎯 STATUS GERAL:');
  if (results.failed === 0 && results.warnings === 0) {
    console.log('   🟢 SISTEMA TOTALMENTE OPERACIONAL\n');
    process.exit(0);
  } else if (results.failed === 0) {
    console.log('   🟡 SISTEMA OPERACIONAL COM AVISOS\n');
    console.log('   📋 Ações recomendadas:');
    console.log('      • Revisar membros ativos mas vencidos');
    console.log('      • Aprovar pagamentos pendentes');
    process.exit(0);
  } else {
    console.log('   🔴 SISTEMA COM PROBLEMAS\n');
    console.log('   🚨 Ações necessárias:');
    console.log('      • Verificar conexão com Supabase');
    console.log('      • Verificar variáveis de ambiente');
    console.log('      • Verificar configuração do bot');
    process.exit(1);
  }
}

checkHealth().catch(error => {
  console.error('\n❌ ERRO FATAL:', error);
  process.exit(1);
});
