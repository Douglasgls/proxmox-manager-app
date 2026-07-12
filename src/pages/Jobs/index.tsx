import React, { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import type { ColumnDefinition } from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import type { Job } from '@/types/job';
import { formatDateTime } from '@/utils/date';
import { Button } from '@/components/ui/button';
import { useJobs } from '@/hooks/useJobs';
import { jobApi } from '@/api/modules/jobApi';
import { useQuery } from '@tanstack/react-query';

export const Jobs: React.FC = () => {
  const { jobs, setJobs } = useJobs();

  // Carrega os jobs inicialmente da API
  const { data: apiJobs } = useQuery({
    queryKey: ['jobs', 'list'],
    queryFn: async () => {
      const res = await jobApi.list();
      return res.data;
    },
  });

  useEffect(() => {
    if (apiJobs && apiJobs.length > 0) {
      setJobs(apiJobs);
    } else if (jobs.length === 0) {
      // Insere dados simulados de fallback caso a store esteja vazia
      setJobs([
        {
          id: '1',
          upid: 'UPID:pve-node-01:00001A2B:0034B5C6:65E12F00:vzstart:100:root@pam:',
          node: 'pve-node-01',
          user: 'root@pam',
          type: 'vzstart',
          status: 'done',
          starttime: 1718042400,
          endtime: 1718042415,
        },
        {
          id: '2',
          upid: 'UPID:pve-node-01:00001A2C:0034B5D7:65E12F10:qmigrate:101:root@pam:',
          node: 'pve-node-01',
          user: 'root@pam',
          type: 'qmigrate',
          status: 'running',
          starttime: 1718043500,
          progress: 68,
        },
        {
          id: '3',
          upid: 'UPID:pve-node-01:00001A2D:0034B5E8:65E12F20:qmclone:102:user@pve:',
          node: 'pve-node-01',
          user: 'user@pve',
          type: 'qmclone',
          status: 'failed',
          exitstatus: 'clone failed: disk is locked',
          starttime: 1718041000,
          endtime: 1718041120,
        },
      ]);
    }
  }, [apiJobs, jobs.length, setJobs]);

  const columns: ColumnDefinition<Job>[] = [
    { header: 'UPID / ID da Tarefa', accessor: (row) => <span className="font-mono text-xs">{row.upid.slice(0, 45)}...</span> },
    { header: 'Nó', accessor: 'node', className: 'w-24' },
    { header: 'Usuário', accessor: 'user', className: 'w-32' },
    { header: 'Operação', accessor: 'type', className: 'w-28' },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge type="job" status={row.status} />,
      className: 'w-32',
    },
    {
      header: 'Início',
      accessor: (row) => formatDateTime(row.starttime),
      className: 'w-44',
    },
    {
      header: 'Detalhes',
      accessor: () => (
        <Button variant="ghost" size="xs">
          Ver Log
        </Button>
      ),
      className: 'w-24 text-right',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de Tarefas (Jobs)"
        description="Acompanhamento e logs de tarefas assíncronas executadas no cluster."
      />

      <DataTable data={jobs} columns={columns} />
    </div>
  );
};
export default Jobs;
