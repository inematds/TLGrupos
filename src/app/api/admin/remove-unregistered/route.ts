import { NextResponse } from 'next/server';

// POST /api/admin/remove-unregistered - Funcionalidade não disponível
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        'A API do Telegram Bot não permite listar todos os membros de um grupo regular por questões de privacidade. ' +
        'Esta funcionalidade só está disponível para grupos onde o bot é administrador com permissões especiais ou usando o Telegram User API (não Bot API). ' +
        'Alternativa: Use a função de remoção automática de membros vencidos ou implemente um bot que monitora novos membros ao entrarem no grupo.',
    },
    { status: 501 }
  );
}

// GET /api/admin/remove-unregistered - Funcionalidade não disponível
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error:
        'A API do Telegram Bot não permite listar todos os membros de um grupo regular. ' +
        'Só é possível listar administradores usando getChatAdministrators.',
      data: [],
      count: 0,
    },
    { status: 501 }
  );
}
