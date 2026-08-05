import React, { useState, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  X,
  Search,
  Download,
  Trash2,
  Layers,
  CheckCircle2,
  HardDrive,
  Filter,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Package,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/utils/bytes';
import {
  useAvailableTemplates,
  useInstalledTemplates,
  useDownloadTemplate,
  useDeleteTemplate,
} from '../hooks';
import type { TemplateImage } from '../types';
import { extractErrorMessage } from '@/utils/error';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mapeamento de cores e labels para distribuições Linux
const DISTRO_CONFIG: Record<
  string,
  { name: string; badgeClass: string; color: string }
> = {
  ubuntu: {
    name: 'Ubuntu',
    badgeClass: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    color: '#E95420',
  },
  debian: {
    name: 'Debian',
    badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
    color: '#A80030',
  },
  alpine: {
    name: 'Alpine Linux',
    badgeClass: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    color: '#0D597F',
  },
  fedora: {
    name: 'Fedora',
    badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    color: '#51A2DA',
  },
  centos: {
    name: 'CentOS',
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    color: '#262577',
  },
  archlinux: {
    name: 'Arch Linux',
    badgeClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    color: '#1793D1',
  },
  arch: {
    name: 'Arch Linux',
    badgeClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    color: '#1793D1',
  },
  rockylinux: {
    name: 'Rocky Linux',
    badgeClass: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    color: '#10B981',
  },
  almalinux: {
    name: 'AlmaLinux',
    badgeClass: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    color: '#6366F1',
  },
};

const DISTRO_OPTIONS = [
  { id: 'all', label: 'Todas Distribuições' },
  { id: 'ubuntu', label: 'Ubuntu' },
  { id: 'debian', label: 'Debian' },
  { id: 'alpine', label: 'Alpine Linux' },
  { id: 'fedora', label: 'Fedora' },
  { id: 'centos', label: 'CentOS' },
  { id: 'arch', label: 'Arch Linux' },
  { id: 'rocky', label: 'Rocky Linux' },
  { id: 'alma', label: 'AlmaLinux' },
];

const getDistroConfig = (distroRaw: string) => {
  const key = (distroRaw || '').toLowerCase().replace(/[^a-z]/g, '');
  for (const distroKey of Object.keys(DISTRO_CONFIG)) {
    if (key.includes(distroKey)) {
      return DISTRO_CONFIG[distroKey];
    }
  }
  return {
    name: distroRaw || 'Linux',
    badgeClass: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    color: '#6B7280',
  };
};

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'installed'>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistro, setSelectedDistro] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [storageLocation, setStorageLocation] = useState<string>('local');
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<TemplateImage | null>(null);

  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Fecha o popover de filtro ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  // Controle de estado do download
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Queries
  const {
    data: availableTemplates = [],
    isPending: isAvailableLoading,
    isError: isAvailableError,
    refetch: refetchAvailable,
  } = useAvailableTemplates();

  const {
    data: installedTemplates = [],
    isPending: isInstalledLoading,
    isError: isInstalledError,
    refetch: refetchInstalled,
  } = useInstalledTemplates();

  // Mutations
  const downloadMutation = useDownloadTemplate();
  const deleteMutation = useDeleteTemplate();

  // Conjunto de filenames instalados para checagem rápida
  const installedFilenamesSet = useMemo(() => {
    return new Set(installedTemplates.map((t) => t.filename || t.name));
  }, [installedTemplates]);

  // Filtro de lista
  const filteredTemplates = useMemo(() => {
    const list = activeTab === 'available' ? availableTemplates : installedTemplates;

    return list.filter((template) => {
      // Filtro de busca por texto
      const text = `${template.name} ${template.filename} ${template.distribution} ${template.version} ${template.description || ''}`.toLowerCase();
      const matchesSearch = !searchQuery || text.includes(searchQuery.toLowerCase());

      // Filtro de distro
      const distroClean = (template.distribution || '').toLowerCase();
      const matchesDistro =
        selectedDistro === 'all' || distroClean.includes(selectedDistro.toLowerCase());

      return matchesSearch && matchesDistro;
    });
  }, [activeTab, availableTemplates, installedTemplates, searchQuery, selectedDistro]);

  // Manipulador de Download
  const handleDownload = async (template: TemplateImage) => {
    const key = template.filename || template.name;
    setErrorMessage(null);
    setSuccessMessage(null);
    setDownloadingKey(key);

    try {
      await downloadMutation.mutateAsync({
        storage: storageLocation,
        template: key,
      });

      setSuccessMessage(`Template "${template.name || key}" baixado com sucesso no storage ${storageLocation}!`);
      refetchInstalled();
      refetchAvailable();
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, 'Erro ao iniciar download do template.'));
    } finally {
      setDownloadingKey(null);
    }
  };

  // Manipulador de Exclusão
  const handleDelete = async (template: TemplateImage) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await deleteMutation.mutateAsync(template.filename || template.name);
      setSuccessMessage(`Template "${template.name || template.filename}" removido com sucesso.`);
      setDeleteConfirmTemplate(null);
      refetchInstalled();
      refetchAvailable();
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, 'Erro ao remover template do storage.'));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Principal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto w-full max-w-4xl max-h-[85vh] flex flex-col',
            'bg-card border border-border rounded-2xl shadow-2xl overflow-hidden',
            'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <Layers className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  Galeria de Templates LXC
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                    Proxmox OS Store
                  </Badge>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Seletor de Storage destino */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border/60 px-2.5 py-1 rounded-lg">
                <HardDrive className="size-3.5 text-primary shrink-0" />
                <span className="font-medium text-[11px]">Storage:</span>
                <select
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className="bg-transparent text-foreground font-semibold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="local">local (Default)</option>
                  <option value="local-lzma">local-lzma</option>
                </select>
              </div>

              <button
                onClick={onClose}
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Subheader: Abas & Pesquisa com Filtro em Ícone Popover */}
          <div className="px-6 py-3 border-b border-border/50 bg-background/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/40 text-xs font-medium">
              <button
                onClick={() => setActiveTab('available')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200',
                  activeTab === 'available'
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sparkles className="size-3.5 text-amber-500" />
                Catálogo Completo
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {availableTemplates.length}
                </Badge>
              </button>

              <button
                onClick={() => setActiveTab('installed')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200',
                  activeTab === 'installed'
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Package className="size-3.5 text-green-500" />
                Instalados no Cluster
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {installedTemplates.length}
                </Badge>
              </button>
            </div>

            {/* Campo de Pesquisa com Ícone de Filtro (Popover) no canto direito */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou versão..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-7 rounded-lg border border-border bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Botão de Ícone de Filtro com Card Popover */}
              <div className="relative" ref={filterPopoverRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  title="Filtrar por distribuição"
                  className={cn(
                    'size-8 rounded-lg border flex items-center justify-center transition-all duration-150',
                    selectedDistro !== 'all'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Filter className="size-4" />
                </button>

                {/* Popover Card de Filtro */}
                {isFilterOpen && (
                  <div className="absolute right-0 top-10 z-50 w-52 bg-card border border-border rounded-xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                    <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 mb-1 flex items-center justify-between">
                      <span>Filtrar Distribuição</span>
                      {selectedDistro !== 'all' && (
                        <button
                          onClick={() => setSelectedDistro('all')}
                          className="text-[10px] text-primary hover:underline font-normal capitalize"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    {DISTRO_OPTIONS.map((opt) => {
                      const isSelected = selectedDistro === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSelectedDistro(opt.id);
                            setIsFilterOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left',
                            isSelected
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted text-foreground'
                          )}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="size-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Banner de Sucesso */}
          {successMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-500 hover:opacity-80"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Erro global no topo do modal */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="ml-auto text-destructive hover:opacity-80"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Conteúdo Principal / Grid de Templates */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {(activeTab === 'available' ? isAvailableLoading : isInstalledLoading) ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs font-medium">Carregando catálogo de templates...</p>
              </div>
            ) : (activeTab === 'available' ? isAvailableError : isInstalledError) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="size-8 text-destructive mb-2" />
                <p className="text-sm font-semibold text-foreground">Falha ao obter templates</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Não foi possível conectar ao repositório Proxmox.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    activeTab === 'available' ? refetchAvailable() : refetchInstalled()
                  }
                  className="gap-2"
                >
                  <RefreshCw className="size-3.5" />
                  Tentar Novamente
                </Button>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <Package className="size-10 mb-2 opacity-40 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Nenhum template encontrado</p>
                <p className="text-xs mt-1 max-w-xs">
                  Tente alterar os termos da busca ou selecione outro filtro de distribuição.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => {
                  const key = template.filename || template.name;
                  const distroInfo = getDistroConfig(template.distribution || template.name);
                  const isInstalled =
                    template.downloaded || installedFilenamesSet.has(key);
                  const isDownloading = downloadingKey === key;

                  return (
                    <div
                      key={key}
                      className={cn(
                        'flex flex-col justify-between p-4 rounded-xl border transition-all duration-200',
                        'bg-card/80 hover:bg-card hover:shadow-md border-border/60 hover:border-primary/40',
                        isDownloading && 'border-primary/50 bg-primary/5 shadow-md'
                      )}
                    >
                      <div>
                        {/* Top header do card */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-3.5 rounded-full inline-block shrink-0 shadow-sm mt-0.5"
                              style={{ backgroundColor: distroInfo.color }}
                            />
                            <h3 className="text-sm font-bold text-foreground leading-snug break-words">
                              {template.name || template.distribution}
                            </h3>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-semibold px-2 py-0.5 border shrink-0', distroInfo.badgeClass)}
                          >
                            {distroInfo.name}
                          </Badge>
                        </div>

                        {/* Detalhes técnicos */}
                        <div
                          className={cn(
                            'grid gap-2 py-2.5 border-y border-border/40 text-[11px] text-muted-foreground mb-3',
                            isInstalled ? 'grid-cols-3' : 'grid-cols-2'
                          )}
                        >
                          <div>
                            <span className="block text-[10px] uppercase font-semibold text-muted-foreground/70">
                              Versão
                            </span>
                            <strong className="text-foreground font-mono">
                              {template.version || '-'}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-semibold text-muted-foreground/70">
                              Arquitetura
                            </span>
                            <strong className="text-foreground font-mono">
                              {template.architecture || 'amd64'}
                            </strong>
                          </div>
                          {isInstalled && (
                            <div>
                              <span className="block text-[10px] uppercase font-semibold text-muted-foreground/70">
                                Tamanho
                              </span>
                              <strong className="text-foreground font-mono">
                                {template.size ? formatBytes(template.size) : '-'}
                              </strong>
                            </div>
                          )}
                        </div>

                        {/* Banner de Espera / Animação Criativa ao Baixar */}
                        {isDownloading && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium animate-pulse mb-3">
                            <Loader2 className="size-4 animate-spin shrink-0" />
                            <span>Baixando e gravando a imagem no storage <strong>{storageLocation}</strong>... Aguarde um momento.</span>
                          </div>
                        )}
                      </div>

                      {/* Footer do Card com Botões */}
                      <div className="flex items-center justify-between pt-1">
                        {isInstalled ? (
                          <div className="flex items-center gap-1.5 text-xs text-green-500 font-semibold bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">
                            <CheckCircle2 className="size-3.5" />
                            Instalado
                          </div>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          {isInstalled && activeTab === 'installed' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deleteMutation.isPending || isDownloading}
                              onClick={() => setDeleteConfirmTemplate(template)}
                              className="h-8 text-xs gap-1.5 px-3"
                            >
                              <Trash2 className="size-3.5" />
                              Excluir
                            </Button>
                          )}

                          {!isInstalled && (
                            <Button
                              size="sm"
                              disabled={downloadMutation.isPending || isDownloading}
                              onClick={() => handleDownload(template)}
                              className={cn(
                                'h-8 text-xs gap-1.5 px-3 transition-all',
                                isDownloading && 'bg-primary/20 text-primary border border-primary/30'
                              )}
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" />
                                  Baixando...
                                </>
                              ) : (
                                <>
                                  <Download className="size-3.5" />
                                  Baixar
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer do Modal */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground shrink-0">
            <span>
              Mostrando <strong className="text-foreground">{filteredTemplates.length}</strong> de{' '}
              <strong className="text-foreground">
                {activeTab === 'available' ? availableTemplates.length : installedTemplates.length}
              </strong>{' '}
              templates
            </span>

            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Fechar
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog de Exclusão */}
      {deleteConfirmTemplate && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="size-6 shrink-0" />
              <h4 className="text-base font-bold text-foreground">Excluir Template?</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja remover o template{' '}
              <strong className="text-foreground font-mono">{deleteConfirmTemplate.name || deleteConfirmTemplate.filename}</strong>{' '}
              do storage <strong className="text-foreground">{storageLocation}</strong>? Essa ação liberará espaço em disco.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmTemplate(null)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(deleteConfirmTemplate)}
                disabled={deleteMutation.isPending}
                className="gap-1.5"
              >
                {deleteMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateGalleryModal;
