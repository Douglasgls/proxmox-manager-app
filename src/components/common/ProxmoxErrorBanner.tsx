import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProxmoxErrorStore } from '@/stores/proxmoxErrorStore';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  X, 
  KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const ProxmoxErrorBanner: React.FC = () => {
  const { error, isDismissed, dismiss } = useProxmoxErrorStore();
  const [showHowToFix, setShowHowToFix] = useState(false);
  const navigate = useNavigate();

  if (!error || isDismissed) {
    return null;
  }

  const isPermission = error.errorCode === 'PROXMOX_PERMISSION_DENIED';

  return (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20 p-4 shadow-sm animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
            {isPermission ? (
              <ShieldAlert className="size-5" />
            ) : (
              <AlertTriangle className="size-5" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-amber-950 dark:text-amber-200">
                {isPermission
                  ? 'Permissão Insuficiente no Proxmox VE'
                  : 'Falha na Comunicação com o Proxmox VE'}
              </span>
              <Badge variant="warning" className="text-[10px] uppercase font-bold tracking-wider">
                {isPermission ? 'Acesso Negado (403)' : 'Aviso Proxmox'}
              </Badge>
              {error.requiredPermission && (
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-900 dark:text-amber-300">
                  {error.requiredPermission}
                </Badge>
              )}
            </div>

            <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              {error.detail}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
          {isPermission && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHowToFix(!showHowToFix)}
              className="text-xs text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 gap-1 h-8 px-2.5"
            >
              {showHowToFix ? (
                <>
                  <ChevronUp className="size-3.5" />
                  Ocultar Ajuda
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" />
                  Como Resolver?
                </>
              )}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/settings')}
            className="text-xs border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 gap-1.5 h-8 px-3"
          >
            <Settings className="size-3.5" />
            Configurações
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={dismiss}
            className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-500/20 size-7"
            title="Dispensar aviso"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Seção Expansível: Como Resolver */}
      {isPermission && showHowToFix && (
        <div className="mt-4 pt-3 border-t border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <p className="font-semibold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
            <KeyRound className="size-3.5" />
            Passo a passo para liberar permissão no Proxmox VE:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px] leading-relaxed">
            <li>
              Acesse a interface web do Proxmox VE e clique em <strong>Datacenter</strong> &gt; <strong>Permissions</strong>.
            </li>
            <li>
              Clique em <strong>Add</strong> e selecione <strong>API Token Permission</strong> (ou <em>User Permission</em> caso não use token).
            </li>
            <li>
              No campo <strong>Path</strong>, informe <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono font-semibold">{error.path || '/'}</code> (ou <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono font-semibold">/</code> para herança global).
            </li>
            <li>
              Selecione o Token correspondente e atribua a Role <strong className="bg-amber-500/20 px-1 py-0.5 rounded font-semibold">PVEAuditor</strong> (ou <em>Administrator</em>).
            </li>
            <li>
              Certifique-se de marcar a opção <strong>Propagate</strong> (Propagar) e clique em <strong>Add</strong>.
            </li>
          </ol>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 pt-1">
            * Se o seu API Token foi criado com a opção <em>Privilege Separation</em> ativada (padrão do Proxmox), as permissões devem ser concedidas diretamente para o Token.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProxmoxErrorBanner;
