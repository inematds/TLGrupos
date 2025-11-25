export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Bem-vindo ao TLGrupos
            </h1>
            <p className="text-xl text-gray-600">
              Sistema de Gerenciamento de Membros do Telegram
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">
              🚀 Sistema Ativo e Funcionando!
            </h2>

            <div className="space-y-4 text-gray-700">
              <p className="text-lg">
                O servidor está operacional e pronto para uso.
              </p>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
                <p className="font-semibold text-green-800">✓ Servidor Online</p>
                <p className="text-green-700">Todos os serviços estão funcionando corretamente.</p>
              </div>
            </div>
          </div>

          {/* Menu Navigation */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">
              📋 Menu Principal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/dashboard"
                className="block p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border-2 border-blue-200 hover:border-blue-400"
              >
                <h4 className="text-xl font-semibold text-blue-800 mb-2">
                  📊 Dashboard
                </h4>
                <p className="text-blue-600">
                  Painel de controle e estatísticas
                </p>
              </a>

              <a
                href="/members"
                className="block p-6 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border-2 border-green-200 hover:border-green-400"
              >
                <h4 className="text-xl font-semibold text-green-800 mb-2">
                  👥 Membros
                </h4>
                <p className="text-green-600">
                  Gerenciar membros cadastrados
                </p>
              </a>

              <a
                href="/groups"
                className="block p-6 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border-2 border-purple-200 hover:border-purple-400"
              >
                <h4 className="text-xl font-semibold text-purple-800 mb-2">
                  💬 Grupos
                </h4>
                <p className="text-purple-600">
                  Gerenciar grupos do Telegram
                </p>
              </a>

              <a
                href="/settings"
                className="block p-6 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border-2 border-orange-200 hover:border-orange-400"
              >
                <h4 className="text-xl font-semibold text-orange-800 mb-2">
                  ⚙️ Configurações
                </h4>
                <p className="text-orange-600">
                  Ajustes e preferências do sistema
                </p>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-600">
            <p>TLGrupos © 2025 - Sistema de Gerenciamento de Membros</p>
          </div>
        </div>
      </div>
    </div>
  )
}
