import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * GET /api/generate-cadastro-html
 * Gera um arquivo cadastro.html standalone que pode ser hospedado em qualquer lugar
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
      .like('chave', 'cadastro_%');

    const texts: Record<string, string> = {};
    configData?.forEach((config: any) => {
      texts[config.chave] = config.valor || '';
    });

    // Textos padrão caso não existam no banco
    const titulo = texts.cadastro_titulo || '📝 Cadastro de Membro';
    const subtitulo = texts.cadastro_subtitulo || 'Preencha seus dados para se cadastrar';
    const infoTitulo = texts.cadastro_info_titulo || 'ℹ️ Como Funciona o Sistema';
    const infoTexto = texts.cadastro_info_texto || `Acesso Multi-Grupo: Ao se cadastrar, você terá acesso a TODOS os grupos do Telegram onde nosso bot está ativo.

📋 O mesmo cadastro funciona em todos os grupos
💡 Após o cadastro, você receberá um link para entrar nos grupos. Guarde esse link!
⏰ Use o comando /status no Telegram para verificar seu tempo restante`;

    const avisoTitulo = texts.cadastro_aviso_titulo || '⚠️ Importante - Gerenciamento de Acesso';
    const avisoTexto = texts.cadastro_aviso_texto || `• Seu acesso possui uma data de vencimento
• Quando vencer, você será removido de TODOS os grupos simultaneamente
• Para renovar, entre em contato com os administradores antes do vencimento

💡 Use /status no Telegram para verificar sua data de vencimento!`;

    // Gerar HTML standalone
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastro de Membro - TLGrupos</title>
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

        .telegram-badge {
            background: #e8f5e9;
            border: 2px solid #4caf50;
            border-radius: 25px;
            padding: 10px 20px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #2e7d32;
            font-weight: 500;
        }

        .pulse {
            width: 8px;
            height: 8px;
            background: #4caf50;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
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
            margin-bottom: 8px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            color: #333;
            font-weight: 500;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .required {
            color: #f44336;
        }

        input, select, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }

        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        textarea {
            resize: vertical;
            min-height: 80px;
        }

        .row {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 15px;
        }

        @media (max-width: 600px) {
            .row {
                grid-template-columns: 1fr;
            }
        }

        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        button:disabled {
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

        .invite-link-box {
            background: white;
            border: 4px solid #4caf50;
            border-radius: 12px;
            padding: 30px;
            margin-top: 20px;
            box-shadow: 0 8px 16px rgba(76, 175, 80, 0.3);
        }

        .invite-link-box h2 {
            color: #2e7d32;
            text-align: center;
            margin-bottom: 15px;
        }

        .invite-button {
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            padding: 20px;
            font-size: 18px;
            margin-bottom: 15px;
        }

        .invite-button:hover {
            background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
        }

        .link-text {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
            color: #1976d2;
            text-align: center;
            border: 1px solid #e0e0e0;
        }

        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${titulo}</h1>
        <p class="subtitle">${subtitulo}</p>

        <!-- Badge Telegram (se conectado) -->
        <div id="telegramBadge" class="hidden">
            <center>
                <div class="telegram-badge">
                    <span class="pulse"></span>
                    <span>Telegram Conectado <span id="telegramUsername"></span></span>
                </div>
            </center>
        </div>

        <!-- Informações -->
        <div class="info-box">
            <h3>${infoTitulo}</h3>
            <p style="white-space: pre-wrap;">${infoTexto}</p>
        </div>

        <!-- Mensagens -->
        <div id="messageBox" class="hidden"></div>

        <!-- Formulário -->
        <form id="cadastroForm">
            <div class="form-group">
                <label>Nome Completo <span class="required">*</span></label>
                <input type="text" id="nome" name="nome" required placeholder="João da Silva">
            </div>

            <div class="row">
                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input type="email" id="email" name="email" required placeholder="seu@email.com">
                </div>
                <div class="form-group">
                    <label>Telefone <span class="required">*</span></label>
                    <input type="tel" id="telefone" name="telefone" required placeholder="(11) 99999-9999">
                </div>
            </div>

            <div class="row">
                <div class="form-group">
                    <label>Cidade</label>
                    <input type="text" id="cidade" name="cidade" placeholder="São Paulo">
                </div>
                <div class="form-group">
                    <label>UF</label>
                    <select id="uf" name="uf">
                        <option value="">Selecione</option>
                        <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option>
                        <option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option>
                        <option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option>
                        <option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option>
                        <option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option>
                        <option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option>
                        <option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option>
                        <option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option>
                        <option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label>Data de Nascimento</label>
                <input type="date" id="data_nascimento" name="data_nascimento">
            </div>

            <div class="form-group">
                <label>Nicho / Área de Atuação</label>
                <input type="text" id="nicho" name="nicho" placeholder="Ex: Marketing Digital, E-commerce...">
            </div>

            <div class="form-group">
                <label>Principais Interesses</label>
                <textarea id="interesse" name="interesse" placeholder="Conte-nos sobre seus principais interesses..."></textarea>
            </div>

            <div class="form-group">
                <label>Qual grupo você mais gosta?</label>
                <input type="text" id="grupo_favorito" name="grupo_favorito" placeholder="Nome do grupo do Telegram">
            </div>

            <button type="submit" id="submitBtn">Cadastrar</button>
        </form>

        <!-- Aviso de Renovação -->
        <div style="margin-top: 20px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">${avisoTitulo}</h4>
            <div style="font-size: 12px; color: #78350f; white-space: pre-wrap; line-height: 1.6;">${avisoTexto}</div>
        </div>

        <!-- Box do Link de Convite (aparece após sucesso) -->
        <div id="inviteLinkBox" class="hidden invite-link-box">
            <h2>🎉 Cadastro Realizado!</h2>
            <p style="text-align: center; margin-bottom: 20px; color: #666;">Clique no botão abaixo para entrar no grupo</p>
            <a id="inviteButton" href="#" target="_blank" style="text-decoration: none;">
                <button type="button" class="invite-button">
                    👉 ENTRAR NO GRUPO AGORA 👈
                </button>
            </a>
            <p style="text-align: center; font-size: 12px; color: #666; margin-bottom: 10px;">Ou copie o link abaixo:</p>
            <div class="link-text" id="inviteLinkText"></div>
        </div>
    </div>

    <script>
        // Capturar parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const telegramId = urlParams.get('telegram_id');
        const telegramUsername = urlParams.get('username');
        const telegramNome = urlParams.get('nome');

        // Mostrar badge se tiver telegram_id
        if (telegramId) {
            document.getElementById('telegramBadge').classList.remove('hidden');
            if (telegramUsername) {
                document.getElementById('telegramUsername').textContent = '(@' + telegramUsername + ')';
            }
        }

        // Preencher nome se veio da URL
        if (telegramNome) {
            document.getElementById('nome').value = decodeURIComponent(telegramNome);
        }

        // URL da API (altere conforme necessário)
        const API_URL = '${apiUrl}';

        // Handler do formulário
        document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Cadastrando...';

            const formData = {
                nome: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                telefone: document.getElementById('telefone').value,
                cidade: document.getElementById('cidade').value || undefined,
                uf: document.getElementById('uf').value || undefined,
                data_nascimento: document.getElementById('data_nascimento').value || undefined,
                nicho: document.getElementById('nicho').value || undefined,
                interesse: document.getElementById('interesse').value || undefined,
                grupo_favorito: document.getElementById('grupo_favorito').value || undefined,
                telegram_user_id: telegramId ? parseInt(telegramId) : undefined,
                telegram_username: telegramUsername || undefined,
            };

            try {
                const response = await fetch(API_URL + '/api/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao cadastrar');
                }

                // Mostrar mensagem de sucesso
                showMessage('✅ Cadastro realizado com sucesso!', 'success');

                // Se tiver invite link, mostrar
                if (data.data?.inviteLink) {
                    const inviteBox = document.getElementById('inviteLinkBox');
                    const inviteButton = document.getElementById('inviteButton');
                    const inviteLinkText = document.getElementById('inviteLinkText');

                    inviteBox.classList.remove('hidden');
                    inviteButton.href = data.data.inviteLink;
                    inviteLinkText.textContent = data.data.inviteLink;

                    // Scroll para o link
                    inviteBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                // Limpar formulário
                document.getElementById('cadastroForm').reset();

            } catch (error) {
                showMessage('❌ ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Cadastrar';
            }
        });

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
        'Content-Disposition': 'attachment; filename="cadastro.html"',
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
