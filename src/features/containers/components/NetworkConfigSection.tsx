import React from 'react';
import { cn } from '@/lib/utils';
import type { IpMode } from '../types';
import { Network, Wifi, Globe, Shield, Loader2 } from 'lucide-react';

interface NetworkBridge {
  name: string;
  active: boolean;
}

interface NetworkConfigSectionProps {
  ipMode: IpMode;
  bridge: string;
  ipAddress: string | null;
  cidr: string | null;
  gateway: string | null;
  firewall: boolean;
  mtu: number | null;
  vlan: number | null;
  macAddress: string | null;
  bridges: NetworkBridge[];
  isBridgesLoading: boolean;
  onIpModeChange: (mode: IpMode) => void;
  onBridgeChange: (val: string) => void;
  onIpAddressChange: (val: string | null) => void;
  onCidrChange: (val: string | null) => void;
  onGatewayChange: (val: string | null) => void;
  onFirewallChange: (val: boolean) => void;
  onMtuChange: (val: number | null) => void;
  onVlanChange: (val: number | null) => void;
  onMacAddressChange: (val: string | null) => void;
}

const inputClasses =
  'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200';

export const NetworkConfigSection: React.FC<NetworkConfigSectionProps> = ({
  ipMode,
  bridge,
  ipAddress,
  cidr,
  gateway,
  firewall,
  mtu,
  vlan,
  macAddress,
  bridges,
  isBridgesLoading,
  onIpModeChange,
  onBridgeChange,
  onIpAddressChange,
  onCidrChange,
  onGatewayChange,
  onFirewallChange,
  onMtuChange,
  onVlanChange,
  onMacAddressChange,
}) => {
  return (
    <div className="space-y-5">
      {/* Bridge */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Network className="size-3.5 text-muted-foreground" />
          Bridge de Rede
        </label>
        {isBridgesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            Carregando bridges...
          </div>
        ) : (
          <select
            value={bridge}
            onChange={(e) => onBridgeChange(e.target.value)}
            className={cn(inputClasses, 'cursor-pointer')}
          >
            <option value="">Selecione uma bridge</option>
            {bridges.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name} {b.active ? '(Ativa)' : '(Inativa)'}
              </option>
            ))}
            {/* Garantir que vmbr0 esteja listada se a lista estiver vazia ou se não contiver vmbr0 */}
            {!bridges.some(b => b.name === 'vmbr0') && (
              <option value="vmbr0">vmbr0 (Padrão)</option>
            )}
          </select>
        )}
      </div>

      {/* IP Mode Toggle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Wifi className="size-3.5 text-muted-foreground" />
          Modo de IP
        </label>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => onIpModeChange('dhcp')}
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-all duration-200',
              ipMode === 'dhcp'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            DHCP (Automático)
          </button>
          <button
            type="button"
            onClick={() => onIpModeChange('static')}
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-all duration-200 border-l border-border',
              ipMode === 'static'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            Estático
          </button>
        </div>
      </div>

      {/* Static IP Fields */}
      {ipMode === 'static' && (
        <div className="space-y-4 pl-3 border-l-2 border-primary/30 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Globe className="size-3.5 text-muted-foreground" />
                Endereço IP
              </label>
              <input
                type="text"
                value={ipAddress || ''}
                onChange={(e) => onIpAddressChange(e.target.value || null)}
                placeholder="192.168.1.100"
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">CIDR</label>
              <input
                type="text"
                value={cidr || ''}
                onChange={(e) => onCidrChange(e.target.value || null)}
                placeholder="24"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Gateway</label>
            <input
              type="text"
              value={gateway || ''}
              onChange={(e) => onGatewayChange(e.target.value || null)}
              placeholder="192.168.1.1"
              className={inputClasses}
            />
          </div>
        </div>
      )}

      {/* Firewall Toggle */}
      <div className="flex items-center justify-between py-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Shield className="size-3.5 text-muted-foreground" />
          Firewall
        </label>
        <button
          type="button"
          onClick={() => onFirewallChange(!firewall)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20',
            firewall ? 'bg-primary' : 'bg-muted'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              firewall ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Advanced Network (collapsible) */}
      <details className="group">
        <summary className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors duration-200 select-none">
          Configurações avançadas ▸
        </summary>
        <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">MTU</label>
              <input
                type="number"
                value={mtu ?? ''}
                onChange={(e) => onMtuChange(e.target.value ? Number(e.target.value) : null)}
                placeholder="1500"
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">VLAN Tag</label>
              <input
                type="number"
                value={vlan ?? ''}
                onChange={(e) => onVlanChange(e.target.value ? Number(e.target.value) : null)}
                placeholder="Nenhum"
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">MAC Address</label>
              <input
                type="text"
                value={macAddress || ''}
                onChange={(e) => onMacAddressChange(e.target.value || null)}
                placeholder="Auto"
                className={inputClasses}
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};
