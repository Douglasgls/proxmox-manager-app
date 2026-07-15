import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobOutputProps {
  title: string;
  content: string;
}

/**
 * Bloco de log com fonte monoespaçada, scroll e botão de copiar.
 * Usado para exibir output e error de um Job.
 */
export const JobOutput: React.FC<JobOutputProps> = ({ title, content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  };

  const isEmpty = !content || content.trim() === '';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {!isEmpty && (
          <Button
            variant="ghost"
            size="xs"
            onClick={handleCopy}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="size-3 text-green-500" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="size-3" />
                Copiar
              </>
            )}
          </Button>
        )}
      </div>

      {isEmpty ? (
        <p className="text-sm text-muted-foreground italic py-3">
          Nenhuma informação disponível.
        </p>
      ) : (
        <div className="relative rounded-lg border border-border bg-muted/30 dark:bg-black/30 overflow-hidden">
          <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
};

export default JobOutput;
