import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cadastro_id, comprovante_base64, filename } = body;

    if (!cadastro_id || !comprovante_base64) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Verificar se o cadastro existe
    const { data: cadastro, error: cadastroError } = await supabase
      .from('cadastros_pendentes')
      .select('*')
      .eq('id', cadastro_id)
      .single();

    if (cadastroError || !cadastro) {
      return NextResponse.json(
        { success: false, error: 'Cadastro não encontrado' },
        { status: 404 }
      );
    }

    // Fazer upload do comprovante para o Supabase Storage
    const fileExt = filename?.split('.').pop() || 'png';
    const fileName = `comprovante_${cadastro_id}_${Date.now()}.${fileExt}`;

    // Converter base64 para buffer
    const base64Data = comprovante_base64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('comprovantes')
      .upload(fileName, buffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      );
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('comprovantes')
      .getPublicUrl(fileName);

    const comprovanteUrl = urlData.publicUrl;

    // Atualizar cadastro com URL do comprovante
    const { error: updateError } = await supabase
      .from('cadastros_pendentes')
      .update({
        comprovante_url: comprovanteUrl,
        comprovante_enviado_em: new Date().toISOString(),
        status: 'comprovante_enviado',
      })
      .eq('id', cadastro_id);

    if (updateError) {
      console.error('Erro ao atualizar cadastro:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar cadastro' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        cadastro_id,
        comprovante_url: comprovanteUrl,
      },
    });
  } catch (error: any) {
    console.error('Erro ao processar comprovante:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
