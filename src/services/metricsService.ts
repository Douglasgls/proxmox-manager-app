import type { ProxmoxNode } from '@/types/inventory';
import type { Container } from '@/types/container';

export const metricsService = {
  /**
   * Calcula o uso agregado de recursos de uma lista de nós do cluster.
   */
  calculateClusterAggregates: (nodes: ProxmoxNode[]) => {
    if (!nodes || nodes.length === 0) {
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        memoryTotal: 0,
        diskUsage: 0,
        diskTotal: 0,
        onlineNodes: 0,
        totalNodes: 0,
      };
    }

    let totalCpuUsageSum = 0;
    let totalMemUsed = 0;
    let totalMemMax = 0;
    let totalDiskUsed = 0;
    let totalDiskMax = 0;
    let onlineCount = 0;

    nodes.forEach((node) => {
      if (node.status === 'online') {
        onlineCount++;
        totalCpuUsageSum += node.cpuUsage;
      }
      totalMemUsed += node.memoryUsage;
      totalMemMax += node.memoryTotal;
      totalDiskUsed += node.diskUsage;
      totalDiskMax += node.diskTotal;
    });

    const activeNodesCount = onlineCount || 1; // evita divisao por zero

    return {
      cpuUsage: totalCpuUsageSum / activeNodesCount,
      memoryUsage: totalMemMax > 0 ? (totalMemUsed / totalMemMax) : 0,
      memoryTotal: totalMemMax,
      memoryUsed: totalMemUsed,
      diskUsage: totalDiskMax > 0 ? (totalDiskUsed / totalDiskMax) : 0,
      diskTotal: totalDiskMax,
      diskUsed: totalDiskUsed,
      onlineNodes: onlineCount,
      totalNodes: nodes.length,
    };
  },

  /**
   * Agrupa containers por status (running, stopped, etc.) e calcula alocações totais.
   */
  summarizeContainers: (containers: Container[]) => {
    const summary = {
      total: containers.length,
      running: 0,
      stopped: 0,
      paused: 0,
      unknown: 0,
      totalCores: 0,
      totalMemory: 0,
      totalDisk: 0,
    };

    containers.forEach((c) => {
      summary[c.status]++;
      summary.totalCores += c.maxcpu;
      summary.totalMemory += c.maxmem;
      summary.totalDisk += c.maxdisk;
    });

    return summary;
  },

  /**
   * Converte a velocidade de rede instantânea (bytes) em formato de taxa de transferência (ex: MB/s).
   */
  formatNetworkSpeed: (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    const kbps = bytesPerSecond / 1024;
    if (kbps < 1024) return `${kbps.toFixed(1)} KB/s`;
    const mbps = kbps / 1024;
    return `${mbps.toFixed(1)} MB/s`;
  },
};
