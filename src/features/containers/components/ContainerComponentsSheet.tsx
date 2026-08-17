import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ComponentSelector } from './ComponentSelector';
import { JobProgressTracker } from './JobProgressTracker';
import { useInstallComponents, useJobChannel } from '../hooks';
import type { ContainerComponentStatus, ComponentItem } from '../types';
import { normalizeCategory, sanitizeConfigForDisplay } from '../utils/componentSanitizer';
import {
  Package,
  X,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Layers,
  Check,
  Activity,
} from 'lucide-react';

interface ContainerComponentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  containerId: string | number;
  containerName: string;
  vmid?: number;
  components?: ContainerComponentStatus[];
}

export const ContainerComponentsSheet: React.FC<ContainerComponentsSheetProps> = ({
  isOpen,
  onClose,
  containerId,
  containerName,
  vmid,
  components = [],
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'installed' | 'install'>('installed');
  const [selectedNewComponents, setSelectedNewComponents] = useState<ComponentItem[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const installMutation = useInstallComponents();

  // WebSocket live channel for tracking active installation job
  const {
    jobStatus,
    isPending: isJobPending,
    isRunning: isJobRunning,
    isCompleted: isJobCompleted,
    isFailed: isJobFailed,
    elapsedSeconds,
  } = useJobChannel(activeJobId);

  // Invalida a query quando o Job finaliza com sucesso via WebSocket (sem necessidade de F5)
  useEffect(() => {
    if (isJobCompleted) {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      queryClient.invalidateQueries({ queryKey: ['containers', containerId] });
      queryClient.invalidateQueries({ queryKey: ['containers', containerId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['containers', 'inventory'] });
    }
  }, [isJobCompleted, containerId, queryClient]);

  const handleInstallNew = async () => {
    if (selectedNewComponents.length === 0) return;

    try {
      const result = await installMutation.mutateAsync({
        containerId,
        components: selectedNewComponents,
      });

      if (result && result.job_id) {
        setActiveJobId(result.job_id);
      }
    } catch (err: any) {
      console.error('[ContainerComponentsSheet] Error installing components:', err);
    }
  };

  const handleFinishTracking = () => {
    setActiveJobId(null);
    setSelectedNewComponents([]);
    setActiveTab('installed');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col',
          'bg-card border-l border-border shadow-2xl',
          'animate-in slide-in-from-right duration-300 ease-out'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                Componentes do Container
              </h2>
              <p className="text-xs text-muted-foreground">
                {containerName} {vmid ? `(#${vmid})` : ''}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Navigation Tabs (Only when not tracking active job) */}
        {!activeJobId && (
          <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-border/40 shrink-0 bg-muted/20">
            <button
              type="button"
              onClick={() => setActiveTab('installed')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                activeTab === 'installed'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Layers className="size-3.5" />
              Instalados ({components.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('install')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                activeTab === 'install'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Plus className="size-3.5" />
              Instalar Novos
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 space-y-4">
          {/* Real-time Job Progress Tracker View */}
          {activeJobId ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-medium">
                <Activity className="size-4 shrink-0" />
                <span>Instalação de componentes em andamento via WebSocket</span>
              </div>

              <JobProgressTracker
                jobStatus={jobStatus}
                isPending={isJobPending}
                isRunning={isJobRunning}
                isCompleted={isJobCompleted}
                isFailed={isJobFailed}
                elapsedSeconds={elapsedSeconds}
                onClose={handleFinishTracking}
              />
            </div>
          ) : (
            <>
              {installMutation.isError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2.5 text-xs font-medium animate-in fade-in duration-200">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Erro ao disparar instalação</span>
                    <span>
                      {(installMutation.error as any)?.response?.data?.detail ||
                        installMutation.error.message ||
                        'Falha na requisição.'}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 1: INSTALLED COMPONENTS */}
              {activeTab === 'installed' && (
                <div className="space-y-4">
                  {components.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl text-center space-y-3">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Package className="size-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Nenhum componente instalado</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                          Este container ainda não possui pacotes ou componentes adicionais instalados.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab('install')}
                        className="gap-1.5 mt-2"
                      >
                        <Plus className="size-3.5" />
                        Instalar Primeiro Componente
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {components.map((comp, idx) => {
                        const catNorm = normalizeCategory(comp.category);
                        const cleanConfig = sanitizeConfigForDisplay(comp.config);
                        const containerName = cleanConfig?.container_name;
                        const host = cleanConfig?.host ?? '0.0.0.0';
                        const hostPort = cleanConfig?.host_port;
                        const containerPort = cleanConfig?.container_port;
                        const restartPolicy = cleanConfig?.restart_policy;
                        const volumes = cleanConfig?.volumes;

                        return (
                          <div
                            key={`${comp.slug}-${idx}`}
                            className="p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-all space-y-3 shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-foreground">
                                    {comp.name || comp.slug}
                                  </span>
                                  {comp.installed_version && (
                                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      v{comp.installed_version}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                                  {catNorm === 'docker_apps' ? 'DOCKER APPS' : 'NATIVOS'}
                                </span>
                              </div>

                              {/* Status badge */}
                              {comp.status === 'PENDING' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <Clock className="size-3.5" />
                                  Pendente
                                </span>
                              )}
                              {comp.status === 'INSTALLING' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  <Loader2 className="size-3.5 animate-spin" />
                                  Instalando...
                                </span>
                              )}
                              {comp.status === 'INSTALLED' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="size-3.5" />
                                  Instalado
                                </span>
                              )}
                              {comp.status === 'FAILED' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                  <XCircle className="size-3.5" />
                                  Falhou
                                </span>
                              )}
                              {!['PENDING', 'INSTALLING', 'INSTALLED', 'FAILED'].includes(comp.status) && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                                  {comp.status}
                                </span>
                              )}
                            </div>

                            {/* Docker App Details */}
                            {catNorm === 'docker_apps' && cleanConfig && (
                              <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1.5 font-mono">
                                {containerName && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground font-sans font-medium">Container:</span>
                                    <span className="font-bold text-foreground">{containerName}</span>
                                  </div>
                                )}
                                {hostPort && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground font-sans font-medium">Porta:</span>
                                    <span className="font-bold text-primary">
                                      {host}:{hostPort} {containerPort ? `→ ${containerPort}` : ''}
                                    </span>
                                  </div>
                                )}
                                {restartPolicy && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground font-sans font-medium">Restart:</span>
                                    <span className="text-foreground">{restartPolicy}</span>
                                  </div>
                                )}
                                {volumes && volumes.length > 0 && (
                                  <div className="pt-1 border-t border-border/30">
                                    <span className="text-muted-foreground font-sans font-medium block mb-0.5">Volumes:</span>
                                    {volumes.map((vol, vIdx) => (
                                      <div key={vIdx} className="text-[11px] text-muted-foreground truncate" title={vol}>
                                        • {vol}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {comp.installed_at && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1 border-t border-border/30">
                                <Clock className="size-3" />
                                <span>Instalado em: {new Date(comp.installed_at).toLocaleString()}</span>
                              </div>
                            )}

                            {comp.status === 'FAILED' && comp.error && (
                              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-semibold">
                                  <AlertCircle className="size-3.5 shrink-0" />
                                  <span>Detalhes da Falha:</span>
                                </div>
                                <pre className="text-[11px] font-mono whitespace-pre-wrap break-all leading-tight bg-background/60 p-2 rounded border border-red-500/10 max-h-32 overflow-y-auto">
                                  {comp.error}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INSTALL NEW COMPONENTS */}
              {activeTab === 'install' && (
                <div className="space-y-4">
                  <ComponentSelector
                    selected={selectedNewComponents}
                    onChange={setSelectedNewComponents}
                    installedComponents={components}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Sheet Footer (Only for Install Tab when not tracking job) */}
        {!activeJobId && activeTab === 'install' && (
          <div className="p-4 border-t border-border/50 bg-muted/30 shrink-0 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {selectedNewComponents.length === 0
                ? 'Nenhum novo componente selecionado'
                : `${selectedNewComponents.length} componente(s) selecionado(s)`}
            </span>

            <Button
              size="sm"
              onClick={handleInstallNew}
              disabled={selectedNewComponents.length === 0 || installMutation.isPending}
              className="gap-1.5"
            >
              {installMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Disparando...
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  Instalar Selecionados
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
