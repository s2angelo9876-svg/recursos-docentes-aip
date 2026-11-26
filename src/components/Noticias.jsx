import { useModalFocus } from "../hooks/useModalFocus";
import { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmModal from "./ConfirmModal";
import { SkeletonList } from "./Skeleton";
import { fechaComunicado, formatFechaComunicado } from "../utils/comunicados";

const easeOut = [0.16, 1, 0.3, 1];

function NewsCard({ n, lastVisit, isAdmin, onOpen, onEdit, onDelete }) {
  const createdTime = n.createdAt ? new Date(n.createdAt).getTime() : 0;
  const isNew = lastVisit && createdTime && createdTime > lastVisit;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="school-news-card group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 sm:p-6"
    >
      {isNew && (
        <span className="absolute -top-2 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-600 text-white text-[10px] font-semibold shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-soft-pulse" />
          Nuevo
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-subtle">
            <i className="far fa-calendar text-[10px]" />
            {formatFechaComunicado(n.fecha)}
          </span>
          <span className="text-ink-meta">·</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-alt dark:bg-dark-elev text-ink-subtle">
            <i className="far fa-user text-[9px]" />
            {n.autor}
          </span>
        </div>

        <h2 className="school-card-title text-ink dark:text-white">
          {n.titulo}
        </h2>
        <p className="mt-2 text-[13px] text-ink-subtle leading-relaxed line-clamp-2">
          {n.desc}
        </p>
      </div>

      <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
        <button
          onClick={() => onOpen(n)}
          className="school-secondary flex-1 sm:flex-none"
        >
          Leer completo
          <i className="fas fa-arrow-right text-[10px]" />
        </button>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(n)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-btn bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-white transition-colors"
              title="Editar comunicado"
              aria-label="Editar comunicado"
            >
              <i className="fas fa-pen text-[11px]" />
            </button>
            <button
              onClick={() => onDelete(n)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-btn bg-accent-50 hover:bg-accent-500 hover:text-white text-accent-600 dark:bg-accent-700/15 dark:text-accent-300 dark:hover:bg-accent-500 dark:hover:text-white transition-colors"
              title="Eliminar comunicado"
              aria-label="Eliminar comunicado"
            >
              <i className="fas fa-trash text-[11px]" />
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}

function NewsModal({ news, onClose }) {
  const dialogRef = useModalFocus(Boolean(news), { onClose });
  useEffect(() => {
    if (!news) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [news, onClose]);

  return (
    <AnimatePresence>
      {news && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={onClose}
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={news.titulo}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.22, ease: easeOut }}
            className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border shadow-card-hover overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-line dark:border-dark-border">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-primary-600 dark:text-primary-300">
                  Comunicado oficial
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-ink dark:text-white leading-snug">
                  {news.titulo}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-btn text-ink-subtle hover:text-ink dark:hover:text-white hover:bg-surface-alt dark:hover:bg-dark-elev transition-colors"
                aria-label="Cerrar"
              >
                <i className="fas fa-xmark" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] text-ink-subtle font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <i className="far fa-calendar text-[10px]" />
                  {formatFechaComunicado(news.fecha)}
                </span>
                <span className="text-ink-meta">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="far fa-user text-[10px]" />
                  {news.autor}
                </span>
              </div>
              <p className="text-[14px] text-ink dark:text-white/90 leading-relaxed whitespace-pre-wrap">
                {news.desc}
              </p>
            </div>

            <div className="px-6 py-4 border-t border-line dark:border-dark-border bg-surface-alt/50 dark:bg-dark-elev/40 flex justify-end">
              <button
                onClick={onClose}
                className="h-10 px-5 rounded-btn bg-primary-600 hover:bg-primary-700 text-white text-[13px] font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Noticias({ isAdminMode = false, onEditClick = null }) {
  const { noticias, deleteNoticia, isLoading } = useApp();
  const [selectedNews, setSelectedNews] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [lastVisit, setLastVisit] = useState(0);

  useEffect(() => {
    const prevVisit = localStorage.getItem("innova_last_noticias_visit");
    setLastVisit(prevVisit ? Number(prevVisit) : Date.now() - 48 * 60 * 60 * 1000);
    localStorage.setItem("innova_last_noticias_visit", String(Date.now()));
  }, []);

  const ordenadas = useMemo(() => [...noticias].sort((a, b) => fechaComunicado(b) - fechaComunicado(a)), [noticias]);

  if (isLoading) {
    return <SkeletonList items={5} />;
  }

  return (
    <div className="space-y-6">
      {ordenadas.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {ordenadas.map((n) => (
              <NewsCard
                key={n.id}
                n={n}
                lastVisit={lastVisit}
                isAdmin={isAdminMode}
                onOpen={setSelectedNews}
                onEdit={onEditClick}
                onDelete={(item) => setPendingDelete(item)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-cardLg border border-dashed border-line dark:border-dark-border bg-surface-alt/50 dark:bg-dark-card/40 py-20 px-6 text-center">
          <h2 className="school-card-title text-ink dark:text-white">
            Sin comunicados publicados
          </h2>
          <p className="mt-1.5 text-[13px] text-ink-subtle max-w-sm mx-auto">
            Cuando el AIP publique avisos oficiales aparecerán aquí.
            {isAdminMode && " Usa el botón + Nuevo para crear el primero."}
          </p>
        </div>
      )}

      <NewsModal news={selectedNews} onClose={() => setSelectedNews(null)} />

      <ConfirmModal
        open={!!pendingDelete}
        title="Eliminar comunicado"
        message={
          pendingDelete
            ? `¿Seguro que deseas eliminar "${pendingDelete.titulo}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        tone="danger"
        loading={false}
        onConfirm={async () => {
          if (pendingDelete) {
            await deleteNoticia(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
