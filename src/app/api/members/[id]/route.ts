import { NextRequest, NextResponse } from 'next/server';
import {
  getMemberById,
  updateMember,
  removeMember,
  renewMember,
} from '@/services/member-service';
import { UpdateMemberInput } from '@/types';
import { z } from 'zod';

const updateMemberSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  telefone: z.string().nullable().optional(),
  data_entrada: z.string().optional(),
  data_vencimento: z.string().optional(),
  status: z.enum(['ativo', 'removido', 'pausado', 'erro_remocao']).optional(),
  group_id: z.string().uuid().nullable().optional(),
  observacoes: z.string().nullable().optional(),
});

// GET /api/members/[id] - Busca um membro específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const member = await getMemberById(params.id);

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error: any) {
    console.error('Erro ao buscar membro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar membro',
      },
      { status: 500 }
    );
  }
}

// PUT /api/members/[id] - Atualiza um membro
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validar dados
    const validated = updateMemberSchema.parse(body);

    // Atualizar membro
    const member = await updateMember(params.id, validated as UpdateMemberInput);

    return NextResponse.json({
      success: true,
      data: member,
      message: 'Membro atualizado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar membro:', error);

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
        error: error.message || 'Erro ao atualizar membro',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/members/[id] - Remove um membro
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const member = await removeMember(params.id);

    return NextResponse.json({
      success: true,
      data: member,
      message: 'Membro removido com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao remover membro',
      },
      { status: 500 }
    );
  }
}
