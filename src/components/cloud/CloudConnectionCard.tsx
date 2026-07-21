import React, { useState, useEffect } from 'react';
import { useCloudConnection } from '@/hooks/useCloudConnection';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Cloud, CloudOff, CloudAlert, RefreshCw, KeyRound, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

// Auxiliar para formatar a duração em formato HH:MM:SS
const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const CloudConnectionCard: React.FC = () => {
  const {
    status,
    isLoading,
    register,
    isRegistering,
    registerError,
    reconnect,
    isReconnecting,
    reconnectError,
  } = useCloudConnection();

  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [connectedTimeSeconds, setConnectedTimeSeconds] = useState(0);

  const registered = status?.registered ?? false;
  const connected = status?.connected ?? false;
  const isConnecting = isReconnecting;

  // Timer local para calcular "Conectado há" enquanto estiver online
  useEffect(() => {
    let interval: any = null;
    if (connected) {
      interval = setInterval(() => {
        setConnectedTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setConnectedTimeSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connected]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setTokenError('Por favor, informe o Environment Token.');
      return;
    }
    setTokenError(null);
    try {
      await register(tokenInput.trim());
      setTokenInput('');
    } catch (err: any) {
      setTokenError(err?.response?.data?.detail || err?.message || 'Erro ao registrar token.');
    }
  };

  const handleReconnect = async () => {
    try {
      await reconnect();
    } catch (err) {
      console.error('[CloudConnectionCard] Reconnect failed', err);
    }
  };

  // Determina texto e variante do badge indicador no Header
  const getHeaderIndicator = () => {
    if (isConnecting) {
      return {
        variant: 'warning' as const,
        label: 'Reconectando...',
        dotColor: 'bg-amber-500 animate-pulse',
        icon: <RefreshCw className="size-3.5 animate-spin text-amber-500" />,
      };
    }
    if (!registered) {
      return {
        variant: 'unregistered' as const,
        label: 'Não registrado',
        dotColor: 'bg-slate-400',
        icon: <CloudOff className="size-3.5 text-slate-400" />,
      };
    }
    if (connected) {
      return {
        variant: 'success' as const,
        label: 'Online',
        dotColor: 'bg-emerald-500',
        icon: <Cloud className="size-3.5 text-emerald-500" />,
      };
    }
    return {
      variant: 'offline' as const,
      label: 'Offline',
      dotColor: 'bg-red-500',
      icon: <CloudAlert className="size-3.5 text-red-500" />,
    };
  };

  const indicator = getHeaderIndicator();

  // Conteúdo do Tooltip ao passar o mouse sobre o indicador
  const tooltipContent = (
    <div className="flex flex-col gap-1 py-0.5">
      <div className="flex items-center justify-between gap-4 font-semibold border-b border-border/50 pb-1">
        <span>☁ Cloud</span>
        <span className="text-[10px] text-muted-foreground">Status</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="text-muted-foreground">Status:</span>
        <span className="font-medium text-foreground">{indicator.label}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="text-muted-foreground">Último Ping:</span>
        <span className="font-medium text-foreground">{connected ? (status?.last_ping || '2 s') : '--'}</span>
      </div>
      <div className="mt-1 pt-1 border-t border-border/40 text-[10px] text-primary font-medium text-center">
        Clique para detalhes
      </div>
    </div>
  );

  return (
    <Popover>
      <Tooltip content={tooltipContent} side="bottom">
        <PopoverTrigger className="outline-none">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/80 bg-background/80 hover:bg-muted/60 transition-all shadow-xs cursor-pointer select-none">
            {indicator.icon}
            <span className="text-xs font-medium text-foreground">Cloud</span>
            <Badge variant={indicator.variant} className="h-5 px-1.5 text-[10px] font-semibold gap-1">
              <span className={`size-1.5 rounded-full ${indicator.dotColor}`} />
              {indicator.label}
            </Badge>
          </div>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent align="end" className="w-80 p-4 rounded-xl border border-border bg-card shadow-xl">
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Cloud className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground leading-none">Cloud Connection</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Monitor de integração do Agent</p>
            </div>
          </div>
          {isLoading && <RefreshCw className="size-3.5 text-muted-foreground animate-spin" />}
        </div>

        <Separator className="my-3" />

        {/* ESTADO 1: Ambiente não registrado */}
        {!registered && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
              Este ambiente ainda não foi registrado.
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-muted-foreground" />
                  Environment Token
                </label>
                <Input
                  type="password"
                  placeholder="Insira seu Environment Token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  disabled={isRegistering}
                  className="h-8 text-xs font-mono"
                />
              </div>

              {(tokenError || registerError) && (
                <p className="text-[11px] text-destructive">
                  {tokenError || (registerError as any)?.response?.data?.detail || 'Falha no registro.'}
                </p>
              )}

              <Button
                type="submit"
                size="sm"
                className="w-full h-8 text-xs font-medium"
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="size-3 animate-spin mr-1.5" />
                    Registrando...
                  </>
                ) : (
                  'Registrar'
                )}
              </Button>
            </form>
          </div>
        )}

        {/* ESTADO 2: Registrado porém Desconectado */}
        {registered && !connected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">Status</span>
                <Badge variant="offline" className="mt-1 h-5 text-[10px] px-1.5 gap-1">
                  <span className="size-1.5 rounded-full bg-red-500" />
                  Offline
                </Badge>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">JWT</span>
                <span className="text-xs font-semibold text-emerald-500 mt-1 flex items-center gap-1">
                  <ShieldCheck className="size-3.5" />
                  {status?.jwt_valid === false ? 'Expirado' : 'Válido'}
                </span>
              </div>
            </div>

            {(reconnectError as any) && (
              <p className="text-[11px] text-destructive text-center">
                {(reconnectError as any)?.response?.data?.detail || 'Erro ao tentar reconectar.'}
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="w-full h-8 text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
            >
              {isReconnecting ? (
                <>
                  <RefreshCw className="size-3 animate-spin mr-1.5 text-primary" />
                  Reconectando...
                </>
              ) : (
                'Reconectar'
              )}
            </Button>
          </div>
        )}

        {/* ESTADO 3: Conectado (Online) */}
        {registered && connected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium uppercase tracking-wider">Status</span>
                <Badge variant="success" className="mt-1 h-5 text-[10px] px-1.5 gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Online
                </Badge>
              </div>

              <div className="p-2 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">Último Ping</span>
                <span className="text-xs font-semibold text-foreground mt-1 flex items-center gap-1">
                  <Activity className="size-3.5 text-primary" />
                  {status?.last_ping}
                </span>
              </div>
            </div>

            {/* <div className="flex items-center justify-between text-xs px-2.5 py-2 rounded-lg bg-muted/30 border border-border/60">
              <span className="text-muted-foreground font-medium">Conectado há</span>
              <span className="font-mono font-semibold text-foreground tracking-tight">
                {formatDuration(connectedTimeSeconds)}
              </span>
            </div> */}

            <div className="">
              <Card className="shadow-none border border-border/60 bg-muted/20">
                <CardContent className="p-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">Cloud</span>
                  <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    {status?.connected ? 'Conectado' : 'Desconectado'}
                  </span>
                </CardContent>
              </Card>

              {/*<Card className="shadow-none border border-border/60 bg-muted/20">
                <CardContent className="p-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">Agent</span>
                  <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    Online
                  </span>
                </CardContent>
              </Card> */}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default CloudConnectionCard;
