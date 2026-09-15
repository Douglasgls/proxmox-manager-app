import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Power, RefreshCw, AlertTriangle, CheckCircle2, CloudOff } from 'lucide-react';
import { agentApi } from '@/api/modules/agentApi';
import { apiClient } from '@/api/client/ApiClient';
import { useCloudConnection } from '@/hooks/useCloudConnection';
import { UnlinkCloudDialog } from '@/components/cloud/UnlinkCloudDialog';

export const SystemActionsCard: React.FC = () => {
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartSuccess, setRestartSuccess] = useState<boolean | null>(null);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);

  const { status, unlink, isUnlinking } = useCloudConnection();
  const isRegistered = status?.registered ?? false;

  const handleRestartAPI = async () => {
    try {
      setIsRestarting(true);
      setRestartSuccess(null);

      // 1. Faz a chamada de restart usando o método que já inclui a autorização (via apiClient)
      await agentApi.restartAgent();

      // Aguarda 3 segundos iniciais de propósito para dar tempo da API "morrer" de vez
      await new Promise((resolve) => setTimeout(resolve, 3000));

      let apiVoltou = false;
      let tentativas = 0;
      const MAX_TENTATIVAS = 15; // Ex: Vai tentar 15 vezes (1 a cada 3 segundos)

      while (!apiVoltou && tentativas < MAX_TENTATIVAS) {
        try {
          tentativas++;
          
          // Tenta bater no endpoint de status
          // Usamos apiClient.get diretamente para não disparar toasts globais de erro (se o projeto tiver)
          await apiClient.get('/agent/status');
          
          // Se passou da linha acima sem dar catch, significa que a API voltou à vida!
          apiVoltou = true;

        } catch (error) {
          // Deu erro de conexão (a API ainda está desligada ou subindo).
          // Espera mais 3 segundos antes do while rodar de novo
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      setIsRestarting(false);
      
      if (apiVoltou) {
         setRestartSuccess(true);
         // Opcional: reload na página após alguns segundos para garantir estado limpo
         setTimeout(() => window.location.reload(), 2000);
      } else {
         setRestartSuccess(false);
      }

    } catch (error: any) {
      setIsRestarting(false);
      setRestartSuccess(false);
      if (error.response?.status === 401) {
         alert("Você não tem permissão ou precisa logar de novo para reiniciar a API.");
      }
    }
  };

  return (
    <>
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Power className="size-5 text-primary" />
            <CardTitle className="text-lg">Ações do Sistema</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4">
            {/* ─── Seção: Reiniciar API ─── */}
            <div className="flex items-start gap-3.5 p-4 rounded-xl border border-destructive/25 bg-destructive/5 dark:bg-destructive/10 text-foreground">
              <div className="p-2 rounded-lg bg-destructive/15 text-destructive shrink-0">
                <AlertTriangle className="size-4" />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-sm text-foreground">Reiniciar Servidor da API (Agent)</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Esta ação enviará um comando para desligar o backend imediatamente. O serviço (Docker/Systemd) precisará reiniciar o processo automaticamente. O painel ficará inacessível por alguns segundos.
                </p>
              </div>
            </div>

            {restartSuccess === true && (
              <Alert variant="success" className="border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <AlertTitle className="text-emerald-900 dark:text-emerald-300 font-semibold">
                  API reiniciada com sucesso!
                </AlertTitle>
                <AlertDescription className="text-emerald-800 dark:text-emerald-300/90 mt-1">
                  Tudo pronto. O painel será recarregado em instantes...
                </AlertDescription>
              </Alert>
            )}

            {restartSuccess === false && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>Erro ao reiniciar API</AlertTitle>
                <AlertDescription className="mt-1">
                  A API demorou muito para reiniciar ou houve falha de permissão. Verifique o servidor manualmente.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                disabled={isRestarting}
                onClick={handleRestartAPI}
                className="gap-2"
              >
                {isRestarting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Reiniciando... Aguarde...
                  </>
                ) : (
                  <>
                    <Power className="size-4" />
                    Reiniciar API
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ─── Seção: Desvincular da Cloud (apenas quando registrado) ─── */}
          {isRegistered && (
            <div className="flex flex-col gap-4 pt-2 border-t border-border/60">
              <div className="flex items-start gap-3.5 p-4 rounded-xl border border-destructive/25 bg-destructive/5 dark:bg-destructive/10 text-foreground">
                <div className="p-2 rounded-lg bg-destructive/15 text-destructive shrink-0">
                  <CloudOff className="size-4" />
                </div>
                <div className="space-y-1">
                  <h5 className="font-semibold text-sm text-foreground">Desvincular da Cloud</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Remove a integração entre este Agent e a Cloud. O ambiente desaparecerá do
                    painel da nuvem, mas nenhum dado local (LXC/Docker) será afetado.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  id="unlink-cloud-open-btn"
                  type="button"
                  variant="destructive"
                  disabled={isUnlinking}
                  onClick={() => setShowUnlinkDialog(true)}
                  className="gap-2"
                >
                  <CloudOff className="size-4" />
                  Desvincular da Cloud
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação (montado fora do Card para evitar conflitos de z-index) */}
      <UnlinkCloudDialog
        open={showUnlinkDialog}
        onClose={() => setShowUnlinkDialog(false)}
        onSuccess={() => setShowUnlinkDialog(false)}
        unlink={unlink}
        isUnlinking={isUnlinking}
      />
    </>
  );
};

export default SystemActionsCard;
