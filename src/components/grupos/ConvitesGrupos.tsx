'use client';

import { useEffect, useState } from 'react';
import { Invite } from '@/types';
import { Copy, RefreshCw, CheckCircle, XCircle, Clock, Mail, Send } from 'lucide-react';

export default function ConvitesGrupos() {
  const [convites, setConvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    buscarConvites();
  }, []);

  async function buscarConvites() {
    setLoading(true);
    try {
      const res = await fetch('/api/convites');
      const data = await res.json();
      if (data.success) {
        setConvites(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
    } finally {
      setLoading(false);
    }
  }

  async function copiarLink(link: string, id: string) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (error) {
      prompt('Copie este link manualmente:', link);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusBadge(convite: Invite) {
    if (convite.used) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Usado
        </span>
      );
    }

    const expirado = new Date(convite.expires_at) < new Date();
    if (expirado) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3" />
          Expirado
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
        <Clock className="w-3 h-3" />
        Ativo
      </span>
    );
  }

  function getEnvioStatus(convite: Invite) {
    const badges = [];

    if (convite.telegram_sent) {
      badges.push(
        <span key="tg" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">
          <Send className="w-3 h-3" />
          Telegram ✓
        </span>
      );
    } else if (convite.telegram_error) {
      badges.push(
        <span key="tg" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-50 text-red-700 border border-red-200" title={convite.telegram_error}>
          <Send className="w-3 h-3" />
          Telegram ✗
        </span>
      );
    }

    if (convite.email_sent) {
      badges.push(
        <span key="email" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">
          <Mail className="w-3 h-3" />
          Email ✓
        </span>
      );
    } else if (convite.email_error) {
      badges.push(
        <span key="email" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-50 text-red-700 border border-red-200" title={convite.email_error}>
          <Mail className="w-3 h-3" />
          Email ✗
        </span>
      );
    }

    if (badges.length === 0) {
      return (
        <span className="text-xs text-gray-500">
          Nenhum envio
        </span>
      );
    }

    return <div className="flex gap-1 flex-wrap">{badges}</div>;
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      {/* Botão de atualizar */}
      <div className="mb-6">
        <button
          onClick={buscarConvites}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total de Convites</p>
          <p className="text-2xl font-bold text-blue-600">{convites.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Usados</p>
          <p className="text-2xl font-bold text-green-600">
            {convites.filter((c) => c.used).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="text-2xl font-bold text-yellow-600">
            {convites.filter((c) => !c.used && new Date(c.expires_at) > new Date()).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <p className="text-sm text-gray-500">Expirados</p>
          <p className="text-2xl font-bold text-gray-600">
            {convites.filter((c) => !c.used && new Date(c.expires_at) < new Date()).length}
          </p>
        </div>
      </div>

      {/* Tabela de convites */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Membro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status do Convite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Envio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Criado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expira em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {convites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum convite gerado ainda
                  </td>
                </tr>
              ) : (
                convites.map((convite) => (
                  <tr key={convite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {convite.member?.nome || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {convite.member?.telegram_username
                          ? `@${convite.member.telegram_username}`
                          : convite.member?.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(convite)}</td>
                    <td className="px-6 py-4">{getEnvioStatus(convite)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(convite.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(convite.expires_at)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => copiarLink(convite.invite_link, convite.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Copiar link"
                      >
                        {copiedId === convite.id ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar Link
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informações */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Sobre os Convites</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Telegram ✓</strong>: Mensagem enviada com sucesso via Telegram</li>
          <li><strong>Email ✓</strong>: Email enviado com sucesso (fallback quando Telegram falha)</li>
          <li><strong>Usado</strong>: Membro já entrou no grupo usando este convite</li>
          <li><strong>Expirado</strong>: Data de expiração passou e convite não é mais válido</li>
          <li>Você pode copiar o link de qualquer convite ativo e enviá-lo manualmente</li>
        </ul>
      </div>
    </>
  );
}
