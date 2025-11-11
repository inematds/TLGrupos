import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram-webhook';

/**
 * POST /api/webhook - Recebe atualizações do Telegram
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Processar update do Telegram
    await bot.handleUpdate(body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook - Info do webhook
 */
export async function GET() {
  try {
    const botInfo = await bot.telegram.getMe();

    return NextResponse.json({
      success: true,
      data: {
        bot: {
          id: botInfo.id,
          username: botInfo.username,
          first_name: botInfo.first_name,
        },
        webhook: {
          status: 'active',
          features: [
            'Auto-cadastro ao entrar no grupo',
            'Auto-cadastro ao enviar mensagem',
            'Comando /registrar',
            'Comando /status',
          ],
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
