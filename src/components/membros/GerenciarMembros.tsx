'use client';

export default function GerenciarMembros() {
  return (
    <div className="max-w-7xl">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Gerenciar Membros
        </h3>
        <p className="text-sm text-blue-800">
          A página completa de gerenciamento de membros está disponível em{' '}
          <a href="/members" className="underline font-medium">
            /members
          </a>
          . Esta aba será implementada em breve.
        </p>
      </div>

      <div className="flex items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            A funcionalidade completa de gerenciamento de membros<br />
            está temporariamente disponível na página /members
          </p>
          <a
            href="/members"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir para Gerenciar Membros
          </a>
        </div>
      </div>
    </div>
  );
}
