import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { bot } from '@/lib/telegram';
import { createMember } from '@/services/member-service';
import { sendInviteLink } from '@/services/email-service';

const supabase = getServiceSupabase();

// POST /api/processar-pagamentos - Processa pagamentos pendentes e envia emails
export async function POST(request: NextRequest) {
  try {
    // Verificar secret para proteger a rota
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Permitir chamada sem auth apenas em desenvolvimento
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Não autorizado' },
          { status: 401 }
        );
      }
    }

    const results = {
      processados: 0,
      erros: 0,
      detalhes: [] as any[],
    };

    // Buscar cadastros pendentes aguardando pagamento
    const { data: cadastrosPendentes, error: cadastrosError } = await supabase
      .from('cadastros_pendentes')
      .select('*')
      .eq('status', 'aguardando_pagamento')
      .gt('expira_em', new Date().toISOString());

    if (cadastrosError) {
      throw new Error(`Erro ao buscar cadastros: ${cadastrosError.message}`);
    }

    if (!cadastrosPendentes || cadastrosPendentes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum cadastro pendente para processar',
        results,
      });
    }

    // Para cada cadastro pendente, buscar pagamentos compatíveis
    for (const cadastro of cadastrosPendentes) {
      try {
        // Buscar pagamentos no banco com valor igual e não processados
        const { data: pagamentosCompativeis, error: pagamentosError } = await supabase
          .from('pagamentos_banco')
          .select('*')
          .eq('valor', cadastro.valor_pago)
          .eq('processado', false)
          .gte('data_pagamento', cadastro.created_at)
          .lte('data_pagamento', cadastro.expira_em)
          .order('data_pagamento', { ascending: false })
          .limit(1);

        if (pagamentosError) {
          console.error('Erro ao buscar pagamentos:', pagamentosError);
          continue;
        }

        if (!pagamentosCompativeis || pagamentosCompativeis.length === 0) {
          // Nenhum pagamento encontrado ainda
          continue;
        }

        const pagamento = pagamentosCompativeis[0];

        // Pagamento encontrado! Processar...
        console.log(`💰 Pagamento encontrado para ${cadastro.nome} - R$ ${cadastro.valor_pago}`);

        // 1. Criar membro no sistema
        const dataVencimento = new Date();
        dataVencimento.setDate(dataVencimento.getDate() + cadastro.plano_dias);

        const { data: member, error: memberError } = await supabase
          .from('members')
          .insert({
            nome: cadastro.nome,
            email: cadastro.email,
            telefone: cadastro.telefone,
            telegram_username: cadastro.telegram_username,
            data_vencimento: dataVencimento.toISOString(),
            status: 'ativo',
            observacoes: `Cadastrado via PIX. Ref: ${cadastro.id}`,
          })
          .select()
          .single();

        if (memberError) {
          throw new Error(`Erro ao criar membro: ${memberError.message}`);
        }

        // 2. Gerar link de convite do Telegram
        const groupId = process.env.TELEGRAM_GROUP_ID;
        if (!groupId) {
          throw new Error('TELEGRAM_GROUP_ID não configurado');
        }

        const inviteLink = await bot.telegram.createChatInviteLink(groupId, {
          expire_date: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 dias
          member_limit: 1,
        });

        // 3. Atualizar membro com link
        await supabase
          .from('members')
          .update({ invite_link: inviteLink.invite_link })
          .eq('id', member.id);

        // 4. Atualizar cadastro pendente
        await supabase
          .from('cadastros_pendentes')
          .update({
            status: 'processado',
            membro_id: member.id,
            processado_em: new Date().toISOString(),
            invite_link: inviteLink.invite_link,
          })
          .eq('id', cadastro.id);

        // 5. Marcar pagamento como processado
        await supabase
          .from('pagamentos_banco')
          .update({
            processado: true,
            cadastro_pendente_id: cadastro.id,
            processed_at: new Date().toISOString(),
          })
          .eq('id', pagamento.id);

        // 6. Enviar email com link de acesso
        const emailSent = await sendInviteLink({
          to: cadastro.email,
          nome: cadastro.nome,
          inviteLink: inviteLink.invite_link,
          planoDias: cadastro.plano_dias,
          dataExpiracao: dataVencimento.toISOString(),
        });

        console.log(`📧 Email ${emailSent ? 'enviado' : 'falhou'} para ${cadastro.email}`);

        // Registrar log
        await supabase.from('logs').insert({
          acao: 'pagamento_confirmado',
          detalhes: {
            cadastro_id: cadastro.id,
            pagamento_id: pagamento.id,
            member_id: member.id,
            valor: cadastro.valor_pago,
          },
          executado_por: 'sistema',
        });

        results.processados++;
        results.detalhes.push({
          cadastro_id: cadastro.id,
          nome: cadastro.nome,
          email: cadastro.email,
          valor: cadastro.valor_pago,
          status: 'processado',
        });

      } catch (error: any) {
        console.error(`Erro ao processar cadastro ${cadastro.id}:`, error);
        results.erros++;
        results.detalhes.push({
          cadastro_id: cadastro.id,
          nome: cadastro.nome,
          status: 'erro',
          erro: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processados: ${results.processados}, Erros: ${results.erros}`,
      results,
    });

  } catch (error: any) {
    console.error('Erro ao processar pagamentos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao processar pagamentos',
      },
      { status: 500 }
    );
  }
}
