import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJobDetails } from '../hooks/useJobs';
import { formatDateTime } from '@/utils/date';
import JobStatusBadge from './JobStatusBadge';
import JobProgress from './JobProgress';
import JobOutput from './JobOutput';

interface JobDetailsDrawerProps {
  jobId: string | null;
  onClose: () => void;
}

/**
 * Drawer lateral com detalhes completos de um Job.
 * Busca dados independentemente da tabela via GET /jobs/{job_id}.
 */
export const JobDetailsDrawer: React.FC<JobDetailsDrawerProps> = ({ jobId, onClose }) => {
  const { data: job, isPending, isError, refetch } = useJobDetails(jobId);

  const isOpen = jobId !== null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg transform border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Detalhes do Job</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-65px)] px-6 py-5 space-y-6">
          {isPending && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Carregando detalhes...</span>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <p className="text-sm text-muted-foreground">Erro ao carregar detalhes do job.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {job && !isPending && !isError && (
            <>
              {/* Informações Gerais */}
              <section className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Informações Gerais
                </h3>
                <div className="rounded-lg border border-border bg-muted/10 divide-y divide-border/50">
                  <DetailRow label="ID" value={
                    <span className="font-mono text-xs select-all" title={job.id}>{job.id}</span>
                  } />
                  <DetailRow label="Tipo" value={job.type} />
                  <DetailRow label="Status" value={<JobStatusBadge status={job.status} />} />
                  <DetailRow label="Container ID" value={job.container_id ?? '-'} />
                  <DetailRow label="Target Container" value={job.target_container || '-'} />
                  <DetailRow label="Progresso" value={
                    job.status === 'running' ? (
                      <div className="w-32">
                        <JobProgress progress={job.progress} status={job.status} />
                      </div>
                    ) : (
                      `${job.progress}%`
                    )
                  } />
                  <DetailRow label="Etapa Atual" value={job.current_step || '-'} />
                  <DetailRow label="Componente Atual" value={job.current_component || '-'} />
                  <DetailRow label="Criado em" value={formatDateTime(job.created_at)} />
                  <DetailRow label="Iniciado em" value={formatDateTime(job.started_at)} />
                  <DetailRow label="Finalizado em" value={
                    job.status === 'running'
                      ? <span className="text-blue-500 font-medium animate-pulse">Em execução...</span>
                      : formatDateTime(job.finished_at)
                  } />
                </div>
              </section>

              {/* Logs */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Logs
                </h3>

                <JobOutput title="Output" content={job.output} />
                <JobOutput title="Erro" content={job.error} />
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
};

/** Linha individual de detalhe no drawer */
const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right max-w-[60%] truncate">
      {value}
    </span>
  </div>
);

export default JobDetailsDrawer;
