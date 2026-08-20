import React, { useState } from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Network } from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';

interface TailscaleAddressProps {
  tailscaleIp?: string | null;
  className?: string;
}

export const parseTailscaleIp = (rawIp?: string | null) => {
  if (!rawIp) return { ipv4: null, ipv6: null };

  const lines = rawIp
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  let ipv4: string | null = null;
  let ipv6: string | null = null;

  lines.forEach((line) => {
    if (line.includes(':')) {
      ipv6 = line;
    } else if (line.includes('.')) {
      ipv4 = line;
    }
  });

  return {
    ipv4: ipv4 || lines[0] || null,
    ipv6,
  };
};

export const TailscaleAddress: React.FC<TailscaleAddressProps> = ({ tailscaleIp, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const { ipv4, ipv6 } = parseTailscaleIp(tailscaleIp);

  if (!ipv4 && !ipv6) {
    return <span className="text-xs text-muted-foreground font-mono">-</span>;
  }

  const primaryIp = ipv4 || ipv6 || '';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullText = [ipv4, ipv6].filter(Boolean).join('\n');
    const success = await copyToClipboard(fullText, 'Endereço IP Tailscale');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tooltipContent = (
    <div className="space-y-1.5 p-1 text-xs">
      <div className="flex items-center gap-1.5 font-semibold border-b border-border/60 pb-1">
        <Network className="size-3.5 text-primary" />
        <span>Endereços Tailscale VPN</span>
      </div>
      {ipv4 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">IPv4:</span>
          <span className="font-mono font-medium text-foreground">{ipv4}</span>
        </div>
      )}
      {ipv6 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">IPv6:</span>
          <span className="font-mono font-medium text-foreground text-[11px]">{ipv6}</span>
        </div>
      )}
      <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/40 text-center">
        Clique no ícone para copiar
      </div>
    </div>
  );

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="font-mono text-xs font-semibold text-foreground tracking-tight">
        {primaryIp}
      </span>

      {ipv6 && (
        <Tooltip content={tooltipContent} side="top">
          <Badge
            variant="secondary"
            className="h-4 px-1 text-[10px] font-mono cursor-pointer hover:bg-secondary/80 transition-colors"
          >
            +IPv6
          </Badge>
        </Tooltip>
      )}

      <Tooltip content={copied ? 'Copiado!' : 'Copiar IP'} side="top">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6 p-0 h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          aria-label="Copiar endereço IP"
        >
          {copied ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </Tooltip>
    </div>
  );
};

export default TailscaleAddress;
