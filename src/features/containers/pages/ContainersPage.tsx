import React, { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import Loading from '@/components/common/Loading';
import ErrorAlert from '@/components/common/Error';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { ContainerTable } from '../components/ContainerTable';
import { CreateContainerModal } from '../components/CreateContainerModal';
import { TemplateGalleryModal } from '../components/TemplateGalleryModal';
import { useContainerInventory } from '../hooks';
import { RefreshCw, Plus, Layers } from 'lucide-react';

export const ContainersPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);

  const {
    data: inventoryData,
    isPending: isLoading,
    isError,
    error: inventoryError,
    refetch: refetchInventory,
  } = useContainerInventory();

  // Manual refresh helper
  const handleRefresh = () => {
    refetchInventory();
  };

  const handleContainerCreated = () => {
    // Refetch inventory to show the newly created container
    refetchInventory();
  };

  const containers = inventoryData?.containers || [];

  if (isLoading && !inventoryData) {
    return <Loading message="Buscando informações dos containers..." />;
  }

  if (isError) {
    const errorMsg = inventoryError instanceof Error ? inventoryError.message : 'Falha na conexão com o servidor.';
    return (
      <div className="space-y-6">
        <PageHeader
          title="Containers"
          description="Monitore e gerencie seus containers LXC no cluster."
        />
        <ErrorAlert
          title="Erro ao carregar dados"
          message={errorMsg}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Containers"
        description="Listagem de LXC no Cluster Proxmox."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="size-4" />
              Recarregar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateGalleryOpen(true)}
              className="gap-2"
            >
              <Layers className="size-4 text-primary" />
              Galeria de Templates
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="size-4" />
              Novo Container
            </Button>
          </div>
        }
      />

      {containers.length === 0 ? (
        <EmptyState
          title="Nenhum container encontrado"
          description="Não há containers LXC provisionados neste cluster."
          action={<Button onClick={handleRefresh}>Recarregar dados</Button>}
        />
      ) : (
        <ContainerTable data={containers} isLoading={isLoading} />
      )}

      {/* Modal de criação de container */}
      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onContainerCreated={handleContainerCreated}
      />

      {/* Modal Galeria de Templates */}
      <TemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
      />
    </div>
  );
};

export default ContainersPage;
