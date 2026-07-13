import React, { useMemo } from 'react';
import PageHeader from '@/components/common/PageHeader';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { ContainerTable, type ContainerTableRow } from '../components/ContainerTable';
import { useContainerInventory } from '../hooks';
import { useContainersMetrics } from '@/hooks/websocket/useContainersMetrics';
import { RefreshCw } from 'lucide-react';

export const ContainersPage: React.FC = () => {
  const {
    data: inventoryData,
    isPending: isInventoryPending,
    isError: isInventoryError,
    error: inventoryError,
    refetch: refetchInventory,
  } = useContainerInventory();

  const {
    data: metricsData,
    loading: isMetricsPending,
  } = useContainersMetrics();

  // Combine loading states
  const isLoading = isInventoryPending || (isMetricsPending && !metricsData);
  const isError = isInventoryError;

  // Manual refresh helper
  const handleRefresh = () => {
    refetchInventory();
  };

  // Merge inventory and metrics data by container_id
  const mergedContainers = useMemo<ContainerTableRow[]>(() => {
    if (!inventoryData?.containers) return [];

    return inventoryData.containers.map((container) => {
      const metrics = metricsData?.find(
        (m) => m.container_id === container.container_id
      );
      return {
        ...container,
        metrics,
      };
    });
  }, [inventoryData, metricsData]);

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
        <Error
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
            <Button size="sm">Novo Container</Button>
          </div>
        }
      />

      {mergedContainers.length === 0 ? (
        <EmptyState
          title="Nenhum container encontrado"
          description="Não há containers LXC provisionados neste cluster."
          action={<Button onClick={handleRefresh}>Recarregar dados</Button>}
        />
      ) : (
        <ContainerTable data={mergedContainers} isLoading={isLoading} />
      )}
    </div>
  );
};

export default ContainersPage;
