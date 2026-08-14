import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useCatalogComponents } from '../hooks';
import type { CatalogComponent, ComponentItem, DockerAppConfig } from '../types';
import { DockerAppConfigModal } from './DockerAppConfigModal';
import dockerIcon from '@/assets/docker.webp';
import {
  Database,
  Code2,
  GitBranch,
  Globe,
  Shield,
  Package,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Settings,
  AlertTriangle,
} from 'lucide-react';

const getComponentIcon = (component: CatalogComponent): React.ComponentType<{ className?: string }> => {
  const slug = component.slug.toLowerCase();
  const category = component.category.toLowerCase();

  if (slug.includes('postgres') || slug.includes('sql') || slug.includes('db') || category === 'database') {
    return Database;
  }
  if (slug.includes('python') || slug.includes('node') || slug.includes('go') || category.includes('program') || category.includes('lang')) {
    return Code2;
  }
  if (slug.includes('git')) {
    return GitBranch;
  }
  if (slug.includes('tailscale') || slug.includes('vpn')) {
    return Shield;
  }
  if (slug.includes('curl') || slug.includes('web')) {
    return Globe;
  }
  return Package;
};

// Helper utilities for ComponentItem
const getSlug = (item: ComponentItem): string => {
  return typeof item === 'string' ? item : item.slug;
};

// Helper function to check if component has missing required env vars
const checkMissingRequiredEnv = (component: CatalogComponent, config?: DockerAppConfig): boolean => {
  const isDocker = component.category.toLowerCase().includes('docker');
  if (!isDocker) return false;
  const envSchema = component.metadata?.env_vars_schema || [];
  const requiredVars = envSchema.filter((s) => s.required);
  if (requiredVars.length === 0) return false;
  const envValues = config?.env || {};
  return requiredVars.some((s) => !envValues[s.name] || envValues[s.name].trim() === '');
};

