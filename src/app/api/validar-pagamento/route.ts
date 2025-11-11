import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createMember } from '@/services/member-service';
import { z } from 'zod';

const supabase = getServiceSupabase();

// Schema de validação
const validarPagamentoSchema = z.object({
  cadastro_id: z.string().uuid(),
  aprovado: z.boolean(),
  motivo_reprovacao: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validarPagamentoSchema.parse(body);

    // Buscar cadastro pendente
    const { data: cadastro, error: cadastroError } = await supabase
      .from('cadastros_pendentes')
      .select('*')
      .eq('id', validated.cadastro_id)
      .single();

    if (cadastroError || !cadastro) {
      return NextResponse.json(
        { success: false, error: 'Cadastro não encontrado' },
        { status: 404 }
      );
    }

    if (cadastro.status !== 'comprovante_enviado') {
      return NextResponse.json(
        { success: false, error: 'Cadastro não está aguardando validação' },
        { status: 400 }
      );
    }

    if (validated.aprovado) {
      // APROVADO - Criar membro e enviar link

      // Calcular data de vencimento
      const hoje = new Date();
      const dataVencimento = new Date(hoje);
      dataVencimento.setDate(dataVencimento.getDate() + cadastro.plano_dias);

      // Criar membro
      const memberResult = await createMember({
        nome: cadastro.nome,
        email: cadastro.email,
        telefone: cadastro.telefone,
        telegram_username: cadastro.telegram_username,
        plan_id: cadastro.plan_id,
        data_vencimento: dataVencimento.toISOString(),
        observacoes: `Cadastro via PIX Upload - Cadastro ID: ${cadastro.id}`,
      });

      const member = memberResult.member;
      let inviteLink = memberResult.inviteLink;

      // Se não gerou link (sem telegram_user_id), gerar link genérico
      if (!inviteLink) {
        try {
          const linkRes = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3020'}/api/telegram/invite-link`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                member_id: member.id,
              }),
            }
          );

          const linkData = await linkRes.json();
          if (linkData.success) {
            inviteLink = linkData.link;
          }
        } catch (error) {
          console.error('Erro ao gerar link:', error);
        }
      }

      // Atualizar cadastro pendente
      await supabase
        .from('cadastros_pendentes')
        .update({
          status: 'pago',
          validado_por: 'admin',
          validado_em: new Date().toISOString(),
          link_enviado: true,
          invite_link: inviteLink,
        })
        .eq('id', cadastro.id);

      // Enviar email com link (simplificado - idealmente usar serviço de email)
      let emailEnviado = false;
      try {
        const emailRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3020'}/api/enviar-email-acesso`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cadastro.email,
              nome: cadastro.nome,
              invite_link: inviteLink,
              plano_dias: cadastro.plano_dias,
            }),
          }
        );
        const emailData = await emailRes.json();
        emailEnviado = emailData.success;
      } catch (error) {
        console.error('Erro ao enviar email:', error);
      }

      // Registrar log
      await supabase.from('logs').insert({
        member_id: member.id,
        acao: 'pagamento_aprovado',
        detalhes: {
          cadastro_id: cadastro.id,
          valor_pago: cadastro.valor_pago,
          metodo: 'pix_upload',
        },
        executado_por: 'admin',
      });

      return NextResponse.json({
        success: true,
        message: emailEnviado
          ? 'Pagamento aprovado e email enviado com sucesso!'
          : 'Pagamento aprovado mas houve erro ao enviar email. Link salvo no sistema.',
        data: {
          member_id: member.id,
          invite_link: inviteLink,
          email_enviado: emailEnviado,
        },
      });
    } else {
      // REPROVADO

      // Atualizar cadastro pendente
      await supabase
        .from('cadastros_pendentes')
        .update({
          status: 'cancelado',
          validado_por: 'admin',
          validado_em: new Date().toISOString(),
        })
        .eq('id', cadastro.id);

      // Enviar email de reprovação
      let emailEnviado = false;
      try {
        const emailRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3020'}/api/enviar-email-reprovacao`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cadastro.email,
              nome: cadastro.nome,
              motivo: validated.motivo_reprovacao || 'Comprovante inválido',
            }),
          }
        );
        const emailData = await emailRes.json();
        emailEnviado = emailData.success;
      } catch (error) {
        console.error('Erro ao enviar email:', error);
      }

      // Registrar log
      await supabase.from('logs').insert({
        acao: 'pagamento_reprovado',
        detalhes: {
          cadastro_id: cadastro.id,
          motivo: validated.motivo_reprovacao,
        },
        executado_por: 'admin',
      });

      return NextResponse.json({
        success: true,
        message: emailEnviado
          ? 'Pagamento reprovado e cliente notificado por email'
          : 'Pagamento reprovado mas houve erro ao enviar email de notificação',
        data: {
          email_enviado: emailEnviado,
        },
      });
    }
  } catch (error: any) {
    console.error('Erro ao validar pagamento:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao validar pagamento' },
      { status: 500 }
    );
  }
}
