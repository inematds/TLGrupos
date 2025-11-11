'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Calendar,
  User,
  DollarSign,
  Link as LinkIcon,
  AlertCircle,
  CheckCheck
} from 'lucide-react';

interface Cadastro {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  telegram_username?: string;
  plano_dias: number;
  valor_pago: number;
  status: string;
  link_enviado: boolean;
  invite_link?: string;
  comprovante_url?: string;
  comprovante_enviado_em?: string;
  validado_por?: string;
  validado_em?: string;
  created_at: string;
  updated_at: string;
  plan?: {
    nome: string;
    valor: number;
  };
}

export default function CadastrosPage() {
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    buscarCadastros();
  }, [statusFilter]);

  async function buscarCadastros() {
    setLoading(true);
    try {
      const url = statusFilter === 'all'
        ? '/api/cadastro-pendente'
        : `/api/cadastro-pendente?status=${statusFilter}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setCadastros(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar cadastros:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusInfo(status: string) {
    const statusMap: any = {
      aguardando_pagamento: {
        label: 'Aguardando Pagamento',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      comprovante_enviado: {
        label: 'Comprovante Enviado',
        color: 'bg-blue-100 text-blue-800',
        icon: AlertCircle,
      },
      validado: {
        label: 'Validado',
        color: 'bg-purple-100 text-purple-800',
        icon: CheckCheck,
      },
      pago: {
        label: 'Pago e Link Enviado',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      cancelado: {
        label: 'Cancelado',
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
      expirado: {
        label: 'Expirado',
        color: 'bg-gray-100 text-gray-800',
        icon: XCircle,
      },
    };

    return statusMap[status] || statusMap.aguardando_pagamento;
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('pt-BR');
  }

  const statusCounts = {
    all: cadastros.length,
    aguardando_pagamento: cadastros.filter(c => c.status === 'aguardando_pagamento').length,
    comprovante_enviado: cadastros.filter(c => c.status === 'comprovante_enviado').length,
    pago: cadastros.filter(c => c.status === 'pago').length,
    cancelado: cadastros.filter(c => c.status === 'cancelado').length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Histórico de Cadastros</h1>
        <p className="text-gray-600 mt-2">
          Acompanhe todos os cadastros e o status de envio dos links
        </p>
      </div>

      {/* Filtros por Status */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Todos ({statusCounts.all})
        </button>
        <button
          onClick={() => setStatusFilter('comprovante_enviado')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            statusFilter === 'comprovante_enviado'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Pendente Validação ({statusCounts.comprovante_enviado})
        </button>
        <button
          onClick={() => setStatusFilter('pago')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            statusFilter === 'pago'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Aprovados ({statusCounts.pago})
        </button>
        <button
          onClick={() => setStatusFilter('cancelado')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            statusFilter === 'cancelado'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Cancelados ({statusCounts.cancelado})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      ) : cadastros.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum cadastro encontrado
          </h3>
          <p className="text-gray-600">
            Não há cadastros com o status selecionado.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {cadastros.map((cadastro) => {
            const statusInfo = getStatusInfo(cadastro.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={cadastro.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {cadastro.nome}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {cadastro.email}
                      </div>
                      {cadastro.telegram_username && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          @{cadastro.telegram_username}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {cadastro.valor_pago.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {cadastro.plano_dias} dias
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Cadastrado em:</p>
                    <p className="font-semibold">{formatDate(cadastro.created_at)}</p>
                  </div>

                  {cadastro.comprovante_enviado_em && (
                    <div>
                      <p className="text-gray-500">Comprovante enviado:</p>
                      <p className="font-semibold">{formatDate(cadastro.comprovante_enviado_em)}</p>
                    </div>
                  )}

                  {cadastro.validado_em && (
                    <div>
                      <p className="text-gray-500">Validado em:</p>
                      <p className="font-semibold">{formatDate(cadastro.validado_em)}</p>
                    </div>
                  )}

                  {cadastro.validado_por && (
                    <div>
                      <p className="text-gray-500">Validado por:</p>
                      <p className="font-semibold">{cadastro.validado_por}</p>
                    </div>
                  )}
                </div>

                {/* Indicador de Link Enviado */}
                <div className="border-t pt-4 mt-4">
                  {cadastro.link_enviado && cadastro.invite_link ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Link de acesso enviado com sucesso</span>
                      <a
                        href={cadastro.invite_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Ver Link
                      </a>
                    </div>
                  ) : cadastro.status === 'pago' ? (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Pagamento aprovado, aguardando envio do link</span>
                    </div>
                  ) : cadastro.status === 'comprovante_enviado' ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">Aguardando validação do comprovante</span>
                    </div>
                  ) : cadastro.status === 'cancelado' ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Pagamento reprovado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">Aguardando pagamento</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
