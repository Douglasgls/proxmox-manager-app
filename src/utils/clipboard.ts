import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface ToastStore {
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Remove automaticamente após 3 segundos
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

/**
 * Função utilitária universal para cópia com fallback para HTTP/LAN e notificação Toast.
 */
export const copyToClipboard = async (text: string, label?: string): Promise<boolean> => {
  if (!text) return false;

  let success = false;

  // 1. Tenta API moderna navigator.clipboard
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      success = true;
    }
  } catch (err) {
    console.warn('[copyToClipboard] navigator.clipboard error, trying fallback...', err);
  }

  // 2. Fallback síncrono via textarea para HTTP / conexões de rede local
  if (!success) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      success = document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('[copyToClipboard] Fallback execCommand failed', err);
      success = false;
    }
  }

  // 3. Notificação Toast Global
  const showToast = useToastStore.getState().showToast;
  if (success) {
    const displayMsg = label ? `${label} copiado!` : 'Copiado para a área de transferência!';
    showToast(displayMsg, 'success');
  } else {
    showToast('Não foi possível copiar o texto.', 'error');
  }

  return success;
};
