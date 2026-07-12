/**
 * Valida se uma string é um IP v4 válido.
 */
export const isValidIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

/**
 * Valida se um IP está no formato CIDR (IP/Máscara).
 * Ex: 192.168.100.1/24
 */
export const isValidCIDR = (cidr: string): boolean => {
  const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
  return cidrRegex.test(cidr);
};

/**
 * Filtra IPs ou formata portas de forma legível.
 */
export const formatNetworkPorts = (ports: string | string[]): string => {
  if (Array.isArray(ports)) {
    return ports.join(', ');
  }
  return ports || '-';
};
