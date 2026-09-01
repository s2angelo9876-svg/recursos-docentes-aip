import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TONE = {
  danger: {
    icon: "fa-triangle-exclamation",
    iconBg: "bg-accent-50 text-accent-600 dark:bg-accent-700/15 dark:text-accent-300",
    btn: "bg-accent-600 hover:bg-accent-700 text-white shadow-sm",
  },
  warn: {
    icon: "fa-circle-exclamation",
    iconBg: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    btn: "bg-amber-500 hover:bg-amber-600 text-white shadow-sm",
  },
  info: {
    icon: "fa-circle-info",
    iconBg: "bg-primary-50 text-primary-600 dark:bg-primary-600/15 dark:text-primary-300",
    btn: "bg-primary-600 hover:bg-primary-700 text-white shadow-sm",
  },
};

export default function ConfirmModal({
  open,
  title = "¿Confirmar acción?",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  tone = "danger",
  loading = false,
  onConfirm,
  onClose,
}) {
  const confirmRef = useRef(null);
  const t = TONE[tone] || TONE.danger;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  useEffect(() => {
    if (open) {
      // small timeout so the modal mounts before focusing
      const t = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => !loading && onClose?.()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border shadow-card-hover overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <span
                  className={`flex-shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl ${t.iconBg}`}
                >
                  <i className={`fas ${t.icon} text-base`} />
                </span>
                <div className="flex-1 min-w-0">
                  <h3
                    id="confirm-title"
                    className="text-[16px] font-semibold tracking-tight text-ink dark:text-white"
                  >
                    {title}
                  </h3>
                  {message && (
                    <p className="mt-1.5 text-[13.5px] text-ink-subtle leading-relaxed">
                      {message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-alt/60 dark:bg-dark-elev/40 border-t border-line dark:border-dark-border flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-10 px-4 rounded-btn text-[13px] font-semibold text-ink dark:text-white bg-white dark:bg-dark-card border border-line dark:border-dark-border hover:bg-surface-alt dark:hover:bg-dark-hover transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`h-10 px-4 rounded-btn text-[13px] font-semibold transition-colors disabled:opacity-60 inline-flex items-center gap-2 ${t.btn}`}
              >
                {loading && <i className="fas fa-spinner fa-spin text-xs" />}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
