import React, { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import type { ColumnDefinition } from '@/components/common/DataTable';
import type { ProxmoxNode, StorageResource, NetworkInterface } from '@/types/inventory';
import { formatBytes } from '@/utils/bytes';
import { formatUptime } from '@/utils/date';
import { Server, Database, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'storages' | 'networks'>('nodes');

  // Mocks de dados
  const mockNodes: ProxmoxNode[] = [
    {
      node: 'pve-node-01',
      status: 'online',
      cpuUsage: 0.28,
      memoryUsage: 25769803776,
      memoryTotal: 68719476736,
      diskUsage: 450000000000,
      diskTotal: 1000000000000,
      uptime: 345600,
    },
  ];

  const mockStorages: StorageResource[] = [
    {
      storage: 'local',
      node: 'pve-node-01',
      type: 'dir',
      shared: false,
      active: true,
      used: 50000000000,
      total: 100000000000,
    },
    {
      storage: 'local-lvm',
      node: 'pve-node-01',
      type: 'lvmthin',
      shared: false,
      active: true,
      used: 400000000000,
      total: 900000000000,
    },
  ];

  const mockNetworks: NetworkInterface[] = [
    {
      iface: 'vmbr0',
      node: 'pve-node-01',
      type: 'bridge',
      active: true,
      address: '192.168.100.2',
      netmask: '255.255.255.0',
      gateway: '192.168.100.1',
      ports: 'eno1',
    },
  ];

  const nodeColumns: ColumnDefinition<ProxmoxNode>[] = [
    { header: 'Nó / Servidor', accessor: 'node' },
    {
      header: 'Status',
      accessor: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            row.status === 'online'
              ? 'text-green-500 bg-green-50 dark:bg-green-950/20 border-green-200'
              : 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200'
          }`}
        >
          {row.status.toUpperCase()}
        </span>
      ),
    },
    { header: 'CPU', accessor: (row) => `${(row.cpuUsage * 100).toFixed(1)}%` },
    {
      header: 'Memória',
      accessor: (row) => `${formatBytes(row.memoryUsage)} / ${formatBytes(row.memoryTotal)}`,
    },
    { header: 'Uptime', accessor: (row) => formatUptime(row.uptime) },
  ];

  const storageColumns: ColumnDefinition<StorageResource>[] = [
    { header: 'Armazenamento', accessor: 'storage' },
    { header: 'Tipo', accessor: (row) => row.type.toUpperCase() },
    { header: 'Compartilhado', accessor: (row) => (row.shared ? 'Sim' : 'Não') },
    {
      header: 'Espaço',
      accessor: (row) => `${formatBytes(row.used)} / ${formatBytes(row.total)}`,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`text-xs font-bold ${row.active ? 'text-green-500' : 'text-red-500'}`}>
          {row.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ];

  const networkColumns: ColumnDefinition<NetworkInterface>[] = [
    { header: 'Interface', accessor: 'iface' },
    { header: 'Tipo', accessor: (row) => row.type.toUpperCase() },
    { header: 'Endereço IP', accessor: (row) => row.address || '-' },
    { header: 'Gateway', accessor: (row) => row.gateway || '-' },
    { header: 'Portas Físicas', accessor: (row) => row.ports || '-' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventário de Recursos"
        description="Exploração e acompanhamento de servidores, storages e configurações de rede física."
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-px">
        <Button
          variant={activeTab === 'nodes' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('nodes')}
          className="gap-2 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
          data-state={activeTab === 'nodes' ? 'active' : ''}
        >
          <Server className="size-4" />
          Servidores (Nodes)
        </Button>
        <Button
          variant={activeTab === 'storages' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('storages')}
          className="gap-2 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
          data-state={activeTab === 'storages' ? 'active' : ''}
        >
          <Database className="size-4" />
          Armazenamento (Storages)
        </Button>
        <Button
          variant={activeTab === 'networks' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('networks')}
          className="gap-2 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
          data-state={activeTab === 'networks' ? 'active' : ''}
        >
          <Network className="size-4" />
          Interfaces de Rede
        </Button>
      </div>

      {/* Renderização da tabela baseada na aba ativa */}
      <div className="mt-4 animate-in fade-in duration-200">
        {activeTab === 'nodes' && <DataTable data={mockNodes} columns={nodeColumns} />}
        {activeTab === 'storages' && <DataTable data={mockStorages} columns={storageColumns} />}
        {activeTab === 'networks' && <DataTable data={mockNetworks} columns={networkColumns} />}
      </div>
    </div>
  );
};
export default Inventory;
