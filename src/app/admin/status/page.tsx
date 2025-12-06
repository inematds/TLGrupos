'use client';

import { useState, useEffect, useCallback } from 'react';

interface SystemStatus {
  timestamp: string;
  uptime: {
    system: number;
    process: number;
    formatted: string;
  };
  cpu: {
    model: string;
    cores: number;
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  node: {
    version: string;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
  };
  network: {
    hostname: string;
    interfaces: { name: string; address: string }[];
  };
  platform: {
    type: string;
    release: string;
    arch: string;
  };
}

interface HistoryPoint {
  time: string;
  cpu: number;
  memory: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function GaugeChart({ value, label, color, maxValue = 100 }: { value: number; label: string; color: string; maxValue?: number }) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute w-32 h-32 rounded-full border-8 border-gray-200 dark:border-gray-700"
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
        <div
          className="absolute w-32 h-32 rounded-full border-8 origin-center transition-transform duration-500"
          style={{
            borderColor: color,
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            transform: `rotate(${rotation - 90}deg)`,
            opacity: 0.3
          }}
        />
        <div
          className="absolute left-1/2 bottom-0 w-1 h-14 origin-bottom transition-transform duration-500"
          style={{
            backgroundColor: color,
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            boxShadow: `0 0 10px ${color}`
          }}
        />
        <div className="absolute left-1/2 bottom-0 w-3 h-3 rounded-full bg-gray-800 dark:bg-white transform -translate-x-1/2 translate-y-1/2" />
      </div>
      <div className="mt-2 text-center">
        <div className="text-2xl font-bold" style={{ color }}>{value.toFixed(1)}%</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    </div>
  );
}

