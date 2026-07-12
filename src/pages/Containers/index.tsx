import React, { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import type { ColumnDefinition } from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import type { Container } from '@/types/container';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/utils/bytes';
import { useContainers } from '@/hooks/useContainers';
import { containerApi } from '@/api/modules/containerApi';
import { useQuery } from '@tanstack/react-query';

export const Containers: React.FC = () => {
  const { containers, setContainers } = useContainers();

  // Carrega contêineres da API inicialmente
  const { data: apiContainers } = useQuery({
    queryKey: ['containers', 'list'],
    queryFn: async () => {
      const res = await containerApi.list();
      return res.data;
    },
  });

  useEffect(() => {
    if (apiContainers && apiContainers.length > 0) {
      setContainers(apiContainers);
    } else if (containers.length === 0) {
      // Insere dados simulados de fallback caso a store esteja vazia
      setContainers([
        {
          vmid: 100,
          name: 'srv-database-mysql',
          status: 'running',
          node: 'pve-node-01',
          type: 'lxc',
          uptime: 86400,
          cpu: 0.15,
          maxcpu: 2,
          mem: 2147483648,
          maxmem: 4294967296,
          disk: 10737418240,
          maxdisk: 53687091200,
          ipAddress: '192.168.100.10/24',
        },
        {
          vmid: 101,
          name: 'vm-ubuntu-k8s-master',
          status: 'running',
          node: 'pve-node-01',
          type: 'qemu',
          uptime: 172800,
          cpu: 0.45,
          maxcpu: 4,
          mem: 6442450944,
          maxmem: 8589934592,
          disk: 32212254720,
          maxdisk: 107374182400,
          ipAddress: '192.168.100.11/24',
        },
        {
          vmid: 102,
          name: 'srv-web-nginx',
          status: 'stopped',
          node: 'pve-node-01',
          type: 'lxc',
          uptime: 0,
          cpu: 0,
          maxcpu: 1,
          mem: 0,
          maxmem: 1073741824,
          disk: 2147483648,
          maxdisk: 21474836480,
          ipAddress: 'dhcp',
        },
      ]);
    }
  }, [apiContainers, containers.length, setContainers]);

  const columns: ColumnDefinition<Container>[] = [
    { header: 'VMID', accessor: 'vmid', className: 'w-16' },
    { header: 'Nome', accessor: 'name' },
    { header: 'Tipo', accessor: (row) => row.type.toUpperCase() },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge type="container" status={row.status} />,
    },
    {
      header: 'Memória',
      accessor: (row) => `${formatBytes(row.mem)} / ${formatBytes(row.maxmem)}`,
    },
    {
      header: 'Ações',
      accessor: () => (
        <div className="flex gap-2">
          <Button variant="outline" size="xs">
            Start
          </Button>
          <Button variant="destructive" size="xs">
            Stop
          </Button>
        </div>
      ),
      className: 'w-32 text-right',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Containers"
        description="Listagem de LXC no Cluster Proxmox."
        actions={<Button size="sm">Novo Container</Button>}
      />

      <DataTable data={containers} columns={columns} />
    </div>
  );
};
export default Containers;
