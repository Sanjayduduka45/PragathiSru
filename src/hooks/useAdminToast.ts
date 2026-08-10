import { useState, useCallback } from 'react';
import type { ToastMessage, ToastType } from '../components/ui/Toast';

let _idCounter = 0;

export function useAdminToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = `toast-${++_idCounter}`;
      const toast: ToastMessage = { id, type, title, description };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
