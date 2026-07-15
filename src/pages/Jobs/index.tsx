import React, { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { RefreshCw, ClipboardList } from 'lucide-react';
import { useJobsList } from './hooks/useJobs';
import JobsTable from './components/JobsTable';
import JobDetailsDrawer from './components/JobDetailsDrawer';

export const Jobs: React.FC = () => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const {
    data: jobs,
    isPending,
    isError,
    error,
    refetch,
  } = useJobsList();

  const handleViewDetails = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const handleCloseDrawer = () => {
    setSelectedJobId(null);
  };

  // Estado de Loading
  if (isPending && !jobs) {
    return <Loading message="Carregando histórico de tarefas..." />;
  }

  // Estado de Erro
  if (isError) {
    const errorMsg = error instanceof Error
      ? error.message
      : 'Falha ao carregar o histórico de tarefas.';
    return (
      <div className="space-y-6">
        <PageHeader
          title="Histórico de Tarefas (Jobs)"
          description="Acompanhamento e logs de tarefas assíncronas executadas pela plataforma."
        />
        <Error
          title="Erro ao carregar dados"
          message={errorMsg}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const jobsList = jobs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de Tarefas (Jobs)"
        description="Acompanhamento e logs de tarefas assíncronas executadas pela plataforma."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Recarregar
          </Button>
        }
      />

      {jobsList.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa encontrada"
          description="Não há tarefas registradas no momento. As tarefas aparecerão aqui conforme forem executadas."
          icon={<ClipboardList className="size-8" />}
          action={<Button onClick={() => refetch()}>Recarregar dados</Button>}
        />
      ) : (
        <JobsTable
          data={jobsList}
          isLoading={isPending}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Drawer de detalhes */}
      <JobDetailsDrawer
        jobId={selectedJobId}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default Jobs;
