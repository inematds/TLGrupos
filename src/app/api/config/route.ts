import { NextResponse } from 'next/server';

// GET /api/config - Retorna status básico de configuração
export async function GET() {
  try {
    // Verificar se as variáveis essenciais estão configuradas
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    const hasTelegram = !!process.env.TELEGRAM_BOT_TOKEN;
    const hasResend = !!process.env.RESEND_API_KEY;

    return NextResponse.json({
      success: true,
      configured: hasSupabase && hasTelegram,
      services: {
        supabase: hasSupabase,
        telegram: hasTelegram,
        email: hasResend
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
