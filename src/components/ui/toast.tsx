import React from 'react';
import { useToastStore } from '@/utils/clipboard';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
              isError
                ? 'bg-destructive text-destructive-foreground border-destructive/80'
                : isInfo
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-600'
            }`}
          >
            <div className="flex items-center gap-2">
              {isError ? (
                <AlertCircle className="size-4 shrink-0 text-white" />
              ) : isInfo ? (
                <Info className="size-4 shrink-0 text-white" />
              ) : (
                <CheckCircle2 className="size-4 shrink-0 text-white" />
              )}
              <span>{toast.message}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md hover:bg-white/20 transition-colors text-white/80 hover:text-white"
              aria-label="Fechar notificação"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
