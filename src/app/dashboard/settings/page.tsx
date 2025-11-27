'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Download, ExternalLink, Link as LinkIcon } from 'lucide-react';

export default function SettingsPage() {
  const [cadastroUrl, setCadastroUrl] = useState('');
  const [cadastroExterno, setCadastroExterno] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

        if (urlConfig) setCadastroUrl(urlConfig.valor);
        if (externoConfig) setCadastroExterno(externoConfig.valor === 'true');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveConfigs = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Salvar cadastro_url
      const urlResponse = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave: 'cadastro_url', valor: cadastroUrl }),
      });

      // Salvar cadastro_externo
      const externoResponse = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave: 'cadastro_externo', valor: cadastroExterno.toString() }),
      });

      if (urlResponse.ok && externoResponse.ok) {
        setMessage({ text: 'Configurações salvas com sucesso!', type: 'success' });
      } else {
        throw new Error('Erro ao salvar configurações');
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
