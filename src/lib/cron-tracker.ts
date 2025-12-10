import { serviceSupabase } from './supabase';

/**
 * Atualiza os dados de execução de um CRON job na tabela cron_jobs
 *
 * @param endpoint - O endpoint do CRON (ex: "/api/cron/send-notifications")
 * @param success - Se a execução foi bem sucedida
 */
export async function trackCronExecution(endpoint: string, success: boolean) {
  try {
    // Buscar o CRON job pelo endpoint
    const { data: cronJob, error: fetchError } = await serviceSupabase
      .from('cron_jobs')
      .select('*')
      .eq('endpoint', endpoint)
      .single();

    if (fetchError || !cronJob) {
      console.error(`[CronTracker] CRON job não encontrado para endpoint: ${endpoint}`);
      return;
    }

    // Calcular próxima execução baseado na frequência (cron expression)
    const proximoExec = calculateNextExecution(cronJob.frequencia);

    // Atualizar contadores
    const updates: any = {
      ultimo_exec: new Date().toISOString(),
      proximo_exec: proximoExec,
      total_execucoes: (cronJob.total_execucoes || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    if (success) {
      updates.total_sucessos = (cronJob.total_sucessos || 0) + 1;
    } else {
      updates.total_erros = (cronJob.total_erros || 0) + 1;
    }

    // Atualizar no banco
    const { error: updateError } = await serviceSupabase
      .from('cron_jobs')
      .update(updates)
      .eq('id', cronJob.id);

    if (updateError) {
      console.error('[CronTracker] Erro ao atualizar CRON job:', updateError);
    } else {
      console.log(`[CronTracker] ✓ CRON ${cronJob.nome} atualizado - Exec: ${updates.total_execucoes}, Sucessos: ${updates.total_sucessos || cronJob.total_sucessos || 0}, Erros: ${updates.total_erros || cronJob.total_erros || 0}`);
    }

  } catch (error: any) {
    console.error('[CronTracker] Erro ao rastrear execução:', error);
  }
}

/**
 * Calcula a próxima execução baseado na expressão cron
 *
 * @param cronExpression - Expressão cron
 * @returns Data/hora da próxima execução em ISO string
 */
function calculateNextExecution(cronExpression: string): string {
  const now = new Date();

  // Parse básico da expressão cron: "minuto hora dia mes dia_semana"
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 5) {
    // Expressão inválida, retornar próxima hora
    return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  const next = new Date(now);

  // Caso simples: intervalo de minutos
  if (minute.startsWith('*/')) {
    const interval = parseInt(minute.substring(2));
    const minutesUntilNext = interval - (now.getMinutes() % interval);
    next.setMinutes(now.getMinutes() + minutesUntilNext);
    next.setSeconds(0);
    next.setMilliseconds(0);
    return next.toISOString();
  }

  // Caso: minuto específico
  const targetMinute = minute === '*' ? 0 : parseInt(minute);
  const targetHour = hour === '*' ? now.getHours() : parseInt(hour);

  next.setMinutes(targetMinute);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // Se hora é específica
  if (hour !== '*') {
    next.setHours(targetHour);

    // Se já passou a hora de hoje, ir para amanhã
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  } else {
    // Hora atual, minuto específico
    if (next <= now) {
      next.setHours(next.getHours() + 1);
    }
  }

  return next.toISOString();
}
