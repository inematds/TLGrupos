'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, MapPin, Calendar, Target, Heart, Users, Info } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function CadastroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cidade: '',
    uf: '',
    data_nascimento: '',
    nicho: '',
    interesse: '',
    grupo_favorito: '',
  });

  // Capturar parâmetros do Telegram da URL
  useEffect(() => {
    const telegram_id = searchParams.get('telegram_id');
    const username = searchParams.get('username');
    const nome = searchParams.get('nome');

    if (telegram_id) {
      setTelegramId(telegram_id);
      console.log('Telegram ID capturado:', telegram_id);
    }

    if (username) {
      setTelegramUsername(username);
    }

    if (nome) {
      setFormData(prev => ({ ...prev, nome: decodeURIComponent(nome) }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    try {
      // Validação
      if (!formData.nome || !formData.email || !formData.telefone) {
        alert('Por favor, preencha todos os campos obrigatórios (Nome, Email e Telefone)');
        setLoading(false);
        return;
      }

      // Enviar para API (incluindo telegram_id se disponível)
      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          telegram_user_id: telegramId ? parseInt(telegramId) : undefined,
          telegram_username: telegramUsername || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar');
      }

      // Capturar link de convite se disponível
      if (data.data?.inviteLink) {
        setInviteLink(data.data.inviteLink);
        setMensagem('🎉 Cadastro realizado com sucesso! Clique no link abaixo para entrar no grupo.');
      } else {
        setMensagem('✅ Cadastro realizado com sucesso!');
      }

      // Limpar formulário
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cidade: '',
        uf: '',
        data_nascimento: '',
        nicho: '',
        interesse: '',
        grupo_favorito: '',
      });

    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      alert(error.message || 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Cadastro de Membro</h1>
            <p className="mt-2 text-gray-600">Preencha seus dados para se cadastrar</p>

            {/* Badge Telegram Conectado */}
            {telegramId && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  Telegram Conectado {telegramUsername && `(@${telegramUsername})`}
                </span>
              </div>
            )}
          </div>

          {/* Informações Importantes */}
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <div className="flex items-start">
              <Info className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  ℹ️ Como Funciona o Sistema
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    <strong>Acesso Multi-Grupo:</strong> Ao se cadastrar, você terá acesso a <strong>TODOS os grupos</strong> do Telegram onde nosso bot está ativo.
                  </p>
                  <ul className="ml-4 space-y-1 list-disc">
                    <li>Você receberá <strong>30 dias de acesso</strong> automaticamente</li>
                    <li>O mesmo cadastro funciona em todos os grupos</li>
                    <li>A data de vencimento é compartilhada entre os grupos</li>
                    <li>Use o comando <code className="bg-blue-100 px-1 py-0.5 rounded">/status</code> no Telegram para verificar seu tempo restante</li>
                  </ul>
                  <p className="mt-3 text-blue-700">
                    💡 <strong>Dica:</strong> Após o cadastro, você receberá um link para entrar nos grupos. Guarde esse link!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagem de sucesso */}
          {mensagem && (
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-center font-medium text-lg mb-4">{mensagem}</p>

              {/* Link de convite */}
              {inviteLink && (
                <div className="mt-6 p-6 bg-white border-4 border-green-500 rounded-xl shadow-2xl">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                      <span className="text-4xl">🎉</span>
                    </div>
                    <p className="text-xl font-bold text-green-700 mb-2">
                      Cadastro Realizado!
                    </p>
                    <p className="text-sm text-gray-600">
                      Clique no botão abaixo para entrar no grupo
                    </p>
                  </div>

                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 block w-full px-8 py-6 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 active:scale-95 transition-all duration-200 text-center font-bold text-xl shadow-xl cursor-pointer transform hover:scale-105"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-2xl">👉</span>
                      <span>ENTRAR NO GRUPO AGORA</span>
                      <span className="text-2xl">👈</span>
                    </span>
                  </a>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 text-center font-medium">
                      💡 Link exclusivo válido até {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {/* Link de texto como fallback */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 mb-2">Ou copie o link abaixo:</p>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <code className="text-xs text-blue-600 break-all select-all">
                        {inviteLink}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="João da Silva"
                />
              </div>
            </div>

            {/* Email e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>

            {/* Cidade e UF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="São Paulo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UF
                </label>
                <select
                  name="uf"
                  value={formData.uf}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  {UF_OPTIONS.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Nascimento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Nicho */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nicho / Área de Atuação
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="nicho"
                  value={formData.nicho}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Marketing Digital, E-commerce, Tecnologia..."
                />
              </div>
            </div>

            {/* Interesse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principais Interesses
              </label>
              <div className="relative">
                <Heart className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  name="interesse"
                  value={formData.interesse}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Conte-nos sobre seus principais interesses..."
                />
              </div>
            </div>

            {/* Grupo Favorito */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qual grupo você mais gosta?
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="grupo_favorito"
                  value={formData.grupo_favorito}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do grupo do Telegram"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>

          {/* Nota */}
          <p className="mt-6 text-sm text-gray-500 text-center">
            <span className="text-red-500">*</span> Campos obrigatórios
          </p>

          {/* Informação sobre Renovação */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">
              ⚠️ Importante - Renovação de Acesso
            </h4>
            <div className="text-xs text-yellow-800 space-y-1">
              <p>
                • Seu acesso expira automaticamente após <strong>30 dias</strong>
              </p>
              <p>
                • Quando vencer, você será <strong>removido de TODOS os grupos</strong> simultaneamente
              </p>
              <p>
                • Para renovar, entre em contato com os administradores antes do vencimento
              </p>
              <p className="mt-2 text-yellow-700">
                💡 Use <code className="bg-yellow-100 px-1 rounded">/status</code> no Telegram para acompanhar seu tempo restante!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