interface ComponentSelectorProps {
  selected: ComponentItem[];
  onChange: (components: ComponentItem[]) => void;
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  selected,
  onChange,
}) => {
  const { data: catalogComponents, isPending, isError, refetch } = useCatalogComponents();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State for Docker App config modal
  const [configuringComponent, setConfiguringComponent] = useState<CatalogComponent | null>(null);

  // Derive category tabs dynamically from API response (excluding hardcoded 'all')
  const categoryTabs = useMemo(() => {
    if (!catalogComponents) return [];

    const rawCategories = Array.from(new Set(catalogComponents.map((c) => c.category).filter(Boolean)));

    const categoryLabelMap: Record<string, string> = {
      native: 'Native',
      docker_apps: 'Docker Apps',
      docker: 'Docker Apps',
      database: 'Database',
      db: 'Database',
      programming: 'Programming',
      programming_language: 'Programming',
      language: 'Programming',
    };

    const dynamicTabs = rawCategories.map((cat) => {
      const key = cat.toLowerCase();
      return {
        id: key,
        label: categoryLabelMap[key] || cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      };
    });

    // Remove duplicates by label (e.g. if 'docker_apps' and 'docker' map to 'Docker Apps')
    const uniqueTabs: { id: string; label: string }[] = [];
    dynamicTabs.forEach((tab) => {
      if (!uniqueTabs.some((t) => t.id === tab.id)) {
        uniqueTabs.push(tab);
      }
    });

    return uniqueTabs;
  }, [catalogComponents]);

  // Define a categoria inicial automaticamente como a primeira vinda do backend
  useEffect(() => {
    if (categoryTabs.length > 0 && (!selectedCategory || !categoryTabs.some((t) => t.id === selectedCategory))) {
      setSelectedCategory(categoryTabs[0].id);
    }
  }, [categoryTabs, selectedCategory]);

  const isComponentSelected = (slug: string): boolean => {
    return selected.some((item) => getSlug(item) === slug);
  };

  const getComponentConfig = (slug: string): DockerAppConfig | undefined => {
    const item = selected.find((i) => getSlug(i) === slug);
    return item && typeof item === 'object' ? item.config : undefined;
  };

  const toggleComponent = (component: CatalogComponent) => {
    const slug = component.slug;
    const isDocker = component.category.toLowerCase().includes('docker');

    if (isComponentSelected(slug)) {
      onChange(selected.filter((item) => getSlug(item) !== slug));
    } else {
      if (isDocker) {
        const defaultIntPort = component.metadata?.default_config?.container_port || component.default_config?.container_port || component.metadata?.default_config?.host_port || component.default_config?.host_port || 80;
        const defaultHPort = component.metadata?.default_config?.host_port || component.default_config?.host_port || defaultIntPort;
        const defaultDockerItem: ComponentItem = {
          slug,
          config: {
            host_port: defaultHPort,
          },
        };
        onChange([...selected, defaultDockerItem]);

        // If component has required env vars that need configuration, automatically open modal!
        if (checkMissingRequiredEnv(component, defaultDockerItem.config)) {
          setConfiguringComponent(component);
        }
      } else {
        onChange([...selected, slug]);
      }
    }
  };

  const handleSaveDockerConfig = (config: DockerAppConfig) => {
    if (!configuringComponent) return;
    const slug = configuringComponent.slug;

    const newItem: ComponentItem = {
      slug,
      config,
    };

    if (isComponentSelected(slug)) {
      onChange(selected.map((item) => (getSlug(item) === slug ? newItem : item)));
    } else {
      onChange([...selected, newItem]);
    }
  };

  const filteredComponents = useMemo(() => {
    if (!catalogComponents) return [];
    const activeComponents = catalogComponents.filter((c) => c.is_active !== false);

    const activeCat = selectedCategory || (categoryTabs[0]?.id ?? '');

    return activeComponents.filter((c) => {
      const cat = c.category.toLowerCase();
      const slug = c.slug.toLowerCase();
      const name = c.name.toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      const matchesCategory =
        cat === activeCat || (activeCat === 'docker_apps' && cat.includes('docker'));

      const matchesSearch =
        !query || name.includes(query) || slug.includes(query) || desc.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [catalogComponents, selectedCategory, categoryTabs, searchQuery]);

  const sortedComponents = useMemo(() => {
    return [...filteredComponents].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredComponents]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Carregando catálogo de componentes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 border border-destructive/20 rounded-xl bg-destructive/5 text-center">
        <AlertCircle className="size-6 text-destructive" />
        <p className="text-xs font-medium text-destructive">Erro ao carregar componentes</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 transition-opacity"
        >
          <RefreshCw className="size-3" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Tabs & Search Bar Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Dynamic Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categoryTabs.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0 capitalize',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar pacote..."
            className="w-full h-8 pl-8 pr-7 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Component Cards */}
      {sortedComponents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl text-center">
          <Package className="size-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">Nenhum componente encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tente mudar a categoria ou limpar o termo de busca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedComponents.map((component) => {
            const isSelected = isComponentSelected(component.slug);
            const isDockerApp = component.category.toLowerCase().includes('docker');
            const Icon = getComponentIcon(component);
            const customConfig = getComponentConfig(component.slug);
            const hasMissingEnv = isDockerApp && isSelected && checkMissingRequiredEnv(component, customConfig);

            const displayInternalPort = customConfig?.container_port || component.metadata?.default_config?.container_port || component.default_config?.container_port || component.metadata?.default_config?.host_port || component.default_config?.host_port || customConfig?.host_port || 80;

            return (
              <div
                key={component.id || component.slug}
                onClick={() => toggleComponent(component)}
                className={cn(
                  'relative flex flex-col justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left group',
                  isSelected
                    ? hasMissingEnv
                      ? 'border-[#EED202]/80 bg-[#EED202]/5 dark:bg-[#EED202]/10 shadow-sm shadow-[#EED202]/20'
                      : 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40'
                )}
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          'size-10 rounded-lg flex items-center justify-center transition-colors duration-200',
                          isSelected
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'bg-muted text-muted-foreground group-hover:text-foreground'
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      {/* Small Docker badge if category is docker_apps */}
                      {isDockerApp && (
                        <img
                          src={dockerIcon}
                          alt="Docker App"
                          className="absolute -bottom-1 -right-1 size-4 object-contain rounded-full bg-card p-0.5 shadow-xs border border-border"
                          title="Aplicação Docker"
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            'text-sm font-semibold block transition-colors duration-200',
                            isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        >
                          {component.name}
                        </span>
                      </div>
                      {component.version && (
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground inline-block mt-0.5">
                          v{component.version}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Gear Settings for Docker (pulsing #EED202 if required env missing) & Check Indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isDockerApp && (
                      <button
                        type="button"
                        title={hasMissingEnv ? "⚠️ Configurações obrigatórias pendentes! Clique para ajustar." : "Configurar Aplicação Docker"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfiguringComponent(component);
                        }}
                        className={cn(
                          'size-7 rounded-lg flex items-center justify-center transition-all duration-200',
                          hasMissingEnv
                            ? 'bg-[#EED202]/20 text-[#EED202] border border-[#EED202]/50 animate-pulse ring-2 ring-[#EED202]/40 shadow-md shadow-[#EED202]/20'
                            : isSelected
                              ? 'bg-primary/15 text-primary hover:bg-primary/20'
                              : 'bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <Settings className="size-3.5" />
                      </button>
                    )}

                    <div
                      className={cn(
                        'size-5 rounded-full flex items-center justify-center transition-all duration-200 shrink-0',
                        isSelected
                          ? hasMissingEnv
                            ? 'bg-[#EED202] text-black font-bold scale-100'
                            : 'bg-primary text-primary-foreground scale-100'
                          : 'bg-muted border border-border scale-90 opacity-50'
                      )}
                    >
                      {isSelected && <Check className="size-3" strokeWidth={3} />}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-1">
                  <span className="text-[11px] text-muted-foreground leading-relaxed block line-clamp-2">
                    {component.description}
                  </span>
                </div>

                {/* Footer: Dynamic uppercase category tag & Docker config badge */}
                <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground/80 tracking-wider">
                    {component.category ? component.category.toUpperCase() : 'NATIVE'}
                  </span>

                  {isDockerApp && isSelected && customConfig && (
                    <div className="flex items-center gap-1">
                      {hasMissingEnv ? (
                        <span className="text-[10px] font-mono font-bold text-[#EED202] bg-[#EED202]/10 px-1.5 py-0.5 rounded border border-[#EED202]/30 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="size-3 text-[#EED202]" /> Configuração Pendente
                        </span>
                      ) : (
                        <>
                          {customConfig.env && Object.keys(customConfig.env).length > 0 && (
                            <span className="text-[10px] font-mono font-semibold text-[#EED202] bg-[#EED202]/10 px-1.5 py-0.5 rounded border border-[#EED202]/30">
                              🔒 {Object.keys(customConfig.env).length} Env
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 truncate max-w-[160px]">
                            {customConfig.host_port}:{displayInternalPort}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Docker Configuration Modal */}
      <DockerAppConfigModal
        isOpen={!!configuringComponent}
        onClose={() => setConfiguringComponent(null)}
        component={configuringComponent}
        initialConfig={configuringComponent ? getComponentConfig(configuringComponent.slug) : undefined}
        currentlySelectedItems={selected}
        onSave={handleSaveDockerConfig}
      />
    </div>
  );
};
