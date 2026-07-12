/**
 * Formata um valor em bytes para a maior unidade legível possível.
 * Ex: 1048576 -> "1.00 MB"
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 B';
  if (isNaN(bytes) || bytes === null || bytes === undefined) return '-';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Converte de megabytes para bytes.
 */
export const mbToBytes = (mb: number): number => {
  return mb * 1024 * 1024;
};

/**
 * Converte de gigabytes para bytes.
 */
export const gbToBytes = (gb: number): number => {
  return gb * 1024 * 1024 * 1024;
};
