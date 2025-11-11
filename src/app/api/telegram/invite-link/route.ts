import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';
import { getServiceSupabase } from '@/lib/supabase';

const supabase = getServiceSupabase();

// POST /api/telegram/invite-link - Gera link de convite (único ou genérico)
export async function POST(request: NextRequest) {
  try {
    const groupId = process.env.TELEGRAM_GROUP_ID;

    if (!groupId) {
      throw new Error('TELEGRAM_GROUP_ID não configurado');
    }

    const body = await request.json();
    const { member_id, generic = false } = body;

    let inviteLink;

    // Sempre gerar link único (member_limit = 1)
    // Não precisa de telegram_user_id para isso!
    inviteLink = await bot.telegram.createChatInviteLink(groupId, {
      expire_date: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 dias
      member_limit: 1, // Apenas 1 pessoa pode usar
    });

    // Salvar link no membro (para vinculação posterior)
    if (member_id) {
      await supabase
        .from('members')
        .update({
          invite_link: inviteLink.invite_link,
          invite_link_type: 'unique', // Sempre único agora
          invite_link_revoked: false,
        })
        .eq('id', member_id);

      // Registrar log
      await supabase.from('logs').insert({
        member_id,
        acao: 'link_gerado',
        detalhes: {
          link: inviteLink.invite_link,
          expires_at: inviteLink.expire_date,
          member_limit: 1,
        },
        executado_por: 'sistema',
      });
    }

    return NextResponse.json({
      success: true,
      link: inviteLink.invite_link,
      expires_at: inviteLink.expire_date,
    });
  } catch (error: any) {
    console.error('Erro ao gerar link de convite:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao gerar link de convite',
      },
      { status: 500 }
    );
  }
}

// GET /api/telegram/invite-link - Gera link de convite genérico (para uso administrativo)
export async function GET(request: NextRequest) {
  try {
    const groupId = process.env.TELEGRAM_GROUP_ID;

    if (!groupId) {
      throw new Error('TELEGRAM_GROUP_ID não configurado');
    }

    // Gerar link de convite
    const inviteLink = await bot.telegram.createChatInviteLink(groupId, {
      expire_date: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
      member_limit: 1,
    });

    return NextResponse.json({
      success: true,
      link: inviteLink.invite_link,
      expires_at: inviteLink.expire_date,
    });
  } catch (error: any) {
    console.error('Erro ao gerar link de convite:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao gerar link de convite',
      },
      { status: 500 }
    );
  }
}
