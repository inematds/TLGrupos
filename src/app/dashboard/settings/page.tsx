'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Download, ExternalLink, Link as LinkIcon } from 'lucide-react';

export default function SettingsPage() {
  const [cadastroUrl, setCadastroUrl] = useState('');
  const [cadastroExterno, setCadastroExterno] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Textos configuráveis do formulário
  const [cadastroTitulo, setCadastroTitulo] = useState('');
  const [cadastroSubtitulo, setCadastroSubtitulo] = useState('');
  const [cadastroInfoTitulo, setCadastroInfoTitulo] = useState('');
  const [cadastroInfoTexto, setCadastroInfoTexto] = useState('');
  const [cadastroAvisoTitulo, setCadastroAvisoTitulo] = useState('');
  const [cadastroAvisoTexto, setCadastroAvisoTexto] = useState('');

  // Configurações de URLs de pagamento
  const [paymentPixUrl, setPaymentPixUrl] = useState('');
  const [paymentExterno, setPaymentExterno] = useState(false);
  const [paymentPixTitulo, setPaymentPixTitulo] = useState('');
  const [paymentPixSubtitulo, setPaymentPixSubtitulo] = useState('');
  const [paymentPixInstrucoes, setPaymentPixInstrucoes] = useState('');

  // Carregar configurações
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const urlConfig = data.data.find((c: any) => c.chave === 'cadastro_url');
        const externoConfig = data.data.find((c: any) => c.chave === 'cadastro_externo');
        const tituloConfig = data.data.find((c: any) => c.chave === 'cadastro_titulo');
        const subtituloConfig = data.data.find((c: any) => c.chave === 'cadastro_subtitulo');
        const infoTituloConfig = data.data.find((c: any) => c.chave === 'cadastro_info_titulo');
        const infoTextoConfig = data.data.find((c: any) => c.chave === 'cadastro_info_texto');
        const avisoTituloConfig = data.data.find((c: any) => c.chave === 'cadastro_aviso_titulo');
        const avisoTextoConfig = data.data.find((c: any) => c.chave === 'cadastro_aviso_texto');

        // Payment configs
        const paymentPixUrlConfig = data.data.find((c: any) => c.chave === 'payment_pix_url');
        const paymentExternoConfig = data.data.find((c: any) => c.chave === 'payment_externo');
        const paymentPixTituloConfig = data.data.find((c: any) => c.chave === 'payment_pix_titulo');
        const paymentPixSubtituloConfig = data.data.find((c: any) => c.chave === 'payment_pix_subtitulo');
        const paymentPixInstrucoesConfig = data.data.find((c: any) => c.chave === 'payment_pix_instrucoes');

        if (urlConfig) setCadastroUrl(urlConfig.valor);
        if (externoConfig) setCadastroExterno(externoConfig.valor === 'true');
        if (tituloConfig) setCadastroTitulo(tituloConfig.valor);
        if (subtituloConfig) setCadastroSubtitulo(subtituloConfig.valor);
        if (infoTituloConfig) setCadastroInfoTitulo(infoTituloConfig.valor);
        if (infoTextoConfig) setCadastroInfoTexto(infoTextoConfig.valor);
        if (avisoTituloConfig) setCadastroAvisoTitulo(avisoTituloConfig.valor);
        if (avisoTextoConfig) setCadastroAvisoTexto(avisoTextoConfig.valor);

        // Set payment configs
        if (paymentPixUrlConfig) setPaymentPixUrl(paymentPixUrlConfig.valor);
        if (paymentExternoConfig) setPaymentExterno(paymentExternoConfig.valor === 'true');
        if (paymentPixTituloConfig) setPaymentPixTitulo(paymentPixTituloConfig.valor);
        if (paymentPixSubtituloConfig) setPaymentPixSubtitulo(paymentPixSubtituloConfig.valor);
        if (paymentPixInstrucoesConfig) setPaymentPixInstrucoes(paymentPixInstrucoesConfig.valor);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveConfigs = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const configs = [
        { chave: 'cadastro_url', valor: cadastroUrl },
        { chave: 'cadastro_externo', valor: cadastroExterno.toString() },
        { chave: 'cadastro_titulo', valor: cadastroTitulo },
        { chave: 'cadastro_subtitulo', valor: cadastroSubtitulo },
        { chave: 'cadastro_info_titulo', valor: cadastroInfoTitulo },
        { chave: 'cadastro_info_texto', valor: cadastroInfoTexto },
        { chave: 'cadastro_aviso_titulo', valor: cadastroAvisoTitulo },
        { chave: 'cadastro_aviso_texto', valor: cadastroAvisoTexto },
        { chave: 'payment_pix_url', valor: paymentPixUrl },
        { chave: 'payment_externo', valor: paymentExterno.toString() },
        { chave: 'payment_pix_titulo', valor: paymentPixTitulo },
        { chave: 'payment_pix_subtitulo', valor: paymentPixSubtitulo },
        { chave: 'payment_pix_instrucoes', valor: paymentPixInstrucoes },
      ];

      const promises = configs.map(config =>
        fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        })
      );

      const responses = await Promise.all(promises);
      const allOk = responses.every(r => r.ok);

      if (allOk) {
        setMessage({ text: 'Configurações salvas com sucesso!', type: 'success' });
      } else {
        throw new Error('Erro ao salvar algumas configurações');
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Erro ao salvar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const downloadCadastroHtml = async () => {
    try {
      const response = await fetch('/api/generate-cadastro-html');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cadastro.html';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ text: 'Arquivo cadastro.html baixado com sucesso!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Erro ao baixar arquivo', type: 'error' });
    }
  };

  const downloadPaymentPixHtml = async () => {
    try {
      const response = await fetch('/api/generate-payment-pix-html');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payment-pix.html';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ text: 'Arquivo payment-pix.html baixado com sucesso!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Erro ao baixar arquivo', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-sm text-gray-500 mt-1">Ajustes gerais do sistema</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 max-w-4xl">
        {/* Mensagem de feedback */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Configurações de URL do Cadastro */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">URL do Formulário de Cadastro</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Completa do Cadastro
              </label>
              <input
                type="url"
                value={cadastroUrl}
                onChange={(e) => setCadastroUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="http://157.180.72.42/cadastro.html"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta URL será enviada pelo bot do Telegram no comando /cadastro
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Usar URL Externa</h3>
                <p className="text-sm text-gray-600">
                  Se ativado, usa a URL acima. Se desativado, usa /cadastro do sistema
                </p>
              </div>
              <button
                onClick={() => setCadastroExterno(!cadastroExterno)}
                className={`w-12 h-6 rounded-full relative transition-colors ${cadastroExterno ? 'bg-green-600' : 'bg-gray-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${cadastroExterno ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Baixe o arquivo <code className="bg-blue-100 px-2 py-1 rounded">cadastro.html</code> abaixo e hospede em qualquer servidor web. Depois configure a URL acima com o endereço onde você hospedou.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadCadastroHtml}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                Baixar cadastro.html
              </button>

              {cadastroUrl && (
                <a
                  href={cadastroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Testar URL
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Configurações de Pagamento PIX */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">URLs de Pagamento PIX</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Página de Pagamento PIX
              </label>
              <input
                type="url"
                value={paymentPixUrl}
                onChange={(e) => setPaymentPixUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://seusite.com/payment-pix.html"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta URL será usada quando o usuário escolher pagamento via PIX
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Usar URL Externa</h3>
                <p className="text-sm text-gray-600">
                  Se ativado, usa a URL acima. Se desativado, usa página interna do sistema
                </p>
              </div>
              <button
                onClick={() => setPaymentExterno(!paymentExterno)}
                className={`w-12 h-6 rounded-full relative transition-colors ${paymentExterno ? 'bg-green-600' : 'bg-gray-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${paymentExterno ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Textos da Página PIX</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={paymentPixTitulo}
                    onChange={(e) => setPaymentPixTitulo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="💰 Pagamento via PIX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={paymentPixSubtitulo}
                    onChange={(e) => setPaymentPixSubtitulo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Faça o pagamento e envie o comprovante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instruções
                  </label>
                  <textarea
                    value={paymentPixInstrucoes}
                    onChange={(e) => setPaymentPixInstrucoes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    placeholder="1️⃣ Copie a chave PIX abaixo..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Baixe o arquivo <code className="bg-blue-100 px-2 py-1 rounded">payment-pix.html</code> abaixo e hospede em qualquer servidor web (Netlify, Vercel, etc). Depois configure a URL acima.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadPaymentPixHtml}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                Baixar payment-pix.html
              </button>

              {paymentPixUrl && (
                <a
                  href={paymentPixUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 flex items-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Testar URL
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Textos do Formulário de Cadastro */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Textos do Formulário de Cadastro</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título Principal
                </label>
                <input
                  type="text"
                  value={cadastroTitulo}
                  onChange={(e) => setCadastroTitulo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="📝 Cadastro de Membro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={cadastroSubtitulo}
                  onChange={(e) => setCadastroSubtitulo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Preencha seus dados para se cadastrar"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Caixa de Informações (acima do formulário)
              </label>
              <input
                type="text"
                value={cadastroInfoTitulo}
                onChange={(e) => setCadastroInfoTitulo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ℹ️ Como Funciona o Sistema"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto Informativo (acima do formulário)
              </label>
              <textarea
                value={cadastroInfoTexto}
                onChange={(e) => setCadastroInfoTexto(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                placeholder="Acesso Multi-Grupo: Ao se cadastrar..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use quebras de linha para separar parágrafos. Pode usar emojis e formatação básica.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Aviso de Renovação (abaixo do formulário)
              </label>
              <input
                type="text"
                value={cadastroAvisoTitulo}
                onChange={(e) => setCadastroAvisoTitulo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="⚠️ Importante - Gerenciamento de Acesso"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto do Aviso de Renovação (abaixo do formulário)
              </label>
              <textarea
                value={cadastroAvisoTexto}
                onChange={(e) => setCadastroAvisoTexto(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                placeholder="• Seu acesso possui uma data de vencimento..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use • para listas. Pode usar emojis e formatação básica.
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Nota:</strong> Após salvar, os textos serão atualizados tanto na página /cadastro quanto no arquivo cadastro.html que você baixar.
              </p>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Configurações Gerais</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dias de Vencimento Padrão
              </label>
              <input
                type="number"
                defaultValue={30}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tempo padrão de acesso para novos membros
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Grupo
              </label>
              <input
                type="text"
                defaultValue="INEMA.Teste"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID do Grupo Telegram
              </label>
              <input
                type="text"
                defaultValue="-1002414487357"
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Definido em .env.local</p>
            </div>
          </div>
        </div>

        {/* Bot Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Configurações do Bot</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Auto-Cadastro ao Entrar</h3>
                <p className="text-sm text-gray-600">
                  Cadastra automaticamente quando alguém entra no grupo
                </p>
              </div>
              <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Auto-Cadastro por Mensagem</h3>
                <p className="text-sm text-gray-600">
                  Cadastra quando membro envia mensagem no grupo
                </p>
              </div>
              <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Mensagem de Boas-Vindas</h3>
                <p className="text-sm text-gray-600">Envia mensagem ao cadastrar novo membro</p>
              </div>
              <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Comando /registrar</h3>
                <p className="text-sm text-gray-600">
                  Permite cadastro voluntário via comando
                </p>
              </div>
              <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informações do Sistema</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Versão:</span>
              <span className="font-mono text-gray-900">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Banco de Dados:</span>
              <span className="font-mono text-gray-900">Supabase</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bot Status:</span>
              <span className="text-green-600 font-semibold">✅ Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bot Username:</span>
              <span className="font-mono text-gray-900">@INEMATLGrupobot</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Node.js:</span>
              <span className="font-mono text-gray-900">v18.19.1</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={saveConfigs}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            onClick={loadConfigs}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Recarregar
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Nota:</strong> Algumas configurações requerem reiniciar o bot para
            aplicar mudanças. Alterações em variáveis de ambiente (.env.local) requerem
            reiniciar o servidor também.
          </p>
        </div>
      </main>
    </div>
  );
}
