import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CatalogComponent, DockerAppConfig, ComponentItem, EnvVarSchema, VolumeSchema, ContainerComponentStatus } from '../types';
import {
  Settings,
  Globe,
  Shield,
  RefreshCw,
  X,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Key,
  HardDrive,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Terminal,
  Info,
  Package,
} from 'lucide-react';
import dockerIcon from '@/assets/docker.webp';

interface DockerAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  component: CatalogComponent | null;
  initialConfig?: DockerAppConfig;
  currentlySelectedItems?: ComponentItem[];
  installedComponents?: ContainerComponentStatus[];
  onSave: (config: DockerAppConfig) => void;
}

type TabType = 'network' | 'env' | 'volumes';

export const DockerAppConfigModal: React.FC<DockerAppConfigModalProps> = ({
  isOpen,
  onClose,
  component,
  initialConfig,
  currentlySelectedItems = [],
  installedComponents = [],
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('network');

  // Metadata properties
  const metadata = component?.metadata;
  const defaultConfig = metadata?.default_config || component?.default_config;
  const envSchema: EnvVarSchema[] = metadata?.env_vars_schema || [];
  const volumesSchema: VolumeSchema[] = metadata?.volumes_schema || [];
  const isWebApp = metadata?.is_web_app ?? true;
  const protocol = metadata?.protocol || (isWebApp ? 'http' : 'tcp');
  const websiteUrl = metadata?.website_url;
  const documentationUrl = metadata?.documentation_url;

  const defaultInternalPort = defaultConfig?.container_port || 8080;
  const defaultHostPort = initialConfig?.host_port || defaultConfig?.host_port || defaultInternalPort;

  // Form states
  const [containerName, setContainerName] = useState<string>('');
  const [hostPort, setHostPort] = useState<number>(defaultHostPort);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [containerPortOverride, setContainerPortOverride] = useState<string>(
    initialConfig?.container_port ? String(initialConfig.container_port) : ''
  );
  const [bindHost, setBindHost] = useState<'0.0.0.0' | '127.0.0.1'>(
    (initialConfig?.host as '0.0.0.0' | '127.0.0.1') || '0.0.0.0'
  );
  const [restartPolicy, setRestartPolicy] = useState<'unless-stopped' | 'always' | 'no' | 'on-failure'>(
    (initialConfig?.restart_policy as 'unless-stopped' | 'always' | 'no' | 'on-failure') || 'unless-stopped'
  );

  // Env vars state
  const [envValues, setEnvValues] = useState<Record<string, string>>({});
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [customEnvVars, setCustomEnvVars] = useState<{ key: string; value: string }[]>([]);

  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens or component changes
  useEffect(() => {
    if (component) {
      const defIntPort = defaultConfig?.container_port || 8080;
      const defHPort = initialConfig?.host_port || defaultConfig?.host_port || defIntPort;

      // Suggest container name automatically
      const baseName = component.container_name || `${component.slug}-app`;
      let suggested = initialConfig?.container_name || '';
      if (!suggested) {
        const existingNames = new Set<string>();
        (installedComponents || []).forEach((c) => {
          if (c.config?.container_name) existingNames.add(c.config.container_name.toLowerCase());
        });
        currentlySelectedItems.forEach((item) => {
          if (typeof item === 'object' && item.config?.container_name) {
            existingNames.add(item.config.container_name.toLowerCase());
          }
        });

        if (!existingNames.has(baseName.toLowerCase())) {
          suggested = baseName;
        } else {
          let idx = 2;
          while (existingNames.has(`${component.slug}-${idx}`.toLowerCase())) {
            idx++;
          }
          suggested = `${component.slug}-${idx}`;
        }
      }
      setContainerName(suggested);

      setHostPort(defHPort);
      setContainerPortOverride(initialConfig?.container_port ? String(initialConfig.container_port) : '');
      setBindHost((initialConfig?.host as '0.0.0.0' | '127.0.0.1') || '0.0.0.0');
      setRestartPolicy((initialConfig?.restart_policy as 'unless-stopped' | 'always' | 'no' | 'on-failure') || 'unless-stopped');

      // Initialize env values from initialConfig or default values in envSchema
      const initialEnv: Record<string, string> = { ...(initialConfig?.env || {}) };
      envSchema.forEach((item) => {
        if (initialEnv[item.name] === undefined && item.default !== undefined) {
          initialEnv[item.name] = item.default;
        }
      });
      setEnvValues(initialEnv);

      // Separate custom env vars not in schema
      if (initialConfig?.env) {
        const schemaKeys = new Set(envSchema.map((s) => s.name));
        const customs = Object.entries(initialConfig.env)
          .filter(([k]) => !schemaKeys.has(k))
          .map(([key, value]) => ({ key, value }));
        setCustomEnvVars(customs);
      } else {
        setCustomEnvVars([]);
      }

      // Auto-expand advanced options if custom values are present
      if (
        initialConfig?.container_port ||
        (initialConfig?.host && initialConfig.host !== '0.0.0.0') ||
        (initialConfig?.restart_policy && initialConfig.restart_policy !== 'unless-stopped')
      ) {
        setShowAdvanced(true);
      } else {
        setShowAdvanced(false);
      }

      setActiveTab('network');
      setError(null);
    }
  }, [component, initialConfig, isOpen, installedComponents, currentlySelectedItems]);

  if (!isOpen || !component) return null;

  const effectiveInternalPort = containerPortOverride && containerPortOverride.trim() !== ''
    ? parseInt(containerPortOverride, 10) || defaultInternalPort
    : defaultInternalPort;

  // Conflict validation for host port
  const checkPortConflict = (currentHostPort: number, currentHost: string): boolean => {
    const inInstalled = (installedComponents || []).some((c) => {
      if (c.config && c.config.host_port) {
        const otherHost = c.config.host ?? '0.0.0.0';
        const otherPort = c.config.host_port;
        const isHostOverlap = otherHost === currentHost || currentHost === '0.0.0.0' || otherHost === '0.0.0.0';
        return isHostOverlap && Number(otherPort) === Number(currentHostPort);
      }
      return false;
    });
    if (inInstalled) return true;

    return currentlySelectedItems.some((item) => {
      if (typeof item === 'object' && item.config) {
        const otherHost = item.config.host ?? '0.0.0.0';
        const otherPort = item.config.host_port;
        const isHostOverlap = otherHost === currentHost || currentHost === '0.0.0.0' || otherHost === '0.0.0.0';
        return isHostOverlap && Number(otherPort) === Number(currentHostPort);
      }
      return false;
    });
  };

  // Conflict validation for container name
  const checkContainerNameConflict = (name: string): boolean => {
    const cleanName = name.trim().toLowerCase();
    if (!cleanName) return false;
    const inInstalled = (installedComponents || []).some(
      (c) => c.config?.container_name?.toLowerCase() === cleanName
    );
    if (inInstalled) return true;

    return currentlySelectedItems.some(
      (item) => typeof item === 'object' && item.config?.container_name?.toLowerCase() === cleanName
    );
  };

  const handleEnvChange = (name: string, val: string) => {
    setEnvValues((prev) => ({ ...prev, [name]: val }));
  };

  const toggleShowPassword = (name: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const addCustomEnvVar = () => {
    setCustomEnvVars((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeCustomEnvVar = (index: number) => {
    setCustomEnvVars((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCustomEnvVar = (index: number, key: string, value: string) => {
    setCustomEnvVars((prev) => {
      const updated = [...prev];
      updated[index] = { key, value };
      return updated;
    });
  };

  const handleSave = () => {
    // 0. Container name validation
    if (!containerName || !containerName.trim()) {
      setError('O nome do container Docker é obrigatório.');
      setActiveTab('network');
      return;
    }

    if (checkContainerNameConflict(containerName)) {
      setError(`Já existe um container Docker com o nome "${containerName}".`);
      setActiveTab('network');
      return;
    }

    // 1. Port validations
    if (!hostPort || hostPort < 1 || hostPort > 65535) {
      setError('A porta de acesso (Host) deve ser um número inteiro entre 1 e 65535.');
      setActiveTab('network');
      return;
    }

    if (containerPortOverride && containerPortOverride.trim() !== '') {
      const parsedOverride = parseInt(containerPortOverride, 10);
      if (isNaN(parsedOverride) || parsedOverride < 1 || parsedOverride > 65535) {
        setError('A porta interna do container deve ser um número inteiro entre 1 e 65535.');
        setActiveTab('network');
        return;
      }
    }

    if (checkPortConflict(hostPort, bindHost)) {
      setError(`A porta ${hostPort} já está sendo utilizada por outro componente Docker neste container.`);
      setActiveTab('network');
      return;
    }

    // 2. Environment variables required validation
    for (const schemaItem of envSchema) {
      if (schemaItem.required) {
        const val = envValues[schemaItem.name];
        if (!val || !val.trim()) {
          setError(`A variável de ambiente "${schemaItem.name}" é obrigatória.`);
          setActiveTab('env');
          return;
        }
      }
    }

    setError(null);

    // Build env object
    const finalEnv: Record<string, string> = {};
    Object.entries(envValues).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        finalEnv[k] = v;
      }
    });

    customEnvVars.forEach(({ key, value }) => {
      if (key.trim()) {
        finalEnv[key.trim()] = value;
      }
    });

    // Build payload according to specification
    const config: DockerAppConfig = {
      container_name: containerName.trim(),
      host_port: Number(hostPort),
      host: bindHost,
      restart_policy: restartPolicy,
    };

    if (containerPortOverride && containerPortOverride.trim() !== '') {
      config.container_port = parseInt(containerPortOverride, 10);
    }

    if (Object.keys(finalEnv).length > 0) {
      config.env = finalEnv;
    }

    onSave(config);
    onClose();
  };

  const hasConflict = checkPortConflict(hostPort, bindHost);
  const hasNameConflict = checkContainerNameConflict(containerName);
  const isSaveDisabled = hasConflict || hasNameConflict || !hostPort || !containerName.trim();
  const requiredEnvCount = envSchema.filter((e) => e.required).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md animate-in fade-in duration-300 ease-out"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto w-full max-w-lg flex flex-col',
            'bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden',
            'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="relative size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <Settings className="size-5" />
                <img
                  src={dockerIcon}
                  alt="Docker"
                  className="absolute -bottom-1 -right-1 size-4 object-contain rounded-full bg-card p-0.5 shadow-sm border border-border"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {component.name}
                  </h3>
                  {!isWebApp && (
                    <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full bg-[#EED202]/15 text-[#EED202] border border-[#EED202]/30">
                      Serviço TCP
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {component.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Navigation Tabs (Vercel / AWS style) */}
          <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-border/40 bg-muted/10 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('network')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0',
                activeTab === 'network'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Globe className="size-3.5" />
              Rede & Geral
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('env')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0 relative',
                activeTab === 'env'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Key className="size-3.5" />
              Variáveis de Ambiente
              {requiredEnvCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#EED202]/20 text-[#EED202]">
                  {requiredEnvCount}
                </span>
              )}
            </button>

            {volumesSchema.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('volumes')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0',
                  activeTab === 'volumes'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <HardDrive className="size-3.5" />
                Volumes ({volumesSchema.length})
              </button>
            )}
          </div>

          {/* Form Content Body */}
          <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2 animate-in fade-in duration-150">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: REDE & GERAL */}
            {activeTab === 'network' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Docker Container Instance Name */}
                <div className="space-y-1.5">
                  <label htmlFor="container_name" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Package className="size-3.5 text-primary" />
                    Nome do Container Docker
                  </label>
                  <input
                    id="container_name"
                    type="text"
                    value={containerName}
                    onChange={(e) => setContainerName(e.target.value)}
                    placeholder="Ex: filegator-app"
                    required
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Nome identificador único da instância da aplicação no Docker.
                  </p>
                </div>

                {hasConflict && !error && (
                  <div className="p-3 rounded-xl bg-[#EED202]/10 border border-[#EED202]/30 text-[#EED202] text-xs font-medium flex items-start gap-2">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5 text-[#EED202]" />
                    <span>
                      ⚠️ A porta {hostPort} já está sendo utilizada por outro componente Docker neste container.
                    </span>
                  </div>
                )}

                {/* External Host Port */}
                <div className="space-y-1.5">
                  <label htmlFor="host_port" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="size-3.5 text-primary" />
                    Porta de Acesso Externa (Host)
                  </label>
                  <input
                    id="host_port"
                    type="number"
                    min={1}
                    max={65535}
                    value={hostPort || ''}
                    onChange={(e) => setHostPort(Number(e.target.value))}
                    placeholder="Ex: 8011"
                    required
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm font-semibold tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Porta liberada no container LXC para conectar a este componente.
                  </p>
                </div>

                {/* Docker Mapping & Protocol Connection Badge */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Mapeamento Docker:</span>
                    <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                      {hostPort || '?'}:{effectiveInternalPort}
                    </code>
                  </div>

                  {/* Web App Preview vs TCP Service Notice */}
                  {isWebApp ? (
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium flex items-center gap-1">
                        <Info className="size-3 text-primary" />
                        URL de Acesso Web:
                      </span>
                      <span className="font-mono font-semibold text-primary">
                        http://&lt;IP-DO-LXC&gt;:{hostPort || 80}
                      </span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium flex items-center gap-1">
                        <Terminal className="size-3 text-amber-500" />
                        Conexão Direta TCP:
                      </span>
                      <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {protocol}://&lt;IP-DO-LXC&gt;:{hostPort || 5432}
                      </span>
                    </div>
                  )}
                </div>

                {/* Official Links (Docs & Website) */}
                {(websiteUrl || documentationUrl) && (
                  <div className="flex items-center gap-2 pt-1">
                    {websiteUrl && (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
                      >
                        <ExternalLink className="size-3" />
                        Website Oficial
                      </a>
                    )}
                    {documentationUrl && (
                      <a
                        href={documentationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
                      >
                        <ExternalLink className="size-3" />
                        Documentação
                      </a>
                    )}
                  </div>
                )}

                {/* ACCORDION: CONFIGURAÇÕES AVANÇADAS */}
                <div className="pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>{showAdvanced ? '▲ Ocultar Configurações Avançadas' : '▼ Configurações Avançadas'}</span>
                    {showAdvanced ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 p-3 rounded-xl bg-muted/20 border border-border/50 animate-in fade-in duration-200">
                      {/* Container Port Override */}
                      <div className="space-y-1.5">
                        <label htmlFor="container_port" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Shield className="size-3.5 text-muted-foreground" />
                          Porta Interna do Container (Sobrescrever Padrão: {defaultInternalPort})
                        </label>
                        <input
                          id="container_port"
                          type="number"
                          min={1}
                          max={65535}
                          value={containerPortOverride}
                          onChange={(e) => setContainerPortOverride(e.target.value)}
                          placeholder={`Padrão do Template: ${defaultInternalPort}`}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        />
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          Deixe em branco para usar a porta padrão recomendada pelo template ({defaultInternalPort}).
                        </p>
                      </div>

                      {/* Bind IP */}
                      <div className="space-y-1.5">
                        <label htmlFor="bind_host" className="text-xs font-semibold text-foreground block">
                          Interface de Escuta (Bind IP)
                        </label>
                        <select
                          id="bind_host"
                          value={bindHost}
                          onChange={(e) => setBindHost(e.target.value as any)}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        >
                          <option value="0.0.0.0">0.0.0.0 (Acessível na Rede Local / Externa)</option>
                          <option value="127.0.0.1">127.0.0.1 (Apenas Acesso Interno / Loopback)</option>
                        </select>
                      </div>

                      {/* Restart Policy */}
                      <div className="space-y-1.5">
                        <label htmlFor="restart_policy" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <RefreshCw className="size-3.5 text-muted-foreground" />
                          Política de Reinicialização
                        </label>
                        <select
                          id="restart_policy"
                          value={restartPolicy}
                          onChange={(e) => setRestartPolicy(e.target.value as any)}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        >
                          <option value="unless-stopped">Unless Stopped (Recomendado)</option>
                          <option value="always">Always</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: VARIÁVEIS DE AMBIENTE (ENV) */}
            {activeTab === 'env' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <p className="text-xs text-muted-foreground">
                  Configure as variáveis de ambiente utilizadas pelo container. As variáveis com o selo <span className="text-destructive font-semibold">Obrigatório</span> devem ser preenchidas.
                </p>

                {/* Schema Env Vars */}
                {envSchema.length > 0 ? (
                  <div className="space-y-3">
                    {envSchema.map((item) => {
                      const isPassword = item.type === 'password';
                      const isShowPassword = !!showPasswordMap[item.name];

                      return (
                        <div key={item.name} className="p-3 rounded-xl border border-border bg-background/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-mono font-semibold text-foreground flex items-center gap-1.5">
                              {item.name}
                            </label>
                            {item.required ? (
                              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                                Obrigatório
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-muted text-muted-foreground">
                                Opcional
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-[11px] text-muted-foreground leading-tight">
                              {item.description}
                            </p>
                          )}

                          <div className="relative">
                            <input
                              type={isPassword && !isShowPassword ? 'password' : 'text'}
                              autoComplete={isPassword ? 'new-password' : 'off'}
                              value={envValues[item.name] ?? ''}
                              onChange={(e) => handleEnvChange(item.name, e.target.value)}
                              placeholder={item.default ? `Padrão: ${item.default}` : 'Digite o valor...'}
                              className="w-full h-9 pl-3 pr-9 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                            />
                            {isPassword && (
                              <button
                                type="button"
                                onClick={() => toggleShowPassword(item.name)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
                              >
                                {isShowPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    Este componente não possui variáveis de ambiente pré-definidas no schema.
                  </div>
                )}

                {/* Custom Env Vars Section */}
                <div className="pt-3 border-t border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Variáveis Customizadas Extras
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={addCustomEnvVar}
                      className="gap-1 text-xs"
                    >
                      <Plus className="size-3" />
                      Adicionar Variável
                    </Button>
                  </div>

                  {customEnvVars.map((custom, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="NOME_VARIAVEL"
                        value={custom.key}
                        onChange={(e) => updateCustomEnvVar(idx, e.target.value, custom.value)}
                        className="flex-1 h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-mono text-foreground uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <input
                        type="text"
                        placeholder="Valor"
                        value={custom.value}
                        onChange={(e) => updateCustomEnvVar(idx, custom.key, e.target.value)}
                        className="flex-1 h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomEnvVar(idx)}
                        className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: VOLUMES & PERSISTÊNCIA */}
            {activeTab === 'volumes' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-xs text-muted-foreground">
                  Diretórios e volumes de persistência configurados na imagem do container:
                </p>

                {volumesSchema.map((vol) => (
                  <div key={vol.name || vol.mount_path} className="p-3.5 rounded-xl border border-border bg-background/60 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <HardDrive className="size-3.5 text-primary" />
                        {vol.name || 'Volume Data'}
                      </span>
                      <code className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {vol.mount_path}
                      </code>
                    </div>
                    {vol.description && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {vol.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setHostPort(defaultHostPort);
                setContainerPortOverride('');
                setBindHost('0.0.0.0');
                setRestartPolicy('unless-stopped');
                setShowAdvanced(false);
                setEnvValues({});
                setCustomEnvVars([]);
                setError(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Restaurar Padrão
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaveDisabled}
                className="gap-1.5"
              >
                <Check className="size-3.5" />
                Salvar Configuração
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
