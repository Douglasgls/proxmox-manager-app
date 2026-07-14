import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContainerConsole } from './useContainerConsole';
import { useContainerInventoryById } from '@/features/containers/hooks';
import Terminal from '@/components/terminal/Terminal';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { ArrowLeft, RefreshCw, Terminal as TerminalIcon } from 'lucide-react';
import Loading from '@/components/common/Loading';

export const ContainerConsole: React.FC = () => {
  const { containerId } = useParams<{ containerId: string }>();
  const id = containerId || '';

  // Busca dados do inventário do container para exibir no topo
  const { data: inventory, isPending: isInventoryLoading } = useContainerInventoryById(id);

  const {
    status,
    error,
    connect,
    handleData,
    handleResize,
    terminalRef,
  } = useContainerConsole(id);

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] space-y-4">
      {/* Barra de Navegação e Status */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/40 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to={`/app/containers/${id}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TerminalIcon className="size-4 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none">
                {isInventoryLoading ? 'Carregando...' : `Console: ${inventory?.name || 'LXC'}`}
              </h1>
              {inventory?.container_id && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  LXC ID: #{inventory.container_id}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {inventory && (
            <div className="flex items-center gap-2 text-xs bg-muted/40 px-3 py-1 rounded-full border border-border/50">
              <span className="text-muted-foreground font-medium">Status:</span>
              <StatusBadge type="container" status={inventory.status} />
            </div>
          )}

          {status === 'disconnected' && (
            <Button variant="outline" size="sm" onClick={connect} className="gap-1.5 text-xs h-8">
              <RefreshCw className="size-3.5" />
              Reconnect
            </Button>
          )}
        </div>
      </div>

      {/* Janela de Emulação de Terminal */}
      <div className="flex-1 min-h-0 relative flex flex-col bg-[#0c0f12] rounded-xl border border-border shadow-2xl">
        {status === 'connecting' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0c0f12]/95 backdrop-blur-xs rounded-xl">
            <Loading message="Connecting..." />
          </div>
        )}

        {status === 'disconnected' && error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-destructive/10 border border-destructive/20 text-destructive-foreground dark:text-red-400 px-4 py-2 rounded-lg text-xs flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <Terminal
          onData={handleData}
          onResize={handleResize}
          terminalRef={terminalRef}
        />
      </div>
    </div>
  );
};
export default ContainerConsole;
