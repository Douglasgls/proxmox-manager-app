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
import { Clock, KeyRound, Loader2, Calendar } from 'lucide-react';
import type { CreateAccessTokenParams } from '@/api/modules/accessTokenApi';

interface CreateTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: CreateAccessTokenParams) => Promise<void>;
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
  { id: '24h', label: '24 Horas', sublabel: '1 dia de validade', hours: 24 },
  { id: '7d', label: '7 Dias', sublabel: 'Duração recomendada', badge: 'Padrão', days: 7 },
  { id: '30d', label: '30 Dias', sublabel: 'Acesso por 1 mês', days: 30 },
  { id: '90d', label: '90 Dias', sublabel: 'Acesso prolongado', days: 90 },
  { id: 'custom', label: 'Personalizado', sublabel: '' },
];

export const CreateTokenDialog: React.FC<CreateTokenDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ExpirationPreset>('7d');
  const [customValue, setCustomValue] = useState<number>(7);
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days'>('days');
  const [description, setDescription] = useState<string>('');

  // Reseta o formulário ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setSelectedPreset('7d');
      setCustomValue(7);
      setCustomUnit('days');
      setDescription('');
    }
  }, [isOpen]);

  // Calcula a data estimada de expiração com base na seleção
  const { estimatedDate, relativeText, isValid } = useMemo(() => {
    const now = new Date();
    let targetDate = new Date(now);
    let relative = '';
    const valid = true;

    if (selectedPreset === 'custom') {
      if (!customValue || customValue <= 0 || isNaN(customValue)) {
        return { estimatedDate: null, relativeText: 'Tempo inválido', isValid: false };
      }
      if (customUnit === 'minutes') {
        targetDate = new Date(now.getTime() + customValue * 60 * 1000);
        relative = `Válido por ${customValue} minuto${customValue > 1 ? 's' : ''}`;
      } else if (customUnit === 'hours') {
        targetDate = new Date(now.getTime() + customValue * 60 * 60 * 1000);
        relative = `Válido por ${customValue} hora${customValue > 1 ? 's' : ''}`;
      } else {
        targetDate = new Date(now.getTime() + customValue * 24 * 60 * 60 * 1000);
        relative = `Válido por ${customValue} dia${customValue > 1 ? 's' : ''}`;
      }
    } else {
      const preset = PRESET_OPTIONS.find((p) => p.id === selectedPreset);
      if (preset?.hours) {
        targetDate = new Date(now.getTime() + preset.hours * 60 * 60 * 1000);
        relative = `Válido por ${preset.hours} hora${preset.hours > 1 ? 's' : ''}`;
      } else if (preset?.days) {
        targetDate = new Date(now.getTime() + preset.days * 24 * 60 * 60 * 1000);
        relative = `Válido por ${preset.days} dia${preset.days > 1 ? 's' : ''}`;
      }
    }

    return { estimatedDate: targetDate, relativeText: relative, isValid: valid };
  }, [selectedPreset, customValue, customUnit]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid || isLoading) return;

    const params: CreateAccessTokenParams = {};

    if (description.trim()) {
      params.description = description.trim();
    }

    if (selectedPreset === 'custom') {
      if (customUnit === 'minutes') {
        params.expires_in_minutes = Number(customValue);
      } else if (customUnit === 'hours') {
        params.expires_in_hours = Number(customValue);
      } else {
        params.expires_in_days = Number(customValue);
      }
    } else {
      const preset = PRESET_OPTIONS.find((p) => p.id === selectedPreset);
      if (preset?.hours) {
        params.expires_in_hours = preset.hours;
      } else if (preset?.days) {
        params.expires_in_days = preset.days;
      }
    }

    await onConfirm(params);
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
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && !isLoading && onClose()}>
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
      </DialogContent>
    </Dialog>
  );
};
