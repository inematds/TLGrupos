import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PIX_KEY = 'inemapix@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, telefone, telegram_username, plano_dias, valor } = body;

    if (!nome || !email || !plano_dias || !valor) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Criar cadastro pendente
    const { data: cadastro, error: cadastroError } = await supabase
      .from('cadastros_pendentes')
      .insert({
        nome,
        email,
        telefone,
        telegram_username,
        plano_dias,
        valor_pago: valor,
        metodo_pagamento: 'pix',
        status: 'aguardando_pagamento',
      })
      .select()
      .single();

    if (cadastroError) {
      console.error('Erro ao criar cadastro:', cadastroError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar cadastro' },
        { status: 500 }
      );
    }

    // Gerar PIX payload (formato PIX Copia e Cola)
    const valorFormatado = valor.toFixed(2);
    const pixPayload = `00020126580014br.gov.bcb.pix0136${PIX_KEY}52040000530398654${valorFormatado}5802BR5925Inema Vip6009SAO PAULO62070503***6304`;

    // Gerar QR Code em base64
    const qrCodeBase64 = await QRCode.toDataURL(pixPayload);

    // Remover o prefixo "data:image/png;base64," para armazenar apenas o base64
    const base64Data = qrCodeBase64.split(',')[1];

    // Atualizar cadastro com QR Code
    await supabase
      .from('cadastros_pendentes')
      .update({
        qr_code_pix: qrCodeBase64,
      })
      .eq('id', cadastro.id);

    return NextResponse.json({
      success: true,
      data: {
        cadastro_id: cadastro.id,
        pix: {
          chave: PIX_KEY,
          valor: valor,
          payload: pixPayload,
          qr_code_base64: base64Data,
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar PIX:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
