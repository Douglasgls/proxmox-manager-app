import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, DEFAULT_CONTAINER_VALUES, AVAILABLE_COMPONENTS } from '../constants';
import type { WizardStepId } from '../constants';
import type { CreateContainerDTO, IpMode, TemplateImage } from '../types';
import { ComponentSelector } from './ComponentSelector';
import { NetworkConfigSection } from './NetworkConfigSection';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/utils/bytes';
import {
  Box, Cpu, HardDrive, Database, Network,
  Package, ChevronRight, ChevronLeft,
  Check, Eye, Loader2, KeyRound,
} from 'lucide-react';

interface NetworkBridge {
  name: string;
  active: boolean;
}

interface CreateContainerFormProps {
  templates: TemplateImage[];
  isTemplatesLoading: boolean;
  bridges: NetworkBridge[];
  isBridgesLoading: boolean;
  onSubmit: (dto: CreateContainerDTO) => void;
  isSubmitting: boolean;
}

const inputClasses =
  'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200';

const labelClasses = 'text-sm font-medium text-foreground flex items-center gap-1.5';

export const CreateContainerForm: React.FC<CreateContainerFormProps> = ({
  templates,
  isTemplatesLoading,
  bridges,
  isBridgesLoading,
  onSubmit,
  isSubmitting,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStepId>('basic');
  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  // Form state
  const [name, setName] = useState(DEFAULT_CONTAINER_VALUES.name);
  const [password, setPassword] = useState('');
  const [imageName, setImageName] = useState(DEFAULT_CONTAINER_VALUES.image_name);
  const [cpu, setCpu] = useState(DEFAULT_CONTAINER_VALUES.cpu);
  const [memoryMb, setMemoryMb] = useState(DEFAULT_CONTAINER_VALUES.memory_mb);
  const [diskGb, setDiskGb] = useState(DEFAULT_CONTAINER_VALUES.disk_gb);
  const [bridge, setBridge] = useState(DEFAULT_CONTAINER_VALUES.bridge);
  const [ipMode, setIpMode] = useState<IpMode>(DEFAULT_CONTAINER_VALUES.ip_mode);
  const [ipAddress, setIpAddress] = useState<string | null>(DEFAULT_CONTAINER_VALUES.ip_address);
  const [cidr, setCidr] = useState<string | null>(DEFAULT_CONTAINER_VALUES.cidr);
  const [gateway, setGateway] = useState<string | null>(DEFAULT_CONTAINER_VALUES.gateway);
  const [firewall, setFirewall] = useState(DEFAULT_CONTAINER_VALUES.firewall);
  const [mtu, setMtu] = useState<number | null>(DEFAULT_CONTAINER_VALUES.mtu);
  const [vlan, setVlan] = useState<number | null>(DEFAULT_CONTAINER_VALUES.vlan);
  const [macAddress, setMacAddress] = useState<string | null>(DEFAULT_CONTAINER_VALUES.mac_address);
  const [components, setComponents] = useState<string[]>(DEFAULT_CONTAINER_VALUES.components);

  // Validations per step
  const isBasicValid = name.trim().length > 0 && password.length >= 6 && imageName.length > 0;
  const isResourcesValid = cpu >= 1 && memoryMb >= 128 && diskGb >= 1;
  const isNetworkValid = ipMode === 'dhcp' || (!!ipAddress && !!cidr);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'basic': return isBasicValid;
      case 'resources': return isResourcesValid;
      case 'network': return isNetworkValid;
      case 'components': return true;
      case 'review': return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = () => {
    // Prepend 'local:vztmpl/' if not already present
    const formattedImageName = imageName.startsWith('local:vztmpl/')
      ? imageName
      : `local:vztmpl/${imageName}`;

    const dto: CreateContainerDTO = {
      name: name.trim(),
      password,
      cpu,
      memory_mb: memoryMb,
      disk_gb: diskGb,
      image_name: formattedImageName,
      bridge,
      ip_mode: ipMode,
      ip_address: ipMode === 'static' ? ipAddress : null,
      cidr: ipMode === 'static' ? cidr : null,
      gateway: ipMode === 'static' ? gateway : null,
      firewall,
      mtu,
      vlan,
      mac_address: macAddress,
      components,
    };
    onSubmit(dto);
  };

  // Selected template name for review
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.filename === imageName),
    [templates, imageName]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-6 px-1">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => {
                  // Allow going back to completed steps
                  if (index <= currentStepIndex) {
                    setCurrentStep(step.id);
                  }
                }}
                className={cn(
                  'flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0',
                  isActive && 'bg-primary text-primary-foreground shadow-sm',
                  isCompleted && !isActive && 'text-primary cursor-pointer hover:bg-primary/10',
                  !isActive && !isCompleted && 'text-muted-foreground cursor-default',
                )}
                disabled={index > currentStepIndex}
              >
                <span
                  className={cn(
                    'size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                    isActive && 'bg-primary-foreground/20',
                    isCompleted && !isActive && 'bg-primary/10',
                    !isActive && !isCompleted && 'bg-muted',
                  )}
                >
                  {isCompleted && !isActive ? <Check className="size-3" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px transition-colors duration-300',
                    index < currentStepIndex ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-1">
        {/* ── Step 1: Basic ── */}
        {currentStep === 'basic' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Box className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Informações Básicas</h3>
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>
                <Box className="size-3.5 text-muted-foreground" />
                Nome do Container
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                placeholder="my-lxc-container"
                className={inputClasses}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">Apenas letras, números e hífens.</p>
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>
                <KeyRound className="size-3.5 text-muted-foreground" />
                Senha do root
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={inputClasses}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>
                <Database className="size-3.5 text-muted-foreground" />
                Template da Imagem
              </label>
              {isTemplatesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando templates...
                </div>
              ) : (
                <select
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  className={cn(inputClasses, 'cursor-pointer')}
                >
                  <option value="">Selecione um template</option>
                  {templates.map((t) => (
                    <option key={t.filename} value={t.filename}>
                      {t.name} ({formatBytes(t.size)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Resources ── */}
        {currentStep === 'resources' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recursos do Container</h3>
            </div>

            {/* CPU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelClasses}>
                  <Cpu className="size-3.5 text-muted-foreground" />
                  CPU Cores
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={cpu}
                  onChange={(e) => {
                    const v = Math.min(16, Math.max(1, Number(e.target.value) || 1));
                    setCpu(v);
                  }}
                  className="w-16 h-7 px-2 text-sm font-semibold tabular-nums text-primary text-center rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <input
                type="range"
                min={1}
                max={16}
                value={cpu}
                onChange={(e) => setCpu(Number(e.target.value))}
                className="w-full accent-primary h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1 core</span>
                <span>16 cores</span>
              </div>
            </div>

            {/* Memory */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelClasses}>
                  <HardDrive className="size-3.5 text-muted-foreground" />
                  Memória RAM (MB)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={128}
                    max={16384}
                    step={128}
                    value={memoryMb}
                    onChange={(e) => {
                      const v = Math.min(16384, Math.max(128, Number(e.target.value) || 128));
                      setMemoryMb(v);
                    }}
                    className="w-20 h-7 px-2 text-sm font-semibold tabular-nums text-primary text-center rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">
                    {memoryMb >= 1024 ? `(${(memoryMb / 1024).toFixed(1)} GB)` : 'MB'}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={128}
                max={16384}
                step={128}
                value={memoryMb}
                onChange={(e) => setMemoryMb(Number(e.target.value))}
                className="w-full accent-primary h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>128 MB</span>
                <span>16 GB</span>
              </div>
            </div>

            {/* Disk */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelClasses}>
                  <Database className="size-3.5 text-muted-foreground" />
                  Disco (GB)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={diskGb}
                    onChange={(e) => {
                      const v = Math.min(500, Math.max(1, Number(e.target.value) || 1));
                      setDiskGb(v);
                    }}
                    className="w-16 h-7 px-2 text-sm font-semibold tabular-nums text-primary text-center rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">GB</span>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={500}
                step={1}
                value={diskGb}
                onChange={(e) => setDiskGb(Number(e.target.value))}
                className="w-full accent-primary h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1 GB</span>
                <span>500 GB</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Network ── */}
        {currentStep === 'network' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Network className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Configuração de Rede</h3>
            </div>

            <NetworkConfigSection
              ipMode={ipMode}
              bridge={bridge}
              ipAddress={ipAddress}
              cidr={cidr}
              gateway={gateway}
              firewall={firewall}
              mtu={mtu}
              vlan={vlan}
              macAddress={macAddress}
              bridges={bridges}
              isBridgesLoading={isBridgesLoading}
              onIpModeChange={setIpMode}
              onBridgeChange={setBridge}
              onIpAddressChange={setIpAddress}
              onCidrChange={setCidr}
              onGatewayChange={setGateway}
              onFirewallChange={setFirewall}
              onMtuChange={setMtu}
              onVlanChange={setVlan}
              onMacAddressChange={setMacAddress}
            />
          </div>
        )}

        {/* ── Step 4: Components ── */}
        {currentStep === 'components' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Package className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Componentes Extras</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Selecione os pacotes que deseja instalar automaticamente durante a criação do container.
            </p>
            <ComponentSelector selected={components} onChange={setComponents} />
          </div>
        )}

        {/* ── Step 5: Review ── */}
        {currentStep === 'review' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Revisão Final</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Confira todas as configurações antes de iniciar a criação.
            </p>

            <div className="space-y-3">
              {/* Basic */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Box className="size-3" />
                  Básico
                </h4>
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">Nome</span>
                  <span className="font-medium text-foreground">{name}</span>
                  <span className="text-muted-foreground">Imagem</span>
                  <span className="font-medium text-foreground text-xs">
                    {selectedTemplate?.name || imageName}
                  </span>
                  <span className="text-muted-foreground">Senha</span>
                  <span className="font-medium text-foreground">••••••••</span>
                </div>
              </div>

              {/* Resources */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="size-3" />
                  Recursos
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{cpu}</p>
                    <p className="text-[10px] text-muted-foreground">CPU Cores</p>
                  </div>
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <p className="text-lg font-bold text-foreground">
                      {memoryMb >= 1024 ? `${(memoryMb / 1024).toFixed(1)}` : memoryMb}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {memoryMb >= 1024 ? 'GB RAM' : 'MB RAM'}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{diskGb}</p>
                    <p className="text-[10px] text-muted-foreground">GB Disco</p>
                  </div>
                </div>
              </div>

              {/* Network */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="size-3" />
                  Rede
                </h4>
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">Bridge</span>
                  <span className="font-medium text-foreground">{bridge}</span>
                  <span className="text-muted-foreground">Modo de IP</span>
                  <span className="font-medium text-foreground uppercase">{ipMode}</span>
                  {ipMode === 'static' && (
                    <>
                      <span className="text-muted-foreground">IP</span>
                      <span className="font-medium text-foreground">{ipAddress}/{cidr}</span>
                      {gateway && (
                        <>
                          <span className="text-muted-foreground">Gateway</span>
                          <span className="font-medium text-foreground">{gateway}</span>
                        </>
                      )}
                    </>
                  )}
                  <span className="text-muted-foreground">Firewall</span>
                  <span className="font-medium text-foreground">{firewall ? 'Ativado' : 'Desativado'}</span>
                </div>
              </div>

              {/* Components */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="size-3" />
                  Componentes
                </h4>
                {components.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {components.map((c) => {
                      const comp = AVAILABLE_COMPONENTS.find((a) => a.id === c);
                      return (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                        >
                          {comp?.name || c}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum componente selecionado</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={goPrev}
          disabled={currentStepIndex === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="size-3.5" />
          Voltar
        </Button>

        {currentStep === 'review' ? (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                Criar Container
              </>
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={goNext}
            disabled={!canProceed()}
            className="gap-1.5"
          >
            Próximo
            <ChevronRight className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
