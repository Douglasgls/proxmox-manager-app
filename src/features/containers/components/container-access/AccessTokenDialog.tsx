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
import { Check, Copy, AlertTriangle, Terminal, KeyRound } from 'lucide-react';
import { useToastStore } from '@/utils/clipboard';

interface AccessTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  expiresAt: string;
  tailscaleIp?: string | null;
}

export const AccessTokenDialog: React.FC<AccessTokenDialogProps> = ({
  isOpen,
  onClose,
  token,
  expiresAt,
  tailscaleIp,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const copyText = async (text: string, isCmd: boolean = false) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      if (isCmd) {
        setCopiedCmd(true);
        useToastStore.getState().showToast('Comando copiado!', 'success');
        setTimeout(() => setCopiedCmd(false), 2500);
      } else {
        setCopiedToken(true);
        useToastStore.getState().showToast('Token copiado com sucesso!', 'success');
        setTimeout(() => setCopiedToken(false), 2500);
      }
    } catch {
      useToastStore.getState().showToast('Falha ao copiar texto.', 'error');
    }
  };

  const formattedDate = expiresAt 
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(expiresAt))
    : '-';

  const sshCommand = tailscaleIp ? `ssh root@${tailscaleIp}` : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
              <KeyRound className="size-4" />
            </div>
            <DialogTitle>Token de Acesso Gerado</DialogTitle>
          </div>
          <DialogDescription>
            Este token será exibido apenas <strong className="text-red-500">UMA</strong> vez.
            Guarde-o em um local seguro.
          </DialogDescription>
        </DialogHeader>

        {/* Bloco do Token */}
        <div className="space-y-1.5 mt-2">
          <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>CHAVE SECRETA DO TOKEN</span>
            <span className="text-[11px] font-normal text-muted-foreground">Expira em: <strong className="text-foreground">{formattedDate}</strong></span>
          </label>
          <div className="bg-muted p-3.5 rounded-lg border border-border relative flex items-center justify-between gap-3">
            <div className="font-mono text-xs break-all text-foreground select-all">
              {token}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyText(token, false)}
              className="shrink-0 size-8 cursor-pointer"
              title="Copiar Token"
            >
              {copiedToken ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Guia Rápido de Conexão */}
        <div className="space-y-1.5 mt-3 pt-3 border-t border-border">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Terminal className="size-3.5 text-primary" />
            <span>GUIA RÁPIDO DE CONEXÃO</span>
          </label>

          {sshCommand ? (
            <div className="bg-muted/70 p-2.5 rounded-md border border-border/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs text-muted-foreground font-mono shrink-0">$</span>
                <span className="font-mono text-xs text-foreground truncate">{sshCommand}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyText(sshCommand, true)}
                className="h-7 px-2 text-xs gap-1 shrink-0 cursor-pointer"
              >
                {copiedCmd ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                {copiedCmd ? 'Copiado' : 'Copiar SSH'}
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-md border border-border/60">
              Utilize este token no cabeçalho <code className="text-foreground font-mono bg-muted px-1 py-0.5 rounded">Authorization: Bearer &lt;TOKEN&gt;</code> ou através do cliente seguro da nuvem.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-md border border-amber-500/20 mt-1">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Se você perder esse token, precisará revogá-lo e gerar outro.</span>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Concluir e Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
