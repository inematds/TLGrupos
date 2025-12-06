import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

async function getCpuUsage(): Promise<number> {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  }

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - (idle / total) * 100;

  return Math.round(usage * 100) / 100;
}

async function getDiskUsage(): Promise<{ total: number; used: number; free: number; usagePercent: number }> {
  // Valores padrão caso não consiga obter
  try {
    const { execSync } = require('child_process');
    const result = execSync("df -B1 / | tail -1 | awk '{print $2,$3,$4}'", { encoding: 'utf-8' });
    const [total, used, free] = result.trim().split(' ').map(Number);

    return {
      total,
      used,
      free,
      usagePercent: Math.round((used / total) * 100 * 100) / 100
    };
  } catch {
    return {
      total: 0,
      used: 0,
      free: 0,
      usagePercent: 0
    };
  }
}

export async function GET() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const cpus = os.cpus();
    const networkInterfaces = os.networkInterfaces();
    const interfaces: { name: string; address: string }[] = [];

    for (const [name, nets] of Object.entries(networkInterfaces)) {
      if (nets) {
        for (const net of nets) {
          if (net.family === 'IPv4' && !net.internal) {
            interfaces.push({ name, address: net.address });
          }
        }
      }
    }

    const diskUsage = await getDiskUsage();
    const cpuUsage = await getCpuUsage();
    const memoryUsage = process.memoryUsage();

    const status: SystemStatus = {
      timestamp: new Date().toISOString(),
      uptime: {
        system: os.uptime(),
        process: process.uptime(),
        formatted: formatUptime(os.uptime())
      },
      cpu: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
        usage: cpuUsage,
        loadAverage: os.loadavg()
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: Math.round((usedMem / totalMem) * 100 * 100) / 100
      },
      disk: diskUsage,
      node: {
        version: process.version,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        }
      },
      network: {
        hostname: os.hostname(),
        interfaces
      },
      platform: {
        type: os.type(),
        release: os.release(),
        arch: os.arch()
      }
    };

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Erro ao obter status do sistema:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
