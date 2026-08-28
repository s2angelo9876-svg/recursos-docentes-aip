import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listDriveImages, DriveGalleryError, clearDriveCache } from "../services/googleDrive";

function ArrowLeftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" />
    </svg>
  );
}

const ERROR_HINTS = {
  config: "Verifica que .env tenga VITE_GOOGLE_API_KEY y VITE_DRIVE_FOLDER_ID.",
  quota: "Se agotó la cuota de la API Key de Google. Intenta más tarde.",
  not_found: "La carpeta de Drive no existe o no es pública.",
  unauthorized: "La API Key no tiene permisos sobre Google Drive API.",
  network: "Revisa tu conexión a internet.",
  http: "Error al comunicarse con Google Drive.",
};

export default function GaleriaModal({ open, onClose }) {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const fetchImages = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    setImgLoaded(false);
    if (force) clearDriveCache();
    try {
      const list = await listDriveImages({ forceRefresh: force });
      setImages(list);
      setIndex(0);
    } catch (e) {
      if (e instanceof DriveGalleryError) {
        setError(e);
      } else {
        setError(new DriveGalleryError(e?.message || "Error desconocido", "unknown"));
      }
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchImages(false);
  }, [open, fetchImages]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
    setImgLoaded(false);
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
    setImgLoaded(false);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPrev, goNext]);

  useEffect(() => {
    setImgLoaded(false);
  }, [index]);

  const current = images[index];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de imágenes"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl max-h-[95vh] bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border bg-primary/10 text-primary border-primary/20 dark:bg-dark-accent/10 dark:text-dark-accent dark:border-dark-accent/20">
                  <i className="fas fa-images mr-1"></i> Galería Drive
                </span>
                {!loading && !error && images.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    {index + 1} / {images.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fetchImages(true)}
                  disabled={loading}
                  title="Recargar"
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border disabled:opacity-50 transition-colors"
                >
                  <RefreshIcon />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="Cerrar (Esc)"
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="relative flex-1 min-h-0 bg-gray-50 dark:bg-dark-bg">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                  <div className="w-10 h-10 border-4 border-gray-200 dark:border-dark-border border-t-primary dark:border-t-dark-accent rounded-full animate-spin" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Cargando galería...</span>
                </div>
              )}

              {!loading && error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase">
                    No se pudo cargar la galería
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">{error.message}</p>
                  {ERROR_HINTS[error.code] && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 max-w-md">
                      💡 {ERROR_HINTS[error.code]}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchImages(false)}
                    className="mt-2 px-4 py-2 rounded-xl bg-primary dark:bg-dark-accent text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {!loading && !error && images.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <i className="far fa-folder-open text-5xl"></i>
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    La carpeta está vacía
                  </span>
                </div>
              )}

              {!loading && !error && current && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {!imgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-gray-200 dark:border-dark-border border-t-primary dark:border-t-dark-accent rounded-full animate-spin" />
                    </div>
                  )}
                  <img
                    key={current.id}
                    src={current.url}
                    alt={current.name}
                    loading="eager"
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgLoaded(true)}
                    className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                  />
                </div>
              )}

              {/* Flechas */}
              {!loading && !error && images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Imagen anterior"
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-95"
                  >
                    <ArrowLeftIcon />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Imagen siguiente"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-95"
                  >
                    <ArrowRightIcon />
                  </button>
                </>
              )}
            </div>

            {/* Footer con nombre + miniaturas */}
            {!loading && !error && images.length > 0 && (
              <div className="border-t border-gray-100 dark:border-dark-border">
                <div className="px-4 sm:px-5 py-2 text-[11px] text-gray-600 dark:text-gray-300 font-medium truncate text-center">
                  {current?.name}
                </div>
                {images.length > 1 && (
                  <div className="px-3 sm:px-4 pb-3 pt-1 flex gap-2 overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => {
                          setIndex(i);
                          setImgLoaded(false);
                        }}
                        className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          i === index
                            ? "border-primary dark:border-dark-accent scale-105"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                        aria-label={`Ir a imagen ${i + 1}`}
                      >
                        <img
                          src={img.thumb || img.url}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
