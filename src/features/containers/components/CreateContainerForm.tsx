import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/modules/inventoryApi';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, DEFAULT_CONTAINER_VALUES } from '../constants';
import type { WizardStepId } from '../constants';
import type { CreateContainerDTO, IpMode, TemplateImage, ComponentItem } from '../types';
import { useCatalogComponents } from '../hooks';
import { ComponentSelector } from './ComponentSelector';
import { NetworkConfigSection } from './NetworkConfigSection';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/utils/bytes';
import {
  Box, Cpu, HardDrive, Database, Network,
  Package, ChevronRight, ChevronLeft,
  Check, Eye, Loader2, KeyRound, AlertCircle, AlertTriangle
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
  errorMessage?: string | null;
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
  errorMessage,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStepId>('basic');
  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  // Busca dados reais do host e componentes
  const { data: hostInventory } = useQuery({
    queryKey: ['host', 'inventory'],
    queryFn: inventoryApi.getHost,
    staleTime: Infinity,
  });

  const { data: hostMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: inventoryApi.getHostMetrics,
    staleTime: Infinity,
  });

  const { data: catalogComponents } = useCatalogComponents();

  // Busca a lista de storages disponíveis no cluster
  const { data: storagesList, isPending: isStoragesLoading } = useQuery({
    queryKey: ['storages'],
    queryFn: () => inventoryApi.getStorages(),
    staleTime: Infinity,
  });

  // Filtra apenas os storages ativos que suportam discos de containers (rootdir)
  const containerStorages = useMemo(() => {
    if (!storagesList) return [];
    return storagesList.filter(
      (s) => s.active && s.content_types?.includes('rootdir')
    );
  }, [storagesList]);

  // Estado para o storage de destino selecionado
  const [selectedStorageName, setSelectedStorageName] = useState<string>('');

  // Define o primeiro storage válido como padrão assim que carregar a lista
  useEffect(() => {
    if (containerStorages.length > 0 && !selectedStorageName) {
      const defaultName = containerStorages[0].name || containerStorages[0].storage || '';
      setSelectedStorageName(defaultName);
    }
  }, [containerStorages, selectedStorageName]);

  const selectedStorage = useMemo(() => {
    return containerStorages.find((s) => (s.name || s.storage) === selectedStorageName);
  }, [containerStorages, selectedStorageName]);

  const maxCpuCores = hostInventory?.cpu_threads ?? 4;
  const maxMemoryMb = hostInventory
    ? Math.floor(hostInventory.memory_total_bytes / (1024 * 1024))
    : 2048;

  // Recalcula o limite máximo do slider de disco (maxDiskGb) baseado no avail_bytes do storage selecionado
  const maxDiskGb = useMemo(() => {
    if (selectedStorage?.avail_bytes) {
      return Math.floor(selectedStorage.avail_bytes / (1024 * 1024 * 1024));
    }
    if (hostMetrics?.disk_free_bytes) {
      return Math.floor(hostMetrics.disk_free_bytes / (1024 * 1024 * 1024));
    }
    return 500;
  }, [selectedStorage, hostMetrics]);


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
  const [components, setComponents] = useState<ComponentItem[]>(DEFAULT_CONTAINER_VALUES.components);

  // Validations per step
  const isBasicValid = name.trim().length > 0 && password.length >= 5 && imageName.length > 0;
  const isResourcesValid = cpu >= 1 && memoryMb >= 128 && diskGb >= 1;
  const isNetworkValid = ipMode === 'dhcp' || (!!ipAddress && !!cidr);

  const areComponentsValid = useMemo(() => {
    return components.every((item) => {
      if (typeof item === 'object') {
        const comp = catalogComponents?.find((c) => c.slug === item.slug);
        const envSchema = comp?.metadata?.env_vars_schema || [];
        const envValues = item.config.env || {};

        return envSchema.every((schemaItem) => {
          if (schemaItem.required) {
            const val = envValues[schemaItem.name];
            return val && val.trim() !== '';
          }
          return true;
        });
      }
      return true;
    });
  }, [components, catalogComponents]);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'basic': return isBasicValid;
      case 'resources': return isResourcesValid;
      case 'network': return isNetworkValid;
      case 'components': return areComponentsValid;
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
      storage: selectedStorageName || undefined,
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
        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2.5 text-xs font-medium animate-in fade-in duration-200">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Falha na criação do container</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}
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
                id="container_name_input"
                name="container_name_input"
                autoComplete="off"
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
                id="container_root_password_input"
                name="container_root_password_input"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 5 caracteres"
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
                  max={maxCpuCores}
                  value={cpu}
                  onChange={(e) => {
                    const v = Math.min(maxCpuCores, Math.max(1, Number(e.target.value) || 1));
                    setCpu(v);
                  }}
                  className="w-16 h-7 px-2 text-sm font-semibold tabular-nums text-primary text-center rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <input
                type="range"
                min={1}
                max={maxCpuCores}
                value={cpu}
                onChange={(e) => setCpu(Number(e.target.value))}
                className="w-full accent-primary h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1 core</span>
                <span>{maxCpuCores} cores</span>
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
                    max={maxMemoryMb}
                    step={128}
                    value={memoryMb}
                    onChange={(e) => {
                      const v = Math.min(maxMemoryMb, Math.max(128, Number(e.target.value) || 128));
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
                max={maxMemoryMb}
                step={128}
                value={memoryMb}
                onChange={(e) => setMemoryMb(Number(e.target.value))}
                className="w-full accent-primary h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>128 MB</span>
                <span>{maxMemoryMb >= 1024 ? `${(maxMemoryMb / 1024).toFixed(1)} GB` : `${maxMemoryMb} MB`}</span>
              </div>
            </div>

            {/* Storage de Destino (Disco) */}
            <div className="space-y-1.5">
              <label className={labelClasses}>
                <Database className="size-3.5 text-primary" />
                Storage de Destino (Disco)
              </label>
              {isStoragesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando storages do Proxmox...
                </div>
              ) : (
                <select
                  value={selectedStorageName}
                  onChange={(e) => setSelectedStorageName(e.target.value)}
                  className={cn(inputClasses, 'cursor-pointer')}
                >
                  {containerStorages.map((storage) => {
                    const name = storage.name || storage.storage || '';
                    const availGb = storage.avail_bytes
                      ? Math.floor(storage.avail_bytes / (1024 * 1024 * 1024))
                      : 0;
                    return (
                      <option key={name} value={name}>
                        {name} ({availGb} GB livres)
                      </option>
                    );
                  })}
                </select>
              )}
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
                    max={maxDiskGb}
                    value={diskGb}
                    onChange={(e) => {
                      const v = Math.min(maxDiskGb, Math.max(1, Number(e.target.value) || 1));
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
                max={maxDiskGb}
                step={1}
                value={diskGb}
                onChange={(e) => setDiskGb(Number(e.target.value))}
                className="w-full accent-primary h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1 GB</span>
                <span>{maxDiskGb} GB</span>
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

            {!areComponentsValid && (
              <div className="mb-4 p-3 rounded-xl bg-[#EED202]/10 border border-[#EED202]/30 text-[#EED202] text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertTriangle className="size-4 shrink-0 text-[#EED202]" />
                <span>
                  Existem componentes Docker selecionados com variáveis de ambiente obrigatórias pendentes. Clique no ícone de engrenagem piscando em amarelo para configurá-los.
                </span>
              </div>
            )}

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
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Nome</span>
                  <span className="font-medium text-foreground">{name}</span>
                  <span className="text-muted-foreground">Template</span>
                  <span className="font-medium text-foreground">
                    {selectedTemplate?.name || imageName}
                  </span>
                </div>
              </div>

              {/* Resources */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="size-3" />
                  Recursos
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">CPU Cores</span>
                  <span className="font-medium text-foreground">{cpu} vCPU</span>
                  <span className="text-muted-foreground">Memória</span>
                  <span className="font-medium text-foreground">{memoryMb} MB ({memoryMb / 1024} GB)</span>
                  <span className="text-muted-foreground">Disco</span>
                  <span className="font-medium text-foreground">{diskGb} GB</span>
                  {selectedStorageName && (
                    <>
                      <span className="text-muted-foreground">Storage</span>
                      <span className="font-medium text-foreground">{selectedStorageName}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Network */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="size-3" />
                  Rede
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Bridge</span>
                  <span className="font-medium text-foreground">{bridge}</span>
                  <span className="text-muted-foreground">Modo IP</span>
                  <span className="font-medium text-foreground capitalize">{ipMode}</span>
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
                      const slug = typeof c === 'string' ? c : c.slug;
                      const config = typeof c === 'object' ? c.config : undefined;
                      const comp = catalogComponents?.find((a) => a.slug === slug || a.id === slug);
                      const displayInternalPort = config?.container_port || comp?.metadata?.default_config?.container_port || comp?.default_config?.container_port || config?.host_port;
                      return (
                        <span
                          key={slug}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                        >
                          <span>{comp?.name || slug}</span>
                          {config && config.host_port && (
                            <span className="text-[10px] font-mono opacity-90 border-l border-primary/30 pl-1.5">
                              {config.host_port}:{displayInternalPort}
                            </span>
                          )}
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
