import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * POST /api/bot/restart
 * Reinicia o bot do Telegram
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Bot Restart] Iniciando reinicialização do bot...');

    // Tentar reiniciar com PM2 primeiro (produção)
    try {
      const { stdout: pm2List } = await execAsync('pm2 list');

      if (pm2List.includes('tlgrupos-bot')) {
        console.log('[Bot Restart] Reiniciando bot via PM2...');
        await execAsync('pm2 restart tlgrupos-bot');
        console.log('[Bot Restart] ✅ Bot reiniciado via PM2');

        return NextResponse.json({
          success: true,
          message: 'Bot reiniciado com sucesso via PM2',
          method: 'pm2',
        });
      }
    } catch (pm2Error) {
      console.log('[Bot Restart] PM2 não disponível, tentando método alternativo...');
    }

    // Fallback: Matar processos Node.js do bot (desenvolvimento)
    try {
      console.log('[Bot Restart] Procurando processos do bot...');

      // Procurar processos relacionados ao bot
      const { stdout: processes } = await execAsync(
        'ps aux | grep "start-bot" | grep -v grep | awk \'{print $2}\''
      );

      const pids = processes.trim().split('\n').filter(pid => pid);

      if (pids.length > 0) {
        console.log(`[Bot Restart] Encontrados ${pids.length} processo(s): ${pids.join(', ')}`);

        // Matar processos
        for (const pid of pids) {
          try {
            await execAsync(`kill -15 ${pid}`); // SIGTERM (graceful)
            console.log(`[Bot Restart] Processo ${pid} finalizado`);
          } catch (killError) {
            console.warn(`[Bot Restart] Não foi possível matar processo ${pid}`);
          }
        }

        // Aguardar 2 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Reiniciar bot
        console.log('[Bot Restart] Reiniciando bot...');
        exec('npm run start:bot');

        console.log('[Bot Restart] ✅ Bot reiniciado com sucesso');

        return NextResponse.json({
          success: true,
          message: 'Bot reiniciado com sucesso',
          method: 'manual',
          processesKilled: pids.length,
        });
      }

      // Se não encontrou processos, apenas iniciar
      console.log('[Bot Restart] Nenhum processo encontrado, iniciando bot...');
      exec('npm run start:bot', { detached: true, stdio: 'ignore' });

      return NextResponse.json({
        success: true,
        message: 'Bot iniciado com sucesso',
        method: 'start',
      });

    } catch (error: any) {
      console.error('[Bot Restart] Erro ao reiniciar bot:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Não foi possível reiniciar o bot',
          details: error.message,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Bot Restart] Erro geral:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar reinicialização do bot',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
