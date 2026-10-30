import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, KeyRound, Loader2, Calendar, Cloud, CheckCircle2 } from 'lucide-react';
import type { CreateAccessTokenParams } from '@/api/modules/accessTokenApi';

interface CreateTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: CreateAccessTokenParams) => Promise<boolean | void>;
  isLoading: boolean;
}

type ExpirationPreset = '1h' | '24h' | '7d' | '30d' | '90d' | 'custom';

interface PresetOption {
  id: ExpirationPreset;
  label: string;
  sublabel: string;
  badge?: string;
  hours?: number;
  days?: number;
}

const PRESET_OPTIONS: PresetOption[] = [
  { id: '1h', label: '1 Hora', sublabel: 'Acesso rápido', hours: 1 },
  { id: '24h', label: '24 Horas', sublabel: 'Uso diário', hours: 24, badge: 'Popular' },
  { id: '7d', label: '7 Dias', sublabel: 'Uma semana', days: 7 },
  { id: '30d', label: '30 Dias', sublabel: 'Um mês', days: 30 },
  { id: '90d', label: '90 Dias', sublabel: 'Três meses', days: 90 },
  { id: 'custom', label: 'Personalizado', sublabel: 'Defina a duração' },
];

export const CreateTokenDialog: React.FC<CreateTokenDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ExpirationPreset>('24h');
  const [customValue, setCustomValue] = useState<number>(7);
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days'>('days');
  const [description, setDescription] = useState<string>('');
  const [syncStage, setSyncStage] = useState<'idle' | 'generating' | 'syncing' | 'ready'>('idle');

  // Reset form e status ao abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedPreset('24h');
      setCustomValue(7);
      setCustomUnit('days');
      setDescription('');
      setSyncStage('idle');
    }
  }, [isOpen]);

  // Calcula a data estimada de expiração
  const estimatedDate = useMemo(() => {
    const now = new Date();
    if (selectedPreset === 'custom') {
      if (!customValue || customValue <= 0) return null;
      const copy = new Date(now.getTime());
      if (customUnit === 'minutes') {
        copy.setMinutes(copy.getMinutes() + customValue);
      } else if (customUnit === 'hours') {
        copy.setHours(copy.getHours() + customValue);
      } else {
        copy.setDate(copy.getDate() + customValue);
      }
      return copy;
    }

    const preset = PRESET_OPTIONS.find((p) => p.id === selectedPreset);
    if (!preset) return null;

    const copy = new Date(now.getTime());
    if (preset.hours) {
      copy.setHours(copy.getHours() + preset.hours);
    } else if (preset.days) {
      copy.setDate(copy.getDate() + preset.days);
    }
    return copy;
  }, [selectedPreset, customValue, customUnit]);

  // Texto amigável de quanto tempo o token vai durar
  const relativeText = useMemo(() => {
    if (selectedPreset === 'custom') {
      if (!customValue || customValue <= 0) return 'Duração inválida';
      const unitLabel =
        customUnit === 'minutes'
          ? customValue === 1 ? 'minuto' : 'minutos'
          : customUnit === 'hours'
          ? customValue === 1 ? 'hora' : 'horas'
          : customValue === 1 ? 'dia' : 'dias';
      return `Válido por ${customValue} ${unitLabel}`;
    }

    const preset = PRESET_OPTIONS.find((p) => p.id === selectedPreset);
    if (!preset) return '';
    if (preset.hours) {
      return `Válido por ${preset.hours} ${preset.hours === 1 ? 'hora' : 'horas'}`;
    }
    if (preset.days) {
      return `Válido por ${preset.days} dias`;
    }
    return '';
  }, [selectedPreset, customValue, customUnit]);

  const isValid = selectedPreset !== 'custom' || (customValue > 0 && !isNaN(customValue));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading || syncStage !== 'idle') return;

    const params: CreateAccessTokenParams = {};
    if (description.trim()) {
      params.description = description.trim();
    }

    if (selectedPreset === 'custom') {
      if (customUnit === 'minutes') {
        params.expires_in_minutes = customValue;
      } else if (customUnit === 'hours') {
        params.expires_in_hours = customValue;
      } else {
        params.expires_in_days = customValue;
      }
    } else {
      const preset = PRESET_OPTIONS.find((p) => p.id === selectedPreset);
      if (preset?.hours) {
        params.expires_in_hours = preset.hours;
      } else if (preset?.days) {
        params.expires_in_days = preset.days;
      }
    }

    setSyncStage('generating');
    try {
      const result = await onConfirm(params);
      const isSuccess = result !== false;

      if (isSuccess) {
        // Estágio de sincronização com a Cloud (aguarda 2.2 segundos para garantir o handshake do snapshot)
        setSyncStage('syncing');
        await new Promise((resolve) => setTimeout(resolve, 2200));

        // Estágio final de confirmação antes de revelar o token
        setSyncStage('ready');
        await new Promise((resolve) => setTimeout(resolve, 400));
        onClose();
      } else {
        setSyncStage('idle');
      }
    } catch {
      setSyncStage('idle');
    }
  };

  const handlePresetSelect = (id: ExpirationPreset) => {
    setSelectedPreset(id);
    if (id === 'custom' && (!customValue || customValue <= 0)) {
      setCustomValue(7);
      setCustomUnit('days');
    }
  };

  const formattedEstimatedDate = estimatedDate
    ? new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(estimatedDate)
    : '-';

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && !isLoading && syncStage === 'idle' && onClose()}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <KeyRound className="size-4" />
            </div>
            <DialogTitle className="text-lg font-semibold">Novo Token de Acesso</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Defina o tempo de validade do token para acesso remoto a este container.
          </DialogDescription>
        </DialogHeader>

        {syncStage !== 'idle' ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                {syncStage === 'ready' ? (
                  <CheckCircle2 className="size-8 text-green-500 animate-in zoom-in-50 duration-200" />
                ) : (
                  <Cloud className="size-8 text-primary animate-pulse" />
                )}
              </div>
              {syncStage === 'syncing' && (
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>

            <div className="text-center space-y-1.5 max-w-xs">
              <h4 className="font-semibold text-base text-foreground">
                {syncStage === 'generating' && 'Gerando credenciais...'}
                {syncStage === 'syncing' && 'Sincronizando com a Cloud...'}
                {syncStage === 'ready' && 'Acesso sincronizado!'}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {syncStage === 'generating' && 'Criando par de chaves e token temporário no Agent local.'}
                {syncStage === 'syncing' && 'Registrando permissão no Gateway Seguro para liberação imediata.'}
                {syncStage === 'ready' && 'Pronto! Liberando token para uso.'}
              </p>
            </div>

            <div className="w-52 bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full bg-primary transition-all duration-700 ease-out ${
                  syncStage === 'generating' ? 'w-1/3' : syncStage === 'syncing' ? 'w-4/5' : 'w-full bg-green-500'
                }`}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Opções de Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Tempo de Validade
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_OPTIONS.map((option) => {
                  const isSelected = selectedPreset === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handlePresetSelect(option.id)}
                      className={`relative flex flex-col text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer ${isSelected
                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40'
                        : 'border-border/80 hover:border-border hover:bg-muted/40'
                        }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {option.label}
                        </span>
                        {option.badge && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-transparent font-medium"
                          >
                            {option.badge}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {option.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo Personalizado */}
            {selectedPreset === 'custom' && (
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                <label className="text-xs font-medium text-foreground">
                  Informe o valor e a unidade de tempo:
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={customUnit === 'minutes' ? 525600 : customUnit === 'hours' ? 8760 : 365}
                    value={customValue || ''}
                    onChange={(e) => setCustomValue(parseInt(e.target.value, 10) || 0)}
                    placeholder={customUnit === 'minutes' ? 'Ex: 30' : customUnit === 'hours' ? 'Ex: 12' : 'Ex: 14'}
                    className="w-24 text-center font-medium"
                    autoFocus
                  />
                  <div className="grid grid-cols-3 p-1 bg-muted rounded-lg border border-border/60 flex-1">
                    <button
                      type="button"
                      onClick={() => setCustomUnit('minutes')}
                      className={`py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${customUnit === 'minutes'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Minutos
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomUnit('hours')}
                      className={`py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${customUnit === 'hours'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Horas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomUnit('days')}
                      className={`py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${customUnit === 'days'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Dias
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Card de Previsão de Expiração */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/30">
              <div className="size-8 rounded-lg bg-background border border-border/70 flex items-center justify-center shrink-0 text-muted-foreground">
                <Calendar className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Previsão de Expiração:</div>
                <div className="text-sm font-semibold text-foreground truncate mt-0.5">
                  {formattedEstimatedDate}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {relativeText}
                </div>
              </div>
            </div>

            {/* Campo Opcional de Descrição */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição ou Finalidade <span className="text-[11px] font-normal lowercase">(opcional)</span>
              </label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Integração CI/CD, Acesso para suporte..."
                maxLength={120}
                className="text-sm"
              />
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <KeyRound className="size-4" />
                    Gerar Token
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