function ProgressBar({ value, label, color, detail }: { value: number; label: string; color: string; detail?: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{detail || `${value.toFixed(1)}%`}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-500 relative overflow-hidden"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

interface MetricInfo {
  title: string;
  description: string;
  details: string[];
  tips: string[];
}

const metricInfos: Record<string, MetricInfo> = {
  cpu: {
    title: 'CPU - Unidade Central de Processamento',
    description: 'A CPU e o "cerebro" do servidor. Ela executa todas as instrucoes dos programas e processa os dados.',
    details: [
      'Uso de 0-30%: Servidor tranquilo, capacidade de sobra',
      'Uso de 30-70%: Carga moderada, funcionamento normal',
      'Uso de 70-90%: Carga alta, monitorar de perto',
      'Uso acima de 90%: Critico! Pode causar lentidao'
    ],
    tips: [
      'Se o uso esta constantemente alto, considere otimizar o codigo ou aumentar recursos',
      'Picos ocasionais sao normais durante processamentos intensos',
      'Cores: Quanto mais nucleos (cores), mais processos simultaneos'
    ]
  },
  memory: {
    title: 'Memoria RAM',
    description: 'A memoria RAM armazena temporariamente os dados que estao sendo usados pelos programas em execucao.',
    details: [
      'Uso de 0-50%: Excelente, muita memoria livre',
      'Uso de 50-75%: Normal para servidores em producao',
      'Uso de 75-90%: Atencao, memoria ficando escassa',
      'Uso acima de 90%: Critico! Pode causar travamentos'
    ],
    tips: [
      'Memoria alta pode indicar vazamento de memoria (memory leak)',
      'Reiniciar a aplicacao pode liberar memoria acumulada',
      'Considere aumentar RAM se o uso for constantemente alto'
    ]
  },
  disk: {
    title: 'Disco / Armazenamento',
    description: 'O disco armazena todos os arquivos do sistema, banco de dados, logs e aplicacoes.',
    details: [
      'Uso de 0-50%: Espaco abundante',
      'Uso de 50-75%: Normal, mas monitore o crescimento',
      'Uso de 75-90%: Atencao, espaco ficando limitado',
      'Uso acima de 90%: Critico! Limpe arquivos ou aumente o disco'
    ],
    tips: [
      'Logs antigos podem ocupar muito espaco - configure rotacao',
      'Backups locais podem encher o disco rapidamente',
      'Arquivos temporarios devem ser limpos periodicamente'
    ]
  },
  uptime: {
    title: 'Uptime do Sistema',
    description: 'O uptime indica ha quanto tempo o servidor esta funcionando sem interrupcoes desde o ultimo reinicio.',
    details: [
      'Uptime alto: Sistema estavel, sem reinicializacoes',
      'Uptime baixo: Pode indicar reinicio recente ou instabilidade',
      'Reinicializacao pode ser necessaria apos atualizacoes',
      'Monitorar uptime ajuda a identificar problemas'
    ],
    tips: [
      'Um uptime muito alto pode significar falta de atualizacoes de seguranca',
      'Reiniciar periodicamente pode ajudar a limpar memoria',
      'Agende manutencoes em horarios de baixo uso'
    ]
  },
  loadavg: {
    title: 'Load Average (Carga Media)',
    description: 'O Load Average mostra a carga media do sistema nos ultimos 1, 5 e 15 minutos. Valores ideais sao menores que o numero de nucleos da CPU.',
    details: [
      'Valor menor que nucleos: Sistema tranquilo',
      'Valor igual aos nucleos: Sistema em capacidade ideal',
      'Valor 1.5x nucleos: Carga alta, pode haver lentidao',
      'Valor 2x+ nucleos: Sobrecarga! Investigar processos'
    ],
    tips: [
      'Compare o load com o numero de cores do seu processador',
      'Load alto constante pode indicar necessidade de mais recursos',
      'Picos momentaneos sao normais, observe a media de 15 min'
    ]
  },
  memorydetails: {
    title: 'Detalhes de Memoria',
    description: 'Informacoes detalhadas sobre o uso de memoria do sistema e da aplicacao Node.js.',
    details: [
      'RAM Total: Memoria fisica do servidor',
      'Heap Node.js: Memoria usada pelo JavaScript',
      'RSS: Memoria total do processo incluindo bibliotecas',
      'External: Memoria usada por objetos C++ do Node'
    ],
    tips: [
      'Heap crescendo sem parar pode indicar memory leak',
      'RSS alto pode ser normal para aplicacoes grandes',
      'Monitore a diferenca entre heapUsed e heapTotal'
    ]
  },
  network: {
    title: 'Interfaces de Rede',
    description: 'Lista das interfaces de rede ativas no servidor com seus respectivos enderecos IP.',
    details: [
      'eth0/ens*: Interface ethernet principal',
      'docker0: Rede do Docker (se instalado)',
      'lo: Interface de loopback (127.0.0.1)',
      'wlan*: Interface WiFi (se disponivel)'
    ],
    tips: [
      'O IP principal e geralmente o da interface eth0 ou ens*',
      'Multiplas interfaces podem indicar VPNs ou containers',
      'Verifique se o IP corresponde ao esperado'
    ]
  }
};

function InfoModal({ metric, onClose }: { metric: string; onClose: () => void }) {
  const info = metricInfos[metric];
  if (!info) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{info.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">{info.description}</p>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Niveis de Uso:</h3>
            <ul className="space-y-2">
              {info.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    idx === 0 ? 'bg-green-500' :
                    idx === 1 ? 'bg-blue-500' :
                    idx === 2 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  {detail}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Dicas:</h3>
            <ul className="space-y-1">
              {info.tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniChart({ data, color, label, metricType, onInfoClick }: { data: number[]; color: string; label: string; metricType?: string; onInfoClick?: () => void }) {
  // Garantir que temos dados validos para o grafico
  const hasData = data.some(v => v > 0);
  const validData = hasData ? data : data.map(() => 0.5);
  const max = 100; // Sempre usar 100 como maximo para percentuais
  const min = 0;
  const range = max - min || 1; // Evitar divisao por zero

  const points = validData.map((value, index) => {
    const x = (index / (validData.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;
  const currentValue = data[data.length - 1] || 0;

  return (
    <div className="rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-lg font-bold" style={{ color }}>{currentValue.toFixed(1)}%</span>
      </div>
      <svg viewBox="0 0 100 50" className="w-full h-16">
        <defs>
          <linearGradient id={`gradient-${label.replace(/\s/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill={`url(#gradient-${label.replace(/\s/g, '-')})`}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Current value dot */}
        {hasData && (
          <circle
            cx="100"
            cy={100 - (currentValue / 100) * 100}
            r="3"
            fill={color}
            className="animate-pulse"
          />
        )}
      </svg>
      {!hasData && (
        <p className="text-xs text-gray-400 text-center mt-1">Coletando dados...</p>
      )}
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const secondDeg = seconds * 6;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Clock face */}
          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 dark:text-gray-600" />

          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = 50 + 40 * Math.cos(angle);
            const y1 = 50 + 40 * Math.sin(angle);
            const x2 = 50 + 45 * Math.cos(angle);
            const y2 = 50 + 45 * Math.sin(angle);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" className="text-gray-400 dark:text-gray-500" />
            );
          })}

          {/* Hour hand */}
          <line
            x1="50" y1="50"
            x2={50 + 25 * Math.cos((hourDeg - 90) * Math.PI / 180)}
            y2={50 + 25 * Math.sin((hourDeg - 90) * Math.PI / 180)}
            stroke="currentColor" strokeWidth="4" strokeLinecap="round"
            className="text-gray-800 dark:text-white"
          />

          {/* Minute hand */}
          <line
            x1="50" y1="50"
            x2={50 + 35 * Math.cos((minuteDeg - 90) * Math.PI / 180)}
            y2={50 + 35 * Math.sin((minuteDeg - 90) * Math.PI / 180)}
            stroke="currentColor" strokeWidth="3" strokeLinecap="round"
            className="text-gray-600 dark:text-gray-300"
          />

          {/* Second hand */}
          <line
            x1="50" y1="50"
            x2={50 + 40 * Math.cos((secondDeg - 90) * Math.PI / 180)}
            y2={50 + 40 * Math.sin((secondDeg - 90) * Math.PI / 180)}
            stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill="#ef4444" />
        </svg>
      </div>
      <div className="mt-2 text-xl font-mono font-bold text-gray-800 dark:text-white">
        {time.toLocaleTimeString('pt-BR')}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [memHistory, setMemHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [diskHistory, setDiskHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/system/status');
      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
        setError(null);

        // Update history
        setCpuHistory(prev => [...prev.slice(1), data.data.cpu.usage]);
        setMemHistory(prev => [...prev.slice(1), data.data.memory.usagePercent]);
        setDiskHistory(prev => [...prev.slice(1), data.data.disk.usagePercent]);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-lg">
          Erro: {error}
        </div>
      </div>
    );
  }

  if (!status) return null;

  const getStatusColor = (value: number) => {
    if (value < 50) return '#22c55e'; // green
    if (value < 75) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Status do Sistema</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Monitoramento em tempo real do servidor
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Online</span>
          </div>
        </div>

        {/* Clock and Uptime Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg flex justify-center">
            <Clock />
          </div>

          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all"
            onClick={() => setSelectedMetric('uptime')}
            title="Clique para mais informacoes"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              Uptime do Sistema
              <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">?</span>
            </h3>
            <div className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">
              {status.uptime.formatted}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Servidor ativo desde o ultimo reinicio
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Informações</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Hostname:</span>
                <span className="font-medium text-gray-800 dark:text-white">{status.network.hostname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">SO:</span>
                <span className="font-medium text-gray-800 dark:text-white">{status.platform.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Node.js:</span>
                <span className="font-medium text-gray-800 dark:text-white">{status.node.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Arquitetura:</span>
                <span className="font-medium text-gray-800 dark:text-white">{status.platform.arch}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gauges Row with Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* CPU */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all"
            onClick={() => setSelectedMetric('cpu')}
            title="Clique para mais informacoes"
          >
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                CPU
                <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">?</span>
              </h3>
              <GaugeChart
                value={status.cpu.usage}
                label={`${status.cpu.cores} cores`}
                color={getStatusColor(status.cpu.usage)}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center truncate max-w-full">
                {status.cpu.model}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <MiniChart
                data={cpuHistory}
                color="#3b82f6"
                label="Historico CPU (60s)"
                metricType="cpu"
              />
            </div>
          </div>

          {/* Memoria */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all"
            onClick={() => setSelectedMetric('memory')}
            title="Clique para mais informacoes"
          >
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                Memoria
                <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">?</span>
              </h3>
              <GaugeChart
                value={status.memory.usagePercent}
                label={`${formatBytes(status.memory.used)} / ${formatBytes(status.memory.total)}`}
                color={getStatusColor(status.memory.usagePercent)}
              />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <MiniChart
                data={memHistory}
                color="#8b5cf6"
                label="Historico Memoria (60s)"
                metricType="memory"
              />
            </div>
          </div>

          {/* Disco */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all"
            onClick={() => setSelectedMetric('disk')}
            title="Clique para mais informacoes"
          >
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                Disco
                <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">?</span>
              </h3>
              <GaugeChart
                value={status.disk.usagePercent}
                label={`${formatBytes(status.disk.used)} / ${formatBytes(status.disk.total)}`}
                color={getStatusColor(status.disk.usagePercent)}
              />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <MiniChart
                data={diskHistory}
                color="#10b981"
                label="Historico Disco (60s)"
                metricType="disk"
              />
            </div>
          </div>
        </div>

        {/* Details Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Memory Details */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all"
            onClick={() => setSelectedMetric('memorydetails')}
            title="Clique para mais informacoes"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              Detalhes de Memoria
              <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">?</span>
            </h3>
            <ProgressBar
              value={status.memory.usagePercent}
              label="RAM Total"
              color="#8b5cf6"
              detail={`${formatBytes(status.memory.used)} de ${formatBytes(status.memory.total)}`}
            />
            <ProgressBar
              value={(status.node.memoryUsage.heapUsed / status.node.memoryUsage.heapTotal) * 100}
              label="Heap Node.js"
              color="#06b6d4"
              detail={`${formatBytes(status.node.memoryUsage.heapUsed)} de ${formatBytes(status.node.memoryUsage.heapTotal)}`}
            />
            <ProgressBar
              value={(status.node.memoryUsage.rss / status.memory.total) * 100}
              label="RSS (Resident Set Size)"
              color="#10b981"
              detail={formatBytes(status.node.memoryUsage.rss)}
            />
          </div>

          {/* Load Average */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all"
            onClick={() => setSelectedMetric('loadavg')}
            title="Clique para mais informacoes"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              Load Average
              <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">?</span>
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {status.cpu.loadAverage[0]?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">1 min</div>
              </div>
              <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {status.cpu.loadAverage[1]?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">5 min</div>
              </div>
              <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {status.cpu.loadAverage[2]?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">15 min</div>
              </div>
            </div>

            <div
              className="mt-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={(e) => { e.stopPropagation(); setSelectedMetric('network'); }}
              title="Clique para mais informacoes"
            >
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                Interfaces de Rede
                <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">?</span>
              </h4>
              <div className="space-y-2">
                {status.network.interfaces.map((iface, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{iface.name}</span>
                    <span className="text-sm font-mono text-gray-800 dark:text-white">{iface.address}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Ultima atualizacao: {new Date(status.timestamp).toLocaleString('pt-BR')} |
          Atualizando a cada 3 segundos
        </div>
      </div>

      {/* Modal de Informacoes */}
      {selectedMetric && (
        <InfoModal metric={selectedMetric} onClose={() => setSelectedMetric(null)} />
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
