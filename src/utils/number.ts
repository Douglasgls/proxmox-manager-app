/**
 * Formata um valor numérico para representação em porcentagem.
 * Ex: 45.23 -> "45.2%"
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(decimals)}%`;
};
