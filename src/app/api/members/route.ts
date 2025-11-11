import { NextRequest, NextResponse } from 'next/server';
import { getMembers, createMember, getStats } from '@/services/member-service';
import { CreateMemberInput } from '@/types';
import { z } from 'zod';

// Schema de validação
const createMemberSchema = z.object({
  telegram_user_id: z.number().optional(),
  telegram_username: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().optional(),
  data_vencimento: z.string().optional(),
  plan_id: z.string().uuid().optional(), // Plano selecionado
  dias_acesso: z.number().optional(), // Para registro público
  origem: z.string().optional(),
  observacoes: z.string().optional(),
});

// GET /api/members - Lista todos os membros
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : undefined;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!)
      : undefined;

    const result = await getMembers({ status, search, limit, offset });

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error: any) {
    console.error('Erro ao buscar membros:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar membros',
      },
      { status: 500 }
    );
  }
}

// POST /api/members - Cria novo membro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    const validated = createMemberSchema.parse(body);

    // Criar membro
    const result = await createMember(validated as CreateMemberInput);

    return NextResponse.json({
      success: true,
      data: result.member,
      inviteLink: result.inviteLink,
      message: 'Membro criado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao criar membro:', error);

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
        error: error.message || 'Erro ao criar membro',
      },
      { status: 500 }
    );
  }
}
