import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * GET /api/generate-payment-pix-html
 * Gera um arquivo payment-pix.html standalone que pode ser hospedado em qualquer lugar
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Buscar URL base da API (onde está hospedado o sistema)
    const apiUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://157.180.72.42';

    // Buscar textos configuráveis do banco
    const { data: configData } = await supabase
      .from('system_config')
      .select('chave, valor')
      .like('chave', 'payment_pix_%');

    const texts: Record<string, string> = {};
    configData?.forEach((config: any) => {
      texts[config.chave] = config.valor || '';
    });

    // Textos padrão caso não existam no banco
    const titulo = texts.payment_pix_titulo || '💰 Pagamento via PIX';
    const subtitulo = texts.payment_pix_subtitulo || 'Faça o pagamento e envie o comprovante';
    const instrucoes = texts.payment_pix_instrucoes || `1️⃣ Copie a chave PIX abaixo
2️⃣ Faça o pagamento no seu banco
3️⃣ Envie o comprovante (foto ou PDF)
4️⃣ Aguarde a confirmação`;

    // Gerar HTML standalone
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pagamento PIX - TLGrupos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }

        h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
            text-align: center;
        }

        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
        }

        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }

        .info-box h3 {
            color: #1565c0;
            font-size: 16px;
            margin-bottom: 10px;
        }

        .info-box p {
            color: #0d47a1;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .plan-info {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }

        .plan-info h3 {
            color: #333;
            font-size: 18px;
            margin-bottom: 15px;
        }

        .plan-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 14px;
        }

        .plan-detail-label {
            color: #666;
            font-weight: 500;
        }

        .plan-detail-value {
            color: #333;
            font-weight: 600;
        }

        .pix-key-box {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            text-align: center;
        }

        .pix-key-box h3 {
            color: #856404;
            font-size: 16px;
            margin-bottom: 10px;
        }

        .pix-key {
            background: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            color: #1976d2;
            word-break: break-all;
            margin-bottom: 10px;
        }

        .copy-button {
            background: #ffc107;
            color: #333;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }

        .copy-button:hover {
            background: #ffb300;
        }

        .upload-section {
            margin-top: 25px;
        }

        .upload-section h3 {
            color: #333;
            font-size: 18px;
            margin-bottom: 15px;
        }

        .file-input-wrapper {
            position: relative;
            margin-bottom: 15px;
        }

        .file-input-wrapper input[type="file"] {
            display: none;
        }

        .file-input-label {
            display: block;
            padding: 15px;
            background: #f5f5f5;
            border: 2px dashed #ccc;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }

        .file-input-label:hover {
            background: #e0e0e0;
            border-color: #999;
        }

        .file-preview {
            margin-top: 15px;
            padding: 15px;
            background: #e8f5e9;
            border-radius: 8px;
            display: none;
        }

        .file-preview.show {
            display: block;
        }

        .file-preview p {
            color: #2e7d32;
            font-size: 14px;
        }

        button[type="submit"] {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        button[type="submit"]:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(76, 175, 80, 0.4);
        }

        button[type="submit"]:disabled {
            background: #9e9e9e;
            cursor: not-allowed;
            transform: none;
        }

        .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 500;
        }

        .success {
            background: #e8f5e9;
            color: #2e7d32;
            border: 2px solid #4caf50;
        }

        .error {
            background: #ffebee;
            color: #c62828;
            border: 2px solid #f44336;
        }

        .hidden {
            display: none;
        }

        .loading {
            text-align: center;
            padding: 40px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="loadingState" class="loading">
            <div class="spinner"></div>
            <p style="margin-top: 20px; color: #666;">Carregando informações...</p>
        </div>

        <div id="mainContent" class="hidden">
            <h1>${titulo}</h1>
            <p class="subtitle">${subtitulo}</p>

            <div class="info-box">
                <h3>📋 Instruções</h3>
                <p>${instrucoes}</p>
            </div>

            <div id="messageBox" class="hidden"></div>

            <div class="plan-info">
                <h3>📦 Detalhes do Plano</h3>
                <div class="plan-details">
                    <div class="plan-detail-label">Plano:</div>
                    <div class="plan-detail-value" id="planName">-</div>
                    <div class="plan-detail-label">Valor:</div>
                    <div class="plan-detail-value" id="planValue">-</div>
                </div>
            </div>

            <div class="pix-key-box">
                <h3>🔑 Chave PIX</h3>
                <div class="pix-key" id="pixKey">-</div>
                <button type="button" class="copy-button" onclick="copyPixKey()">
                    📋 Copiar Chave PIX
                </button>
            </div>

            <form id="uploadForm" class="upload-section">
                <h3>📤 Enviar Comprovante</h3>
                <div class="file-input-wrapper">
                    <input type="file" id="fileInput" accept="image/*,application/pdf" required>
                    <label for="fileInput" class="file-input-label">
                        📁 Clique para selecionar o arquivo<br>
                        <small style="color: #999;">PNG, JPG, GIF, WEBP ou PDF</small>
                    </label>
                </div>

                <div id="filePreview" class="file-preview">
                    <p>✅ Arquivo selecionado: <span id="fileName"></span></p>
                </div>

                <button type="submit" id="submitBtn">Enviar Comprovante</button>
            </form>
        </div>
    </div>

    <script>
        const API_URL = '${apiUrl}';
        const urlParams = new URLSearchParams(window.location.search);
        const cadastroId = urlParams.get('cadastro_id');

        // Inicializar página
        window.addEventListener('DOMContentLoaded', async () => {
            if (!cadastroId) {
                showMessage('❌ Link inválido. Falta o ID do cadastro.', 'error');
                document.getElementById('loadingState').style.display = 'none';
                return;
            }

            try {
                // Buscar informações do cadastro
                const response = await fetch(API_URL + '/api/cadastro/' + cadastroId);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erro ao carregar informações');
                }

                const cadastro = data.data;

                // Preencher informações do plano
                document.getElementById('planName').textContent = cadastro.plano_nome || '-';
                document.getElementById('planValue').textContent = cadastro.plano_valor
                    ? 'R$ ' + parseFloat(cadastro.plano_valor).toFixed(2)
                    : '-';

                // Preencher chave PIX (buscar da configuração ou do plano)
                const pixKey = cadastro.chave_pix || 'Configure a chave PIX no sistema';
                document.getElementById('pixKey').textContent = pixKey;

                // Mostrar conteúdo
                document.getElementById('loadingState').style.display = 'none';
                document.getElementById('mainContent').classList.remove('hidden');

            } catch (error) {
                console.error('Erro ao carregar:', error);
                showMessage('❌ ' + error.message, 'error');
                document.getElementById('loadingState').style.display = 'none';
            }
        });

        // Preview do arquivo
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('fileName').textContent = file.name;
                document.getElementById('filePreview').classList.add('show');
            } else {
                document.getElementById('filePreview').classList.remove('show');
            }
        });

        // Copiar chave PIX
        function copyPixKey() {
            const pixKey = document.getElementById('pixKey').textContent;
            navigator.clipboard.writeText(pixKey).then(() => {
                showMessage('✅ Chave PIX copiada!', 'success');
            }).catch(() => {
                showMessage('⚠️ Não foi possível copiar. Copie manualmente.', 'error');
            });
        }

        // Enviar comprovante
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];

            if (!file) {
                showMessage('❌ Selecione um arquivo primeiro', 'error');
                return;
            }

            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            try {
                // Converter arquivo para base64
                const base64 = await fileToBase64(file);

                // Enviar para API
                const response = await fetch(API_URL + '/api/enviar-comprovante', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cadastro_id: cadastroId,
                        comprovante_base64: base64,
                        filename: file.name,
                    }),
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erro ao enviar comprovante');
                }

                showMessage('✅ Comprovante enviado com sucesso! Aguarde a confirmação.', 'success');
                document.getElementById('uploadForm').reset();
                document.getElementById('filePreview').classList.remove('show');

            } catch (error) {
                console.error('Erro ao enviar:', error);
                showMessage('❌ ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Comprovante';
            }
        });

        // Converter arquivo para base64
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        // Mostrar mensagem
        function showMessage(text, type) {
            const messageBox = document.getElementById('messageBox');
            messageBox.textContent = text;
            messageBox.className = 'message ' + type;
            messageBox.classList.remove('hidden');

            setTimeout(() => {
                messageBox.classList.add('hidden');
            }, 5000);
        }
    </script>
</body>
</html>`;

    // Retornar HTML para download
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="payment-pix.html"',
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar HTML:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao gerar HTML',
      },
      { status: 500 }
    );
  }
}
