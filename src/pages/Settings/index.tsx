import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import { ProxmoxConfigCard } from './components/ProxmoxConfigCard';
import { SystemActionsCard } from './components/SystemActionsCard';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações do Sistema"
        description="Ajuste os parâmetros de conexão e armazenamento do Proxmox VE (Agent)."
      />

      <div className="w-full space-y-6">
        {/* Card de Configuração Dinâmica do Proxmox VE (Agent) */}
        <ProxmoxConfigCard />
        
        {/* Card de Ações do Sistema (Reiniciar API) */}
        <SystemActionsCard />
      </div>
    </div>
  );
};
export default Settings;
