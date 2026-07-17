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
import { Check, Copy, AlertTriangle } from 'lucide-react';

interface AccessTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  expiresAt: string;
}

export const AccessTokenDialog: React.FC<AccessTokenDialogProps> = ({
  isOpen,
  onClose,
  token,
  expiresAt,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(token);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = token;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        textArea.remove();
        if (!successful) {
          throw new Error('execCommand copy failed');
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  const formattedDate = expiresAt 
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(expiresAt))
    : '-';

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acesso remoto habilitado</DialogTitle>
          <DialogDescription>
            Este token será exibido apenas <strong className="text-red-500">UMA</strong> vez.
            Guarde-o em local seguro.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-md relative flex items-center justify-between gap-4">
          <div className="font-mono text-sm break-all">
            {token}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
            title="Copiar Token"
          >
            {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
          </Button>
        </div>
        
        {copied && (
          <div className="text-sm text-green-500 mt-1 flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-top-1">
            <Check className="size-4" />
            Token copiado com sucesso!
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <AlertTriangle className="size-4 text-amber-500" />
          <span>Se você perder esse token deverá gerar outro.</span>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center sm:space-x-2 mt-4">
          <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
            Expira em: <span className="font-semibold text-foreground">{formattedDate}</span>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
