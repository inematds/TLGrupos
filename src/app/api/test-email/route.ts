import { NextRequest, NextResponse } from 'next/server';
import { sendInviteLink } from '@/services/email-service';

/**
 * API de teste para verificar se o envio de email está funcionando
 * DELETE esta rota em produção!
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Email destinatário é obrigatório' },
        { status: 400 }
      );
    }

    // Enviar email de teste
    const success = await sendInviteLink({
      to,
      nome: 'Usuário Teste',
      inviteLink: 'https://t.me/+XXXXXXXXX',
      planoDias: 30,
      dataExpiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Email enviado com sucesso!',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Falha ao enviar email. Verifique as configurações.',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro no teste de email:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
