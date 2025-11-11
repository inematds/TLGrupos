import { NextRequest, NextResponse } from 'next/server';
import { sendInviteLink } from '@/services/email-service';
import { z } from 'zod';

// Schema de validação
const enviarEmailAcessoSchema = z.object({
  email: z.string().email('Email inválido'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  invite_link: z.string().url('Link inválido'),
  plano_dias: z.number().int().positive('Plano inválido'),
  data_vencimento: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = enviarEmailAcessoSchema.parse(body);

    // Calcular data de vencimento se não fornecida
    let dataExpiracao = validated.data_vencimento;
    if (!dataExpiracao) {
      const hoje = new Date();
      const vencimento = new Date(hoje);
      vencimento.setDate(vencimento.getDate() + validated.plano_dias);
      dataExpiracao = vencimento.toISOString();
    }

    // Enviar email usando o serviço
    const success = await sendInviteLink({
      to: validated.email,
      nome: validated.nome,
      inviteLink: validated.invite_link,
      planoDias: validated.plano_dias,
      dataExpiracao,
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Email de acesso enviado com sucesso',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao enviar email',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao enviar email de acesso:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao enviar email de acesso',
      },
      { status: 500 }
    );
  }
}
