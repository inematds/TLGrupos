/**
 * Serviço para gerenciar crontab na VPS via web
 * Atualiza automaticamente o crontab quando alterações são feitas via interface
 */

import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configuração do Supabase não encontrada');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Atualiza o crontab na VPS com base nos cron jobs ativos do banco
 */
export async function atualizarCrontab() {
  try {
    const supabase = getSupabaseClient();

    // 1. Buscar todos os cron jobs ativos do banco
    const { data: jobs, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('ativo', true)
      .order('created_at');

    if (error) {
      console.error('Erro ao buscar cron jobs:', error);
      return { success: false, error: error.message };
    }

    // 2. Gerar conteúdo do crontab
    let crontabContent = `# ═══════════════════════════════════════════════════════════
# TLGrupos - Processos Automáticos (Gerenciado via Web)
# ⚠️  NÃO EDITE MANUALMENTE - Use /admin/cron-jobs
# Última atualização: ${new Date().toLocaleString('pt-BR')}
# ═══════════════════════════════════════════════════════════

`;

    if (!jobs || jobs.length === 0) {
      crontabContent += '# Nenhum cron job ativo no momento\n';
    } else {
      for (const job of jobs) {
        const logFile = `/var/log/tlgrupos/${job.nome.toLowerCase().replace(/\s+/g, '-')}.log`;

        crontabContent += `
# ${job.nome}
# ${job.descricao}
${job.frequencia} curl -s -X POST http://localhost:3000${job.endpoint} -H "Authorization: Bearer ${process.env.CRON_SECRET}" >> ${logFile} 2>&1

`;
      }

      // Adicionar limpeza automática de logs (todo domingo às 02:00)
      crontabContent += `
# Limpeza automática de logs (todo domingo às 02:00)
0 2 * * 0 find /var/log/tlgrupos -name "*.log" -exec sh -c 'tail -n 1000 {} > {}.tmp && mv {}.tmp {}' \\;

`;
    }

    // 3. Escrever arquivo temporário
    const tempFile = '/tmp/tlgrupos-crontab.txt';
    await fs.writeFile(tempFile, crontabContent);

    // 4. Instalar no crontab (apenas em produção/VPS)
    if (process.env.NODE_ENV === 'production') {
      await execAsync(`crontab ${tempFile}`);
      console.log('✅ Crontab atualizado com sucesso!');
    } else {
      console.log('⚠️  Modo desenvolvimento - crontab NÃO foi instalado');
      console.log('📄 Conteúdo que seria instalado:');
      console.log(crontabContent);
    }

    // 5. Limpar arquivo temporário
    try {
      await fs.unlink(tempFile);
    } catch (err) {
      // Ignorar erro se arquivo não existir
    }

    return {
      success: true,
      message: 'Crontab atualizado com sucesso',
      jobsCount: jobs?.length || 0,
      preview: crontabContent
    };

  } catch (error: any) {
    console.error('Erro ao atualizar crontab:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido'
    };
  }
}

/**
 * Traduz expressão cron para texto legível
 */
export function traduzirFrequencia(cronExpr: string): string {
  const traducoes: { [key: string]: string } = {
    '*/5 * * * *': 'A cada 5 minutos',
    '*/10 * * * *': 'A cada 10 minutos',
    '*/15 * * * *': 'A cada 15 minutos',
    '*/30 * * * *': 'A cada 30 minutos',
    '0 * * * *': 'A cada 1 hora',
    '0 */2 * * *': 'A cada 2 horas',
    '0 */6 * * *': 'A cada 6 horas',
    '0 */12 * * *': 'A cada 12 horas',
    '0 0 * * *': 'Diariamente à meia-noite',
    '0 3 * * *': 'Diariamente às 03:00',
    '0 8 * * *': 'Diariamente às 08:00',
    '0 12 * * *': 'Diariamente ao meio-dia',
    '0 2 * * 0': 'Semanalmente (domingo às 02:00)',
    '0 0 1 * *': 'Mensalmente (dia 1 à meia-noite)',
  };

  return traducoes[cronExpr] || cronExpr;
}

/**
 * Calcula próxima execução baseada na expressão cron
 * (Implementação simplificada - em produção usar biblioteca como 'cron-parser')
 */
export function calcularProximaExecucao(cronExpr: string): Date {
  // Para simplificar, vou retornar estimativas aproximadas
  const agora = new Date();

  // A cada X minutos
  if (cronExpr.startsWith('*/')) {
    const minutos = parseInt(cronExpr.split(' ')[0].substring(2));
    agora.setMinutes(agora.getMinutes() + minutos);
    return agora;
  }

  // A cada hora (0 * * * *)
  if (cronExpr.startsWith('0 ')) {
    agora.setHours(agora.getHours() + 1);
    agora.setMinutes(0);
    agora.setSeconds(0);
    return agora;
  }

  // Horário específico diário (0 8 * * *)
  const match = cronExpr.match(/^0 (\d+) \* \* \*$/);
  if (match) {
    const hora = parseInt(match[1]);
    const proxima = new Date(agora);
    proxima.setHours(hora);
    proxima.setMinutes(0);
    proxima.setSeconds(0);

    // Se já passou hoje, agendar para amanhã
    if (proxima <= agora) {
      proxima.setDate(proxima.getDate() + 1);
    }
    return proxima;
  }

  // Fallback: 1 hora
  agora.setHours(agora.getHours() + 1);
  return agora;
}
