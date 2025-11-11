import { NextRequest, NextResponse } from 'next/server';
import { sendRejectionEmail } from '@/services/email-service';
import { z } from 'zod';

// Schema de validação
const enviarEmailReprovacaoSchema = z.object({
  email: z.string().email('Email inválido'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  motivo: z.string().min(1, 'Motivo é obrigatório'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = enviarEmailReprovacaoSchema.parse(body);

    // Enviar email usando o serviço
    const success = await sendRejectionEmail({
      to: validated.email,
      nome: validated.nome,
      motivo: validated.motivo,
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Email de reprovação enviado com sucesso',
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
    console.error('Erro ao enviar email de reprovação:', error);

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
        error: error.message || 'Erro ao enviar email de reprovação',
      },
      { status: 500 }
    );
  }
}
