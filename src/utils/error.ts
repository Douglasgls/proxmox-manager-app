/**
 * Extrai de forma segura uma mensagem de erro em formato de string
 * a partir de exceções do Axios / FastAPI / Pydantic (evitando renderizar objetos no React).
 */
export const extractErrorMessage = (err: any, fallbackMessage: string = 'Ocorreu um erro inesperado'): string => {
  if (!err) return fallbackMessage;

  const detail = err.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  // Tratamento para erros de validação do Pydantic / FastAPI (retornam um array de objetos)
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && item.msg) {
          const loc = Array.isArray(item.loc)
            ? item.loc.filter((l: any) => l !== 'body' && l !== 'query').join(' -> ')
            : '';
          return loc ? `${loc}: ${item.msg}` : item.msg;
        }
        return JSON.stringify(item);
      })
      .join('; ');
  }

  if (detail && typeof detail === 'object') {
    if (detail.msg) return detail.msg;
    return JSON.stringify(detail);
  }

  const message = err.response?.data?.message || err.message;
  if (typeof message === 'string') {
    return message;
  }

  return fallbackMessage;
};
