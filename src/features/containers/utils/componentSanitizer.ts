import type { ContainerComponentConfig } from '../types';

const SENSITIVE_KEY_PATTERN = /(password|pass|secret|token|auth|key|cred|private)/i;

/**
 * Normaliza o nome da categoria vinda do backend para os padrões aceitos no frontend:
 * - 'native' -> 'native'
 * - 'docker_apps', 'docker', 'docker_application' -> 'docker_apps'
 */
export function normalizeCategory(category?: string): 'native' | 'docker_apps' {
  if (!category) return 'native';
  const cat = category.toLowerCase().trim();
  if (cat.includes('docker')) return 'docker_apps';
  return 'native';
}

/**
 * Retorna um rótulo amigável para exibição da categoria:
 * - 'native' -> 'Nativos'
 * - 'docker_apps' -> 'Docker Apps'
 */
export function getCategoryLabel(category?: string): string {
  const norm = normalizeCategory(category);
  return norm === 'docker_apps' ? 'Docker Apps' : 'Nativos';
}

/**
 * Sanitiza o objeto de configuração de um componente antes de renderizá-lo na UI,
 * garantindo que senhas, tokens e credenciais em `env` não sejam expostos nos cards.
 */
export function sanitizeConfigForDisplay(
  config?: ContainerComponentConfig | null
): ContainerComponentConfig | null {
  if (!config) return null;

  const sanitized: ContainerComponentConfig = { ...config };

  if (sanitized.env && typeof sanitized.env === 'object') {
    const cleanEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(sanitized.env)) {
      if (!SENSITIVE_KEY_PATTERN.test(key)) {
        cleanEnv[key] = String(value);
      }
    }
    sanitized.env = cleanEnv;
  }

  return sanitized;
}
