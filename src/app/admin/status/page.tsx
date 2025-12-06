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

function MiniChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  const max = Math.max(...data, 100);
  const min = 0;
  const range = max - min;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-lg font-bold" style={{ color }}>{data[data.length - 1]?.toFixed(1) || 0}%</span>
      </div>
      <svg viewBox="0 0 100 50" className="w-full h-16">
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon
          points={areaPoints}
          fill={`url(#gradient-${label})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
  const [cpuHistory, setCpuHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [memHistory, setMemHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

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

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Uptime do Sistema</h3>
            <div className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">
              {status.uptime.formatted}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Servidor ativo desde o último reinício
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

        {/* Gauges Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">CPU</h3>
            <GaugeChart
              value={status.cpu.usage}
              label={`${status.cpu.cores} cores`}
              color={getStatusColor(status.cpu.usage)}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center truncate max-w-full">
              {status.cpu.model}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Memoria</h3>
            <GaugeChart
              value={status.memory.usagePercent}
              label={`${formatBytes(status.memory.used)} / ${formatBytes(status.memory.total)}`}
              color={getStatusColor(status.memory.usagePercent)}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Disco</h3>
            <GaugeChart
              value={status.disk.usagePercent}
              label={`${formatBytes(status.disk.used)} / ${formatBytes(status.disk.total)}`}
              color={getStatusColor(status.disk.usagePercent)}
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <MiniChart data={cpuHistory} color="#3b82f6" label="CPU (ultimos 30s)" />
          <MiniChart data={memHistory} color="#8b5cf6" label="Memoria (ultimos 30s)" />
        </div>

        {/* Details Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Memory Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Detalhes de Memoria</h3>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Load Average</h3>
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

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Interfaces de Rede</h4>
              <div className="space-y-2">
                {status.network.interfaces.map((iface, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
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
