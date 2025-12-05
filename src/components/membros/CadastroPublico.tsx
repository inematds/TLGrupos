'use client';

export default function CadastroPublico() {
  return (
    <div className="max-w-4xl">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Formulário de Cadastro Público</h2>
        <p className="text-gray-700 mb-6">
          O formulário de cadastro público possui um design especial para os novos membros
          e está disponível em uma página dedicada com URL própria.
        </p>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Acesse o formulário completo:
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL do Formulário Público:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/cadastro`}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/cadastro`);
                    alert('URL copiada para a área de transferência!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copiar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Compartilhe esta URL com novos membros para que possam se cadastrar
              </p>
            </div>

            <div className="pt-4">
              <a
                href="/cadastro"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                Abrir Formulário de Cadastro →
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">
            💡 Dica
          </h4>
          <p className="text-sm text-yellow-800">
            O formulário público pode receber parâmetros do Telegram via URL (telegram_id, username, nome)
            para pré-preencher informações quando o usuário vem do bot.
          </p>
        </div>
      </div>
    </div>
  );
}
