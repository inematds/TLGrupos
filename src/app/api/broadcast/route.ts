import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

const supabase = getServiceSupabase();

/**
 * POST /api/broadcast - Envia mensagens para todos os membros via Telegram e/ou Email
 * Body: { titulo: string, mensagem: string, enviarTelegram: boolean, enviarEmail: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, mensagem, enviarTelegram, enviarEmail } = body;

    if (!titulo || !mensagem) {
      return NextResponse.json(
        { error: 'Título e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    if (!enviarTelegram && !enviarEmail) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um canal de envio' },
        { status: 400 }
      );
    }

    // Buscar todos os membros ativos
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, nome, email, telegram_user_id, telegram_username')
      .eq('status', 'ativo');

    if (membersError) {
      console.error('Erro ao buscar membros:', membersError);
      return NextResponse.json(
        { error: 'Erro ao buscar membros: ' + membersError.message },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum membro ativo encontrado', enviados: 0, falhas: 0 },
        { status: 200 }
      );
    }

    let enviadosCount = 0;
    let falhasCount = 0;

    // Processar envios
    for (const member of members) {
      let enviadoTelegram = false;
      let enviadoEmail = false;

      // Enviar via Telegram se solicitado
      if (enviarTelegram && member.telegram_user_id) {
        try {
          const telegramResponse = await fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: member.telegram_user_id,
                text: `📢 *${titulo}*\n\n${mensagem}`,
                parse_mode: 'Markdown',
              }),
            }
          );

          if (telegramResponse.ok) {
            enviadoTelegram = true;
          } else {
            console.error(`Erro ao enviar Telegram para ${member.nome}:`, await telegramResponse.text());
          }
        } catch (error) {
          console.error(`Erro ao enviar Telegram para ${member.nome}:`, error);
        }
      }

      // Enviar via Email se solicitado
      if (enviarEmail && member.email) {
        try {
          const emailResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: member.email,
              subject: titulo,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">📢 ${titulo}</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                    ${mensagem.replace(/\n/g, '<br>')}
                  </p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                  <p style="font-size: 12px; color: #9ca3af;">
                    Esta é uma mensagem automática do sistema TLGrupos.
                  </p>
                </div>
              `,
            }),
          });

          if (emailResponse.ok) {
            enviadoEmail = true;
          } else {
            console.error(`Erro ao enviar Email para ${member.nome}:`, await emailResponse.text());
          }
        } catch (error) {
          console.error(`Erro ao enviar Email para ${member.nome}:`, error);
        }
      }

      // Contabilizar resultado
      if (
        (enviarTelegram && enviadoTelegram) ||
        (enviarEmail && enviadoEmail) ||
        (enviarTelegram && enviarEmail && (enviadoTelegram || enviadoEmail))
      ) {
        enviadosCount++;
      } else {
        falhasCount++;
      }
    }

    // Registrar log da ação
    await supabase.from('logs').insert({
      acao: 'broadcast',
      detalhes: {
        tipo: 'envio_massa',
        titulo,
        canais: {
          telegram: enviarTelegram,
          email: enviarEmail,
        },
        enviados: enviadosCount,
        falhas: falhasCount,
        total_membros: members.length,
      },
      executado_por: 'Admin',
    });

    return NextResponse.json({
      success: true,
      message: 'Broadcast concluído com sucesso!',
      enviados: enviadosCount,
      falhas: falhasCount,
      total: members.length,
    });
  } catch (error: any) {
    console.error('[API Broadcast] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar broadcast' },
      { status: 500 }
    );
  }
}
