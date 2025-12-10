import { NextRequest, NextResponse } from 'next/server';
import { serviceSupabase as supabase } from '@/lib/supabase';

// Remover membro de um grupo específico
export async function POST(req: NextRequest) {
  try {
    const { member_id, group_id } = await req.json();

    if (!member_id) {
      return NextResponse.json(
        { success: false, error: 'member_id é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar informações do membro
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('telegram_user_id, nome, telegram_username')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    if (!member.telegram_user_id) {
      return NextResponse.json(
        { success: false, error: 'Membro não possui Telegram User ID' },
        { status: 400 }
      );
    }

    // Se group_id foi fornecido, remover de grupo específico
    if (group_id) {
      const { data: group, error: groupError } = await supabase
        .from('telegram_groups')
        .select('group_id, title')
        .eq('id', group_id)
        .single();

      if (groupError || !group) {
        return NextResponse.json(
          { success: false, error: 'Grupo não encontrado' },
          { status: 404 }
        );
      }

      // Tentar remover do grupo via API do Telegram
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/banChatMember`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: group.group_id,
            user_id: member.telegram_user_id,
            revoke_messages: false, // Não apagar mensagens
          }),
        }
      );

      const result = await response.json();

      if (!result.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao remover do Telegram: ${result.description || 'Erro desconhecido'}`,
          },
          { status: 500 }
        );
      }

      // Desbanir imediatamente para permitir reentrada futura
      await fetch(`https://api.telegram.org/bot${botToken}/unbanChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: group.group_id,
          user_id: member.telegram_user_id,
          only_if_banned: true,
        }),
      });

      return NextResponse.json({
        success: true,
        message: `${member.nome} removido do grupo ${group.title}`,
        member: {
          id: member_id,
          nome: member.nome,
          telegram_username: member.telegram_username,
        },
        group: {
          id: group_id,
          title: group.title,
        },
      });
    }

    // Se não foi fornecido group_id, remover de todos os grupos
    const { data: groups, error: groupsError } = await supabase
      .from('telegram_groups')
      .select('id, group_id, title')
      .eq('ativo', true);

    if (groupsError || !groups || groups.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum grupo ativo encontrado' },
        { status: 404 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const results = [];

    for (const group of groups) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${botToken}/banChatMember`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: group.group_id,
              user_id: member.telegram_user_id,
              revoke_messages: false,
            }),
          }
        );

        const result = await response.json();

        if (result.ok) {
          // Desbanir imediatamente
          await fetch(`https://api.telegram.org/bot${botToken}/unbanChatMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: group.group_id,
              user_id: member.telegram_user_id,
              only_if_banned: true,
            }),
          });

          results.push({
            group: group.title,
            success: true,
          });
        } else {
          results.push({
            group: group.title,
            success: false,
            error: result.description,
          });
        }
      } catch (error: any) {
        results.push({
          group: group.title,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Membro removido de ${successCount} grupo(s). ${failCount} falha(s).`,
      results,
      member: {
        id: member_id,
        nome: member.nome,
        telegram_username: member.telegram_username,
      },
    });
  } catch (error: any) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao remover membro' },
      { status: 500 }
    );
  }
}
