import { NextRequest, NextResponse } from 'next/server';
import { getGroupAdministrators, getGroupMembersByIds, getGroupMemberCount } from '@/lib/telegram';
import { getServiceSupabase } from '@/lib/supabase';
import { getMemberByTelegramId } from '@/services/member-service';

const supabase = getServiceSupabase();

interface SyncMemberResult {
  telegramId: number;
  name: string;
  status: 'created' | 'skipped' | 'error';
  error?: string;
}

/**
 * POST /api/sync - Sincroniza membros do Telegram com o banco de dados
 *
 * Body:
 * {
 *   "mode": "admins" | "ids",
 *   "ids": [123456789, 987654321],  // apenas se mode === "ids"
 *   "defaultExpiryDays": 30
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, ids, defaultExpiryDays = 30 } = body;

    if (!mode || (mode !== 'admins' && mode !== 'ids')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mode inválido. Use "admins" ou "ids"',
        },
        { status: 400 }
      );
    }

    if (mode === 'ids' && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Para mode "ids", forneça um array de IDs',
        },
        { status: 400 }
      );
    }

    let members: any[] = [];

    // Buscar membros baseado no modo
    if (mode === 'admins') {
      const result = await getGroupAdministrators();
      if (!result.success || !result.data) {
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao buscar administradores: ${result.error}`,
          },
          { status: 500 }
        );
      }
      members = result.data.filter(admin => !admin.is_bot);
    } else if (mode === 'ids') {
      const result = await getGroupMembersByIds(ids);
      if (!result.success || !result.data) {
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao buscar membros: ${result.error}`,
          },
          { status: 500 }
        );
      }
      members = result.data.filter(member => !member.is_bot);
    }

    // Sincronizar cada membro
    const results: SyncMemberResult[] = [];
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const member of members) {
      try {
        // Verificar se já existe
        const existing = await getMemberByTelegramId(member.id);

        if (existing) {
          results.push({
            telegramId: member.id,
            name: `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`,
            status: 'skipped',
          });
          skipped++;
          continue;
        }

        // Calcular data de vencimento
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + defaultExpiryDays);

        // Criar membro
        const { error } = await supabase.from('members').insert({
          telegram_user_id: member.id,
          telegram_username: member.username || null,
          telegram_first_name: member.first_name,
          telegram_last_name: member.last_name || null,
          nome: `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`,
          data_vencimento: expiryDate.toISOString(),
          status: 'ativo',
        });

        if (error) {
          results.push({
            telegramId: member.id,
            name: `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`,
            status: 'error',
            error: error.message,
          });
          errors++;
        } else {
          results.push({
            telegramId: member.id,
            name: `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`,
            status: 'created',
          });
          created++;
        }
      } catch (error: any) {
        results.push({
          telegramId: member.id,
          name: `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`,
          status: 'error',
          error: error.message,
        });
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: members.length,
        created,
        skipped,
        errors,
        details: results,
      },
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar membros:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao sincronizar membros',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync - Obter informações do grupo
 */
export async function GET() {
  try {
    const countResult = await getGroupMemberCount();

    if (!countResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao obter contagem: ${countResult.error}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        totalMembersInGroup: countResult.count,
      },
    });
  } catch (error: any) {
    console.error('Erro ao obter info do grupo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao obter info do grupo',
      },
      { status: 500 }
    );
  }
}
