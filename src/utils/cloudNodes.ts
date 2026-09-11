import type { CloudNode } from '@/api/modules/cloudApi';

/**
 * Extrai o endereço IPv4 limpo a partir de qualquer string, array ou texto multilinha (Tailscale IP).
 * Remove IPv6, máscaras CIDR (/32), quebras de linha e espaços.
 */
export const extractIpv4 = (rawIp?: any): string => {
  if (!rawIp) return '';

  let lines: string[] = [];
  if (Array.isArray(rawIp)) {
    lines = rawIp.map(String);
  } else if (typeof rawIp === 'string') {
    lines = rawIp.split(/[\n,\s]+/);
  } else {
    lines = [String(rawIp)];
  }

  for (const line of lines) {
    const clean = line.split('/')[0].trim();
    // Identifica IPv4 (contém ponto e não contém dois pontos)
    if (clean.includes('.') && !clean.includes(':')) {
      return clean.toLowerCase();
    }
  }

  return '';
};

// Alias para compatibilidade
export const normalizeIpv4 = extractIpv4;

/**
 * Extrai todas as variações de nomes possíveis de um CloudNode em minúsculo e sem domínio FQDN.
 */
export const extractNodeNames = (node: Partial<CloudNode> & { [key: string]: any }): string[] => {
  const rawNames = [
    node.container_name,
    node.name,
    node.hostname,
    node.device_name,
    node.given_name,
  ].filter((n): n is string => typeof n === 'string' && n.trim().length > 0);

  const nameSet = new Set<string>();
  for (const raw of rawNames) {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) continue;
    nameSet.add(trimmed);

    // Se for FQDN (ex: "teste.headscale.net"), adiciona também a parte inicial ("teste")
    if (trimmed.includes('.')) {
      const shortName = trimmed.split('.')[0].trim();
      if (shortName.length > 0) {
        nameSet.add(shortName);
      }
    }
  }

  return Array.from(nameSet);
};

/**
 * Identifica com robustez se o nó é um container Proxmox.
 */
export const isContainerNode = (node: Partial<CloudNode> & { [key: string]: any }): boolean => {
  const type = String(node.node_type || '').trim().toLowerCase();
  if (type === 'container') return true;
  if (node.proxmox_container_id !== undefined && node.proxmox_container_id !== null && Number(node.proxmox_container_id) > 0) {
    return true;
  }
  if (node.api_local_container_id !== undefined && node.api_local_container_id !== null && String(node.api_local_container_id).trim() !== '') {
    return true;
  }
  return false;
};

/**
 * Avalia o status online do nó levando em conta booleans, strings e timestamp de last_seen.
 */
export const isNodeOnline = (node: Partial<CloudNode> & { [key: string]: any }): boolean => {
  const val = (node as any).online;
  if (val === true || val === 'true' || val === 1 || val === '1') {
    return true;
  }
  if (val === false || val === 'false' || val === 0 || val === '0') {
    return false;
  }
  // Se online não veio preenchido, verifica se last_seen é recente (< 3 minutos)
  if (node.last_seen && typeof node.last_seen === 'string') {
    try {
      const lastSeenDate = new Date(node.last_seen);
      const diffMinutes = (Date.now() - lastSeenDate.getTime()) / (1000 * 60);
      if (!isNaN(diffMinutes) && diffMinutes >= 0 && diffMinutes <= 3) {
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
};

/**
 * Filtra a lista de nós Headscale / Cloud removendo clientes ('client')
 * quando já existe um container ('container') com o mesmo nome e o mesmo IPv4.
 *
 * Ao encontrar um cliente correspondente ao container, os dados em tempo real
 * do Headscale (online, last_seen, headscale_node_id, etc.) são mesclados no Container.
 */
export const filterDuplicateClientNodes = (nodes: CloudNode[]): CloudNode[] => {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  // 1. Separa containers e outros nós
  const containerMap = new Map<string, CloudNode>();
  const containers: CloudNode[] = [];
  const otherNodes: CloudNode[] = [];

  for (const node of nodes) {
    if (isContainerNode(node)) {
      const isOnline = isNodeOnline(node);
      const containerCopy: CloudNode = {
        ...node,
        node_type: 'container',
        online: isOnline,
        service_running: isOnline,
      };
      containers.push(containerCopy);

      const ip =
        extractIpv4(node.tailscale_ip) ||
        extractIpv4((node as any).ip_address) ||
        extractIpv4((node as any).ipAddress);

      if (ip) {
        const names = extractNodeNames(node);
        for (const name of names) {
          containerMap.set(`${name}|${ip}`, containerCopy);
        }
      }
    } else {
      const isOnline = isNodeOnline(node);
      otherNodes.push({
        ...node,
        online: isOnline,
        service_running: isOnline,
      });
    }
  }

  // Se não houver nenhum container mapeado por IP, retorna a lista com status avaliados
  if (containerMap.size === 0) {
    return [...containers, ...otherNodes];
  }

  // 2. Filtra clientes que coincidem com containers e mescla os dados Headscale no container
  const resultClients: CloudNode[] = [];

  for (const clientNode of otherNodes) {
    const ip =
      extractIpv4(clientNode.tailscale_ip) ||
      extractIpv4((clientNode as any).ip_address) ||
      extractIpv4((clientNode as any).ipAddress);

    let matchingContainer: CloudNode | null = null;
    if (ip) {
      const names = extractNodeNames(clientNode);
      for (const name of names) {
        const found = containerMap.get(`${name}|${ip}`);
        if (found) {
          matchingContainer = found;
          break;
        }
      }
    }

    if (matchingContainer) {
      // Mescla os dados em tempo real do Headscale diretamente no container
      const clientOnline = isNodeOnline(clientNode);
      if (clientOnline) {
        matchingContainer.online = true;
        matchingContainer.service_running = true;
      }

      if (clientNode.headscale_node_id && !matchingContainer.headscale_node_id) {
        matchingContainer.headscale_node_id = String(clientNode.headscale_node_id);
      }

      if (clientNode.last_seen) {
        matchingContainer.last_seen = clientNode.last_seen;
        matchingContainer.last_sync = clientNode.last_seen;
      } else if (clientNode.last_sync) {
        matchingContainer.last_sync = clientNode.last_sync;
      }

      if (clientNode.machine_key && !matchingContainer.machine_key) {
        matchingContainer.machine_key = clientNode.machine_key;
      }
      if (clientNode.node_key && !matchingContainer.node_key) {
        matchingContainer.node_key = clientNode.node_key;
      }
      if (clientNode.user && !matchingContainer.user) {
        matchingContainer.user = clientNode.user;
      }
      if (clientNode.tags && (!matchingContainer.tags || matchingContainer.tags.length === 0)) {
        matchingContainer.tags = clientNode.tags;
      }
      if (clientNode.expiration) {
        matchingContainer.expiration = clientNode.expiration;
      }
      if (clientNode.expired !== undefined) {
        matchingContainer.expired = Boolean(clientNode.expired);
      }
      if (clientNode.ephemeral !== undefined) {
        matchingContainer.ephemeral = Boolean(clientNode.ephemeral);
      }
    } else {
      resultClients.push(clientNode);
    }
  }

  return [...containers, ...resultClients];
};
