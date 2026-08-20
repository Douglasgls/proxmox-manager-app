import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useCloudDetails } from '@/hooks/useCloudDetails';
import { NodeTable } from '@/components/monitoring/NodeTable';

export const Monitoring: React.FC = () => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useCloudDetails();

  const nodes = data?.nodes || [];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Monitoring"
        description="Monitoramento em tempo real do ambiente Cloud, conexões VPN e containers publicados."
      />

      {/* Seção Principal: Lista de Nodes e Recursos VPN/Containers */}
      <div className="space-y-3">
        <NodeTable
          nodes={nodes}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRefresh={() => refetch()}
        />
      </div>
    </div>
  );
};

export default Monitoring;
