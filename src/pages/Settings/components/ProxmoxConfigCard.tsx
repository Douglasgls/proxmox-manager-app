import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { inventoryApi } from '@/api/modules/inventoryApi';
import { useInstalledTemplates } from '@/features/containers/hooks/useTemplates';
import { TemplateGalleryModal } from '@/features/containers/components/TemplateGalleryModal';
import { cn } from '@/lib/utils';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Radio,
  HardDrive,
  KeyRound,
  User,
  Globe,
  Loader2,
  Layers,
  Lock,
  Unlock,
  Star,
} from 'lucide-react';

export const ProxmoxConfigCard: React.FC = () => {
  const {
    config,
    isLoadingConfig,
    testConnection,
    isTesting,
    saveConfig,
    isSaving,
  } = useAgentConfig();

  const { readiness, isReady, isNotConfigured } = useAgentStatus();

  // Modal da Galeria de Templates
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Estado de bloqueio dos campos de token (cadeado)
  const [isTokensLocked, setIsTokensLocked] = useState(false);

  // Busca storages disponíveis quando o cluster estiver conectado / pronto
  const { data: storagesList, isLoading: isStoragesLoading } = useQuery({
    queryKey: ['storages'],
    queryFn: () => inventoryApi.getStorages(),
    enabled: isReady,
    retry: 1,
    staleTime: 30000,
  });

  // Busca templates instalados no cluster quando pronto
  const {
    refetch: refetchInstalledTemplates,
  } = useInstalledTemplates();

  const availableStorages = useMemo(() => {
    if (!storagesList || !Array.isArray(storagesList)) return [];
    return storagesList.filter((s) => s.active);
  }, [storagesList]);

  // Form state com default_storage e default_template
  const [formData, setFormData] = useState({
    proxmox_host: '',
    proxmox_user: '',
    proxmox_token_name: '',
    proxmox_token_value: '',
    proxmox_node: '',
    default_storage: '',
    default_template: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message?: string;
  }>({
    tested: false,
    success: false,
  });

  // Preenche dados quando a configuração salva é carregada
  useEffect(() => {
    if (config) {
      setFormData((prev) => ({
        ...prev,
        proxmox_host: config.proxmox_host || '',
        proxmox_user: config.proxmox_user || '',
        proxmox_token_name: config.proxmox_token_name || '',
        proxmox_node: config.proxmox_node || '',
        default_storage: config.default_storage || '',
        default_template: config.default_template || '',
      }));
      // Se já houver configuração gravada, bloqueia os campos de token com cadeado por padrão
      if (config.configured || config.proxmox_token_name) {
        setIsTokensLocked(true);
      }
    }
  }, [config]);

  // Atualiza campo do formulário
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (testResult.tested) {
      setTestResult({ tested: false, success: false });
    }
  };

  // Testar Conexão (Opcional)
  const handleTestConnection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !formData.proxmox_host.trim() ||
      !formData.proxmox_user.trim() ||
      !formData.proxmox_token_name.trim() ||
      !formData.proxmox_node.trim()
    ) {
      setTestResult({
        tested: true,
        success: false,
        message:
          'Preencha os campos de conexão (Host, Usuário, Token ID e Nó) para realizar o teste.',
      });
      return;
    }

    if (!formData.proxmox_token_value.trim()) {
      setTestResult({
        tested: true,
        success: false,
        message: config?.configured
          ? 'Para testar a conexão novamente, desbloqueie o cadeado e informe o Token Secret UUID.'
          : 'Informe o Segredo do Token (Token Secret UUID) para validar a conexão.',
      });
      return;
    }

    try {
      const res = await testConnection({
        proxmox_host: formData.proxmox_host.trim(),
        proxmox_user: formData.proxmox_user.trim(),
        proxmox_token_name: formData.proxmox_token_name.trim(),
        proxmox_token_value: formData.proxmox_token_value.trim(),
        proxmox_node: formData.proxmox_node.trim(),
      });

      setTestResult({
        tested: true,
        success: true,
        message:
          res.message ||
          res.detail ||
          'Conexão com o Proxmox VE validada e aprovada com sucesso!',
      });
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Falha ao autenticar ou conectar no Proxmox VE.';
      setTestResult({
        tested: true,
        success: false,
        message: errMsg,
      });
    }
  };

  // Salvar Configuração diretamente
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isFormIncomplete) return;

    try {
      await saveConfig({
        proxmox_host: formData.proxmox_host.trim(),
        proxmox_user: formData.proxmox_user.trim(),
        proxmox_token_name: formData.proxmox_token_name.trim(),
        proxmox_token_value: formData.proxmox_token_value.trim() || '',
        proxmox_node: formData.proxmox_node.trim(),
        default_storage: formData.default_storage.trim() || null,
        default_template: config?.default_template || null,
      });

      // Bloqueia com cadeado e limpa o valor temporário de digitação
      setIsTokensLocked(true);
      setFormData((prev) => ({ ...prev, proxmox_token_value: '' }));
      if (testResult.tested) {
        setTestResult({ tested: false, success: false });
      }
    } catch {
      // Erro é tratado no hook useAgentConfig com toast
    }
  };

  const isFormIncomplete =
    !formData.proxmox_host.trim() ||
    !formData.proxmox_user.trim() ||
    !formData.proxmox_token_name.trim() ||
    !formData.proxmox_node.trim() ||
    (!config?.configured && !formData.proxmox_token_value.trim());

  return (
    <>
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Server className="size-5 text-primary" />
            <CardTitle className="text-lg">Configuração do Proxmox VE (Agent)</CardTitle>
          </div>

          {/* Readiness Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Status do Agent:</span>
            {isReady ? (
              <Badge variant="success" className="gap-1.5 py-1 px-3">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Pronto (Configurado)
              </Badge>
            ) : isNotConfigured ? (
              <Badge
                variant="outline"
                className="gap-1.5 py-1 px-3 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium"
              >
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                Não Configurado
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 py-1 px-3">
                {readiness}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Banner Informativo se não configurado com design moderno */}
          {isNotConfigured && (
            <div className="flex items-start gap-3.5 p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 text-foreground">
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="size-4" />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-sm text-foreground">Cluster Proxmox não configurado</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O backend iniciou em modo cold-start. Recursos dependentes do Proxmox (Containers, Monitoramento, Criação)
                  ficarão disponíveis assim que você validar e salvar as credenciais de acesso abaixo.
                </p>
              </div>
            </div>
          )}

          {/* Formulário de Configuração com prevenção de autocompletar do navegador */}
          <form onSubmit={handleSaveConfig} className="space-y-6" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Host / IP */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe className="size-3.5 text-primary" />
                  Host / IP do Proxmox <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  name="no_autofill_pve_host"
                  autoComplete="new-password"
                  data-lpignore="true"
                  spellCheck={false}
                  placeholder="Ex: 192.168.1.100 ou pve.minharede.com"
                  value={formData.proxmox_host}
                  onChange={(e) => handleInputChange('proxmox_host', e.target.value)}
                  disabled={isLoadingConfig || isTesting || isSaving}
                  required
                />
                <span className="text-[11px] text-muted-foreground">
                  Endereço IP ou hostname do servidor Proxmox VE (porta padrão 8006).
                </span>
              </div>

              {/* Proxmox Node */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Radio className="size-3.5 text-primary" />
                  Nó Padrão (Node) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  name="no_autofill_pve_node"
                  autoComplete="new-password"
                  data-lpignore="true"
                  spellCheck={false}
                  placeholder="Ex: pve ou node1"
                  value={formData.proxmox_node}
                  onChange={(e) => handleInputChange('proxmox_node', e.target.value)}
                  disabled={isLoadingConfig || isTesting || isSaving}
                  required
                />
                <span className="text-[11px] text-muted-foreground">
                  Nome do nó do cluster Proxmox a ser gerenciado.
                </span>
              </div>

              {/* Usuário */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-primary" />
                  Usuário / Realm <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  name="no_autofill_pve_user"
                  autoComplete="new-password"
                  data-lpignore="true"
                  spellCheck={false}
                  placeholder="Ex: root@pam ou api-user@pve"
                  value={formData.proxmox_user}
                  onChange={(e) => handleInputChange('proxmox_user', e.target.value)}
                  disabled={isLoadingConfig || isTesting || isSaving}
                  required
                />
                <span className="text-[11px] text-muted-foreground">
                  Usuário com permissão de API no Proxmox (ex: root@pam).
                </span>
              </div>

              {/* Storage Padrão (Select Dinâmico) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <HardDrive className="size-3.5 text-primary" />
                  Storage Padrão <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span>
                </label>
                
                {isStoragesLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground h-9 px-3 rounded-md border border-input bg-muted/30">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span>Consultando storages...</span>
                  </div>
                ) : availableStorages.length > 0 ? (
                  <select
                    value={formData.default_storage}
                    onChange={(e) => handleInputChange('default_storage', e.target.value)}
                    disabled={isLoadingConfig || isTesting || isSaving}
                    className={cn(
                      'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer'
                    )}
                  >
                    <option value="">Nenhum (usar padrão do cluster)</option>
                    
                    {formData.default_storage &&
                      !availableStorages.some(
                        (s) => (s.name || s.storage) === formData.default_storage
                      ) && (
                        <option value={formData.default_storage}>
                          {formData.default_storage} (Atual)
                        </option>
                      )}

                    {availableStorages.map((s) => {
                      const sName = s.name || s.storage || '';
                      const availGb = s.avail_bytes
                        ? Math.floor(s.avail_bytes / (1024 * 1024 * 1024))
                        : 0;
                      const typeLabel = s.type ? `[${s.type}]` : '';
                      return (
                        <option key={sName} value={sName}>
                          {sName} {availGb > 0 ? `(${availGb} GB livres)` : ''} {typeLabel}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <select
                    value={formData.default_storage}
                    onChange={(e) => handleInputChange('default_storage', e.target.value)}
                    disabled={isLoadingConfig || isTesting || isSaving}
                    className={cn(
                      'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer'
                    )}
                  >
                    <option value="">Nenhum (usar padrão do cluster)</option>
                    {formData.default_storage && (
                      <option value={formData.default_storage}>{formData.default_storage}</option>
                    )}
                    <option value="local-lvm">local-lvm</option>
                    <option value="local-zfs">local-zfs</option>
                    <option value="local">local</option>
                  </select>
                )}
                <span className="text-[11px] text-muted-foreground">
                  Pool padrão para alocação de discos de containers.
                </span>
              </div>

              {/* Token Name / ID com Cadeado */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="size-3.5 text-primary" />
                    Nome do Token (Token ID) <span className="text-destructive">*</span>
                  </label>
                  {isTokensLocked && (
                    <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <Lock className="size-3" /> Bloqueado
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    name="no_autofill_pve_token_name"
                    autoComplete="new-password"
                    data-lpignore="true"
                    spellCheck={false}
                    placeholder="Ex: agent-token ou proxmox-manager"
                    value={formData.proxmox_token_name}
                    onChange={(e) => handleInputChange('proxmox_token_name', e.target.value)}
                    disabled={isTokensLocked || isLoadingConfig || isTesting || isSaving}
                    className={cn(
                      'pr-10',
                      isTokensLocked && 'bg-muted/40 cursor-not-allowed text-muted-foreground'
                    )}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsTokensLocked(!isTokensLocked)}
                    className="absolute right-1 text-muted-foreground hover:text-foreground"
                    title={
                      isTokensLocked
                        ? 'Desbloquear para alterar Token ID e Segredo'
                        : 'Bloquear campos de Token'
                    }
                  >
                    {isTokensLocked ? (
                      <Lock className="size-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Unlock className="size-4 text-primary" />
                    )}
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {isTokensLocked
                    ? 'Clique no cadeado para liberar a edição.'
                    : 'Identificador do API Token configurado no Proxmox.'}
                </span>
              </div>

              {/* Token Value / Secret com Cadeado e Olho */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="size-3.5 text-primary" />
                    Segredo do Token (Token Secret UUID) <span className="text-destructive">*</span>
                  </label>
                  {isTokensLocked && (
                    <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <Lock className="size-3" /> Bloqueado
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="no_autofill_pve_token_secret"
                    autoComplete="new-password"
                    data-lpignore="true"
                    spellCheck={false}
                    placeholder={
                      isTokensLocked && config?.configured
                        ? '•••••••••••••••••••••••••••••••• (Salvo e bloqueado)'
                        : ''
                    }
                    value={formData.proxmox_token_value}
                    onChange={(e) => handleInputChange('proxmox_token_value', e.target.value)}
                    disabled={isTokensLocked || isLoadingConfig || isTesting || isSaving}
                    className={cn(
                      'pr-20 font-mono text-xs',
                      isTokensLocked && 'bg-muted/40 cursor-not-allowed text-muted-foreground'
                    )}
                    required={!config?.configured}
                  />
                  <div className="absolute right-1 flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isTokensLocked && !formData.proxmox_token_value}
                      className="text-muted-foreground hover:text-foreground"
                      title={showPassword ? 'Ocultar segredo' : 'Exibir segredo'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setIsTokensLocked(!isTokensLocked)}
                      className="text-muted-foreground hover:text-foreground"
                      title={
                        isTokensLocked
                          ? 'Desbloquear para alterar Token ID e Segredo'
                          : 'Bloquear campos de Token'
                      }
                    >
                      {isTokensLocked ? (
                        <Lock className="size-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Unlock className="size-4 text-primary" />
                      )}
                    </Button>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {isTokensLocked
                    ? 'Token salvo com segurança. Clique no cadeado para atualizar.'
                    : 'Insira o Token Secret UUID gerado no Proxmox VE.'}
                </span>
              </div>
            </div>

            {/* Atalho / Gerenciamento de Templates LXC */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Layers className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">Templates de Containers LXC</span>
                    {typeof config?.default_template === 'string' && Boolean(config.default_template) && (
                      <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        Padrão: {config.default_template.split('/').pop() || config.default_template}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Gerencie o catálogo de SOs e escolha o template padrão clicando na estrela dentro da galeria.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsGalleryOpen(true)}
                disabled={!isReady}
                className="h-8 text-xs gap-1.5 shrink-0 border-border hover:border-primary"
              >
                <Layers className="size-3.5 text-primary" />
                Galeria de Templates
              </Button>
            </div>

            {/* Feedback de Teste */}
            {testResult.tested && (
              <div>
                {testResult.success ? (
                  <Alert variant="success" className="border-emerald-500/30 bg-emerald-500/10">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertTitle className="text-emerald-900 dark:text-emerald-300 font-semibold">
                      Conexão Verificada com Sucesso!
                    </AlertTitle>
                    <AlertDescription className="text-emerald-800 dark:text-emerald-300/90 mt-1">
                      {testResult.message || 'As credenciais foram validadas com o cluster Proxmox VE. Clique em Salvar Configuração para aplicar.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>Falha no Teste de Conexão</AlertTitle>
                    <AlertDescription className="mt-1">
                      {testResult.message || 'Não foi possível conectar ao cluster Proxmox. Verifique o IP, porta, credenciais e se o nó está acessível.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Rodapé / Botões de Ação */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                {testResult.success ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    Conexão testada com sucesso! Clique em Salvar Configuração.
                  </span>
                ) : isReady ? (
                  <span>
                    Cluster conectado. Altere as configurações ou templates e salve diretamente.
                  </span>
                ) : (
                  <span>
                    Preencha as configurações e clique em <strong className="text-foreground">Salvar Configuração</strong>.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Botão Opcional: Testar Conexão */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={
                    !formData.proxmox_host.trim() ||
                    !formData.proxmox_user.trim() ||
                    !formData.proxmox_token_name.trim() ||
                    !formData.proxmox_node.trim() ||
                    isTesting ||
                    isSaving
                  }
                  className="gap-2 flex-1 sm:flex-none border-border hover:border-primary text-foreground"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="size-4 animate-spin text-primary" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-4 text-primary" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                {/* Botão Principal: Salvar Configuração */}
                <Button
                  type="submit"
                  disabled={isFormIncomplete || isSaving || isTesting}
                  className="gap-2 flex-1 sm:flex-none"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Salvar Configuração
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Galeria de Templates Modal */}
      {isGalleryOpen && (
        <TemplateGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => {
            setIsGalleryOpen(false);
            refetchInstalledTemplates();
          }}
        />
      )}
    </>
  );
};

export default ProxmoxConfigCard;
