"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}
interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastCtx = createContext<ToastContextValue>({ showToast: () => {} });

const icons: Record<ToastType, string> = {
  success: "check_circle",
  error: "error",
  info: "info",
};
const colors: Record<ToastType, string> = {
  success: "bg-[var(--color-primary)]",
  error: "bg-red-500",
  info: "bg-slate-800",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold min-w-[280px] toast-slide-in ${colors[toast.type]}`}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              {icons[toast.type]}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
