/**
 * Formata um timestamp para uma string legível de data e hora.
 * Ex: 1718042400 -> "10/06/2024 15:00:00"
 */
export const formatDateTime = (timestamp: number | string | Date): string => {
  if (!timestamp) return '-';
  
  let date: Date;
  if (typeof timestamp === 'number') {
    // Proxmox costuma enviar timestamps em segundos
    date = new Date(timestamp * 1000);
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

/**
 * Converte um tempo de uptime em segundos para um formato legível.
 * Ex: 90065 -> "1d 1h 0m 5s"
 */
export const formatUptime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0s';

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(' ');
};

/**
 * Calcula e formata a duração entre dois timestamps de Job.
 */
export const formatJobDuration = (start: number, end?: number): string => {
  const endTime = end || Math.floor(Date.now() / 1000);
  const durationInSeconds = endTime - start;
  return formatUptime(durationInSeconds);
};
