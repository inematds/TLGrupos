import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createInviteLink, sendPrivateMessage } from '@/lib/telegram';
import { sendInviteEmail } from '@/lib/email';

// POST /api/inclusao/executar - Executa inclusão de membros elegíveis com fluxo híbrido
export async function POST() {
  try {
    const supabase = getServiceSupabase();

    // Buscar membros elegíveis (mesmos critérios do endpoint /elegiveis)
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'ativo')
      .not('telegram_user_id', 'is', null)
      .gte('data_vencimento', new Date().toISOString())
      .or('no_grupo.is.null,no_grupo.eq.false')
      .order('data_entrada', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar membros: ${error.message}`);
    }

    if (!members || members.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum membro elegível para inclusão',
        results: {
          success: 0,
          failed: 0,
          errors: [],
        },
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ nome: string; error: string; method: string }>,
    };

    // Processar cada membro com fluxo híbrido
    for (const member of members) {
      try {
        // 1. Criar invite link
        const expiresAt = new Date(member.data_vencimento);
        const linkResult = await createInviteLink(
          member.telegram_user_id,
          expiresAt
        );

        if (!linkResult.success) {
          throw new Error(linkResult.error || 'Erro ao criar invite link');
        }

        const inviteLink = linkResult.link!;
        const vencimento = new Date(member.data_vencimento);
        const hoje = new Date();
        const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        // Criar registro de convite no banco
        const { data: invite, error: inviteError } = await supabase
          .from('invites')
          .insert({
            member_id: member.id,
            invite_link: inviteLink,
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        if (inviteError) {
          throw new Error(`Erro ao criar registro de convite: ${inviteError.message}`);
        }

        let telegramSent = false;
        let emailSent = false;
        let lastError = '';

        // 2. Tentar enviar por Telegram
        const mensagemTelegram =
          `🎉 <b>Bem-vindo(a) ${member.nome}!</b>\n\n` +
          `Você foi aprovado para entrar no grupo!\n\n` +
          `📅 <b>Vencimento:</b> ${vencimento.toLocaleDateString('pt-BR')}\n` +
          `⏰ <b>Dias de acesso:</b> ${diasRestantes} dias\n\n` +
          `🔗 <b>Clique no link abaixo para entrar:</b>\n` +
          `${inviteLink}\n\n` +
          `⚠️ <b>Importante:</b>\n` +
          `• O link é único e exclusivo para você\n` +
          `• Use o link o quanto antes\n` +
          `• Após entrar, você terá acesso até ${vencimento.toLocaleDateString('pt-BR')}\n\n` +
          `Use o comando /status no grupo para verificar seu cadastro a qualquer momento.`;

        const telegramResult = await sendPrivateMessage(member.telegram_user_id, mensagemTelegram);

        if (telegramResult.success) {
          telegramSent = true;

          // Atualizar convite com sucesso do Telegram
          await supabase
            .from('invites')
            .update({
              telegram_sent: true,
              telegram_sent_at: new Date().toISOString(),
            })
            .eq('id', invite.id);
        } else {
          lastError = telegramResult.error || 'Erro desconhecido';

          // Atualizar convite com erro do Telegram
          await supabase
            .from('invites')
            .update({
              telegram_sent: false,
              telegram_error: lastError,
            })
            .eq('id', invite.id);

          // 3. Se Telegram falhou, tentar enviar por Email (fallback)
          if (member.email) {
            const emailResult = await sendInviteEmail({
              to: member.email,
              nome: member.nome,
              inviteLink,
              vencimento,
              diasRestantes,
            });

            if (emailResult.success) {
              emailSent = true;

              // Atualizar convite com sucesso do Email
              await supabase
                .from('invites')
                .update({
                  email_sent: true,
                  email_sent_at: new Date().toISOString(),
                })
                .eq('id', invite.id);
            } else {
              lastError = emailResult.error || 'Erro ao enviar email';

              // Atualizar convite com erro do Email
              await supabase
                .from('invites')
                .update({
                  email_sent: false,
                  email_error: lastError,
                })
                .eq('id', invite.id);
            }
          }
        }

        // Se pelo menos um método funcionou, considerar sucesso
        if (telegramSent || emailSent) {
          // Registrar log de inclusão
          await supabase.from('logs').insert({
            member_id: member.id,
            acao: 'adicao',
            detalhes: {
              invite_link: inviteLink,
              via: 'inclusao_automatica',
              data_vencimento: member.data_vencimento,
              telegram_sent: telegramSent,
              email_sent: emailSent,
              method: telegramSent ? 'telegram' : 'email',
            },
            telegram_user_id: member.telegram_user_id,
            telegram_username: member.telegram_username,
            executado_por: 'sistema',
          });

          results.success++;
        } else {
          // Ambos falharam
          throw new Error(
            member.email
              ? `Telegram e Email falharam. Último erro: ${lastError}`
              : `Telegram falhou e membro sem email cadastrado. Erro: ${lastError}`
          );
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          nome: member.nome,
          error: error.message,
          method: 'hybrid',
        });
        console.error(`Erro ao incluir membro ${member.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processados ${members.length} membros`,
      results,
    });
  } catch (error: any) {
    console.error('Erro ao executar inclusão:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao executar inclusão',
      },
      { status: 500 }
    );
  }
}
