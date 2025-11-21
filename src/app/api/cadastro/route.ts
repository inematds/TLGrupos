import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createMember } from '@/services/member-service';
import { z } from 'zod';

// Schema de validação para cadastro completo
const cadastroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().min(10, 'Telefone inválido').optional().or(z.literal('')),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
  nicho: z.string().optional(),
  interesse: z.string().optional(),
  grupo_favorito: z.string().optional(),
  telegram_user_id: z.number().optional(),
  telegram_username: z.string().optional(),
  plan_id: z.string().uuid().optional(),
  dias_acesso: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    const validated = cadastroSchema.parse(body);

    // Se não tem plan_id, usar dias_acesso padrão de 30 dias
    const diasAcesso = validated.dias_acesso || 30;

    // Criar membro diretamente (com link de convite se tiver telegram_id)
    const result = await createMember({
      nome: validated.nome,
      email: validated.email || undefined,
      telefone: validated.telefone || undefined,
      cidade: validated.cidade || undefined,
      uf: validated.uf || undefined,
      data_nascimento: validated.data_nascimento || undefined,
      nicho: validated.nicho || undefined,
      interesse: validated.interesse || undefined,
      grupo_favorito: validated.grupo_favorito || undefined,
      telegram_user_id: validated.telegram_user_id,
      telegram_username: validated.telegram_username,
      plan_id: validated.plan_id,
      dias_acesso: diasAcesso,
    });

    const supabase = createClient();

    // Registrar log
    await supabase.from('logs').insert([
      {
        member_id: result.member.id,
        acao: 'cadastro_publico',
        detalhes: {
          nome: validated.nome,
          email: validated.email,
          telegram_user_id: validated.telegram_user_id,
          tem_link_convite: !!result.inviteLink,
        },
        telegram_user_id: validated.telegram_user_id || null,
        telegram_username: validated.telegram_username || null,
        executado_por: 'sistema',
      },
    ]);

    console.log('[Cadastro] Membro criado:', {
      id: result.member.id,
      nome: result.member.nome,
      tem_invite_link: !!result.inviteLink,
      invite_link: result.inviteLink,
    });

    return NextResponse.json({
      success: true,
      message: result.inviteLink
        ? 'Cadastro realizado com sucesso! Link de convite gerado.'
        : 'Cadastro realizado com sucesso!',
      data: {
        id: result.member.id,
        nome: result.member.nome,
        email: result.member.email,
        inviteLink: result.inviteLink,
        dataVencimento: result.member.data_vencimento,
      },
    });
  } catch (error: any) {
    console.error('Erro ao processar cadastro:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao processar cadastro',
      },
      { status: 500 }
    );
  }
}
