import { NextRequest, NextResponse } from 'next/server';
import { renewMember } from '@/services/member-service';
import { z } from 'zod';

const renewSchema = z.object({
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
});

// POST /api/members/[id]/renew - Renova a assinatura de um membro
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = renewSchema.parse(body);

    const member = await renewMember(params.id, validated.data_vencimento);

    return NextResponse.json({
      success: true,
      data: member,
      message: 'Assinatura renovada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao renovar membro:', error);

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
        error: error.message || 'Erro ao renovar membro',
      },
      { status: 500 }
    );
  }
}
