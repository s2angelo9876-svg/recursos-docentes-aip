import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

// Evento global para disparar toasts desde fuera del provider
// (ej: interceptores de fetch, logout automático por inactividad).
export const TOAST_EVENT = "innova:toast";

const TONE = {
  success: {
    icon: "fa-circle-check",
    cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/30",
  },
  error: {
    icon: "fa-circle-xmark",
    cls: "bg-accent-500/15 text-accent-600 dark:text-accent-300 ring-1 ring-accent-500/30",
  },
  info: {
    icon: "fa-circle-info",
    cls: "bg-primary-500/15 text-primary-600 dark:text-primary-300 ring-1 ring-primary-500/30",
  },
  warning: {
    icon: "fa-triangle-exclamation",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30",
  },
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast) => {
      const id = nextId++;
      const t = {
        id,
        tone: "info",
        duration: 4200,
        ...toast,
      };
      setToasts((prev) => [...prev, t]);
      if (t.duration > 0) {
        const timer = setTimeout(() => dismiss(id), t.duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      push,
      dismiss,
      success: (msg, opts) => push({ tone: "success", message: msg, ...opts }),
      error: (msg, opts) => push({ tone: "error", message: msg, ...opts }),
      info: (msg, opts) => push({ tone: "info", message: msg, ...opts }),
      warning: (msg, opts) => push({ tone: "warning", message: msg, ...opts }),
    }),
    [push, dismiss]
  );

  // Listener global: permite dispatchear toasts desde código fuera del provider
  // usando `window.dispatchEvent(new CustomEvent("innova:toast", { detail: {...} }))`.
  useEffect(() => {
    const onToast = (e) => api.push(e.detail || {});
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, [api]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// Helper para disparar un toast desde cualquier parte de la app
// sin necesidad de tener acceso al hook useToast.
export function dispatchToast(toast) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: toast }));
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return ctx;
}

function ToastViewport({ toasts, onDismiss }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[400] flex flex-col gap-2 w-[min(100vw-2rem,22rem)] pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const tone = TONE[t.tone] || TONE.info;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto relative rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border shadow-card-hover overflow-hidden"
              role={t.tone === "error" ? "alert" : "status"}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-current opacity-50" style={{ color: "transparent" }} />
              <div className="p-3.5 flex items-start gap-3">
                <span className={`flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-xl ${tone.cls}`}>
                  <i className={`fas ${tone.icon} text-sm`} />
                </span>
                <div className="flex-1 min-w-0 pt-0.5">
                  {t.title && (
                    <p className="text-[13px] font-semibold text-ink dark:text-white leading-tight">
                      {t.title}
                    </p>
                  )}
                  <p className={`text-[12.5px] text-ink-subtle dark:text-ink-meta leading-snug ${t.title ? "mt-1" : ""}`}>
                    {t.message}
                  </p>
                  {t.action && (
                    <button
                      onClick={() => {
                        t.action.onClick?.();
                        onDismiss(t.id);
                      }}
                      className="mt-2 text-[11.5px] font-semibold text-primary-600 dark:text-primary-300 hover:underline"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => onDismiss(t.id)}
                  className="flex-shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-lg text-ink-meta hover:text-ink dark:hover:text-white hover:bg-surface-alt dark:hover:bg-dark-elev transition-colors"
                  aria-label="Cerrar notificación"
                >
                  <i className="fas fa-xmark text-xs" />
                </button>
              </div>
              {t.duration > 0 && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: t.duration / 1000, ease: "linear" }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-current origin-left"
                  style={{
                    color:
                      t.tone === "success"
                        ? "rgb(16 185 129)"
                        : t.tone === "error"
                          ? "rgb(220 38 38)"
                          : t.tone === "warning"
                            ? "rgb(245 158 11)"
                            : "rgb(0 48 135)",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}
