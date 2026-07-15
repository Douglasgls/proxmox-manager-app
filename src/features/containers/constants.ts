import type { AvailableComponent, CreateContainerDTO } from './types';

/**
 * Componentes disponíveis para instalação durante a criação do container.
 */
export const AVAILABLE_COMPONENTS: AvailableComponent[] = [
  {
    id: 'curl',
    name: 'cURL',
    description: 'Ferramenta de transferência de dados via URLs',
    icon: 'Globe',
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Sistema de controle de versão distribuído',
    icon: 'GitBranch',
  },
  {
    id: 'tailscale',
    name: 'Tailscale',
    description: 'VPN mesh de configuração zero',
    icon: 'Shield',
  },
];

/**
 * Valores padrão do formulário de criação de container.
 */
export const DEFAULT_CONTAINER_VALUES: Omit<CreateContainerDTO, 'password'> = {
  name: '',
  cpu: 1,
  memory_mb: 512,
  disk_gb: 2,
  image_name: '',
  bridge: 'vmbr0',
  ip_mode: 'dhcp',
  ip_address: null,
  cidr: null,
  gateway: null,
  firewall: false,
  mtu: null,
  vlan: null,
  mac_address: null,
  components: [],
};

/**
 * Steps do wizard de criação de container.
 */
export const WIZARD_STEPS = [
  { id: 'basic', label: 'Básico', description: 'Nome, imagem e senha' },
  { id: 'resources', label: 'Recursos', description: 'CPU, memória e disco' },
  { id: 'network', label: 'Rede', description: 'Configuração de rede' },
  { id: 'components', label: 'Componentes', description: 'Pacotes extras' },
  { id: 'review', label: 'Revisão', description: 'Confirmar e criar' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];
