import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CloudOff,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  WifiOff,
} from 'lucide-react';
import { useToastStore } from '@/utils/clipboard';
import { extractErrorMessage } from '@/utils/error';
import type { CloudUnlinkResponse } from '@/api/modules/cloudApi';

interface UnlinkCloudDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Função de desvínculo exposta pelo useCloudConnection */
  unlink: (force?: boolean) => Promise<CloudUnlinkResponse>;
  isUnlinking: boolean;
}

type Stage = 'confirm' | 'force';

export const UnlinkCloudDialog: React.FC<UnlinkCloudDialogProps> = ({
  open,
  onClose,
  onSuccess,
  unlink,
  isUnlinking,
}) => {
  const [stage, setStage] = useState<Stage>('confirm');
  const [forceErrorDetail, setForceErrorDetail] = useState<string>('');
  const showToast = useToastStore((s) => s.showToast);

  /** Reseta o estado interno ao fechar */
  const handleClose = () => {
    if (isUnlinking) return; // bloqueia fechar durante loading
    setStage('confirm');
    setForceErrorDetail('');
    onClose();
  };

  /** Tentativa inicial SEM force */
  const handleConfirm = async () => {
    try {
      const result = await unlink(false);
      handleUnlinkSuccess(result);
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status;
      if (status === 400) {
        // A Cloud não pôde ser contactada → avança para estágio de força
        const detail = extractErrorMessage(
          err,
          'Falha ao comunicar com a Cloud remota.',
        );
        setForceErrorDetail(detail);
        setStage('force');
      } else {
        // Erro inesperado
        showToast(
          extractErrorMessage(err, 'Ocorreu um erro inesperado. Tente novamente.'),
          'error',
        );
      }
    }
  };

  /** Tentativa com force=true (medida de recuperação) */
  const handleForceConfirm = async () => {
    try {
      const result = await unlink(true);
      handleUnlinkSuccess(result);
    } catch (err: any) {
      showToast(
        extractErrorMessage(err, 'Falha ao forçar o desvínculo. Verifique a API local.'),
        'error',
      );
    }
  };

  const handleUnlinkSuccess = (result: CloudUnlinkResponse) => {
    if (result.cloud_cleanup) {
      showToast('Agente desvinculado de todas as plataformas!', 'success');
    } else {
      showToast(
        'Desvinculado localmente. A Cloud pode não ter sido limpa automaticamente — verifique o painel web.',
        'info',
      );
    }
    setStage('confirm');
    setForceErrorDetail('');
    onSuccess();
  };

  const handleForceCancel = () => {
    showToast('Ação de desvínculo cancelada.', 'info');
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent showCloseButton={!isUnlinking} className="sm:max-w-md">
        {/* ─── ESTÁGIO 1: Confirmação inicial ─── */}
        {stage === 'confirm' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 rounded-xl bg-destructive/15 text-destructive">
                  <CloudOff className="size-5" />
                </div>
                <DialogTitle className="text-base font-semibold leading-tight">
                  Desvincular da Cloud?
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm leading-relaxed">
                Esta ação irá remover a integração entre este Agent e a Cloud. O ambiente
                desaparecerá do painel da nuvem.
              </DialogDescription>
            </DialogHeader>

            <Alert className="border-amber-500/30 bg-amber-500/8 mt-1">
              <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                <span className="font-semibold">Nenhum dado local será perdido.</span> Seus
                containers LXC e VMs continuam intactos. Apenas o vínculo com a Cloud será
                desfeito.
              </AlertDescription>
            </Alert>

            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isUnlinking}
              >
                Cancelar
              </Button>
              <Button
                id="unlink-cloud-confirm-btn"
                variant="destructive"
                size="sm"
                onClick={handleConfirm}
                disabled={isUnlinking}
                className="gap-2"
              >
                {isUnlinking ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Desvinculando...
                  </>
                ) : (
                  <>
                    <CloudOff className="size-3.5" />
                    Sim, Desvincular
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ─── ESTÁGIO 2: Força após erro 400 ─── */}
        {stage === 'force' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 rounded-xl bg-orange-500/15 text-orange-500">
                  <WifiOff className="size-5" />
                </div>
                <DialogTitle className="text-base font-semibold leading-tight">
                  Cloud inacessível
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm leading-relaxed">
                Não foi possível contatar a Cloud para confirmar a exclusão. O ambiente pode
                continuar aparecendo no painel remoto.
              </DialogDescription>
            </DialogHeader>

            {forceErrorDetail && (
              <Alert className="border-destructive/30 bg-destructive/8 mt-1">
                <AlertTriangle className="size-4 text-destructive" />
                <AlertDescription className="text-xs text-destructive/90 font-mono leading-relaxed break-all">
                  {forceErrorDetail}
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-orange-500/30 bg-orange-500/8">
              <ShieldAlert className="size-4 text-orange-500" />
              <AlertDescription className="text-xs text-orange-800 dark:text-orange-300/90 leading-relaxed">
                Deseja <span className="font-semibold">forçar o desvínculo local</span>{' '}
                mesmo assim? O Agent será desregistrado localmente, mas pode ser necessário
                excluí-lo manualmente no painel web da Cloud.
              </AlertDescription>
            </Alert>

            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceCancel}
                disabled={isUnlinking}
              >
                Cancelar
              </Button>
              <Button
                id="unlink-cloud-force-btn"
                variant="destructive"
                size="sm"
                onClick={handleForceConfirm}
                disabled={isUnlinking}
                className="gap-2 bg-orange-600 hover:bg-orange-700 border-orange-600"
              >
                {isUnlinking ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Forçando...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-3.5" />
                    Sim, Forçar Desvínculo
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UnlinkCloudDialog;
