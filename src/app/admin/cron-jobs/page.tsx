'use client';

import { useState, useEffect } from 'react';
import { Clock, Play, Pencil, Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';

interface CronJob {
  id: string;
  nome: string;
  descricao: string;
  endpoint: string;
  frequencia: string;
  ativo: boolean;
  ultimo_exec: string | null;
  proximo_exec: string | null;
  total_execucoes: number;
  total_sucessos: number;
  total_erros: number;
  created_at: string;
  updated_at: string;
}

const frequenciaOpcoes = [
  { value: '*/5 * * * *', label: 'A cada 5 minutos' },
  { value: '*/10 * * * *', label: 'A cada 10 minutos' },
  { value: '*/15 * * * *', label: 'A cada 15 minutos' },
  { value: '*/30 * * * *', label: 'A cada 30 minutos' },
  { value: '0 * * * *', label: 'A cada 1 hora' },
  { value: '0 */2 * * *', label: 'A cada 2 horas' },
  { value: '0 */6 * * *', label: 'A cada 6 horas' },
  { value: '0 */12 * * *', label: 'A cada 12 horas' },
  { value: '0 0 * * *', label: 'Diariamente à meia-noite' },
  { value: '0 3 * * *', label: 'Diariamente às 03:00' },
  { value: '0 8 * * *', label: 'Diariamente às 08:00' },
  { value: '0 12 * * *', label: 'Diariamente ao meio-dia' },
  { value: '0 2 * * 0', label: 'Semanalmente (domingo 02:00)' },
];

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    endpoint: '',
    frequencia: '*/15 * * * *',
    ativo: true,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/admin/cron-jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Erro ao buscar cron jobs:', error);
      alert('Erro ao carregar cron jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingJob
        ? '/api/admin/cron-jobs'
        : '/api/admin/cron-jobs';

      const method = editingJob ? 'PUT' : 'POST';

      const payload = editingJob
        ? { ...formData, id: editingJob.id }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setShowModal(false);
        resetForm();
        fetchJobs();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar cron job');
    }
  };

  const handleToggle = async (job: CronJob) => {
    try {
      const res = await fetch('/api/admin/cron-jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: job.id,
          ativo: !job.ativo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        fetchJobs();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleExecute = async (job: CronJob) => {
    if (!confirm(`Executar "${job.nome}" agora?`)) return;

    setExecutingId(job.id);

    try {
      const res = await fetch('/api/admin/cron-jobs/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id }),
      });

      const data = await res.json();

      if (data.success && data.executionSuccess) {
        alert(`✅ ${data.message}`);
        fetchJobs();
      } else {
        alert(`⚠️ ${data.message}\n\nDetalhes: ${JSON.stringify(data.resultado, null, 2)}`);
      }
    } catch (error) {
      console.error('Erro ao executar:', error);
      alert('Erro ao executar cron job');
    } finally {
      setExecutingId(null);
    }
  };

  const handleEdit = (job: CronJob) => {
    setEditingJob(job);
    setFormData({
      nome: job.nome,
      descricao: job.descricao || '',
      endpoint: job.endpoint,
      frequencia: job.frequencia,
      ativo: job.ativo,
    });
    setShowModal(true);
  };

  const handleDelete = async (job: CronJob) => {
    if (!confirm(`Tem certeza que deseja excluir "${job.nome}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/cron-jobs?id=${job.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('Cron job excluído com sucesso');
        fetchJobs();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir cron job');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      endpoint: '',
      frequencia: '*/15 * * * *',
      ativo: true,
    });
    setEditingJob(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  };

  const getFrequenciaLabel = (expr: string) => {
    const opcao = frequenciaOpcoes.find(o => o.value === expr);
    return opcao ? opcao.label : expr;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Carregando cron jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">⚙️ Gerenciar Cron Jobs</h1>
            <p className="text-gray-600 mt-2">
              Processos automáticos do sistema • Total: {jobs.length}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Adicionar Processo
          </button>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Processo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Frequência
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Execuções
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Última Exec.
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum cron job configurado.
                    <br />
                    <button
                      onClick={() => setShowModal(true)}
                      className="text-blue-600 hover:underline mt-2 inline-block"
                    >
                      Clique aqui para adicionar o primeiro
                    </button>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{job.nome}</span>
                        <span className="text-sm text-gray-500">{job.descricao}</span>
                        <span className="text-xs text-gray-400 font-mono mt-1">{job.endpoint}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {getFrequenciaLabel(job.frequencia)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggle(job)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          job.ativo
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {job.ativo ? '✅ Ativo' : '⏸️ Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{job.total_execucoes || 0}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            {job.total_sucessos || 0}
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-3 h-3" />
                            {job.total_erros || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(job.ultimo_exec)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleExecute(job)}
                          disabled={executingId === job.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Executar agora"
                        >
                          <Play className={`w-5 h-5 ${executingId === job.id ? 'animate-pulse' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleEdit(job)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(job)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingJob ? 'Editar Cron Job' : 'Novo Cron Job'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Processo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Processar Pagamentos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o que este processo faz..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint *
                </label>
                <input
                  type="text"
                  required
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="/api/cron/seu-endpoint"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequência *
                </label>
                <select
                  required
                  value={formData.frequencia}
                  onChange={(e) => setFormData({ ...formData, frequencia: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {frequenciaOpcoes.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Ativar imediatamente após salvar
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingJob ? 'Salvar Alterações' : 'Criar Cron Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
