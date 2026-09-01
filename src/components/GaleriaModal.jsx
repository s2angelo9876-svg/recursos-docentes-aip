import { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

const SWIPE_THRESHOLD = 50;

function isVideo(item) {
  if (!item) return false;
  if (item.mimetype && item.mimetype.startsWith("video/")) return true;
  if (typeof item.url === "string") {
    return /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(item.url);
  }
  return false;
}

export default function GaleriaModal({
  open,
  onClose,
  images = [],
  loading = false,
  error = null,
  initialIndex = 0,
  onRefresh = null,
  title = "Galería",
}) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const touchStart = useRef(null);
  const touchDelta = useRef(0);

  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setDirection(0);
      setImgLoaded(false);
    }
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const goPrev = useCallback(() => {
    if (images.length < 2) return;
    setDirection(-1);
    setIndex((i) => (i - 1 + images.length) % images.length);
    setImgLoaded(false);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length < 2) return;
    setDirection(1);
    setIndex((i) => (i + 1) % images.length);
    setImgLoaded(false);
  }, [images.length]);

  const goTo = (i) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
    setImgLoaded(false);
  };

  useEffect(() => {
    setImgLoaded(false);
  }, [index]);

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

  const handleTouchStart = (e) => {
    if (images.length < 2) return;
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
  };

  const handleTouchMove = (e) => {
    if (touchStart.current === null) return;
    touchDelta.current = e.touches[0].clientX - touchStart.current;
  };

  const handleTouchEnd = () => {
    if (touchStart.current === null) return;
    if (touchDelta.current > SWIPE_THRESHOLD) goPrev();
    else if (touchDelta.current < -SWIPE_THRESHOLD) goNext();
    touchStart.current = null;
    touchDelta.current = 0;
  };

  const current = images[index];
  const showDots = images.length > 1 && images.length <= 15;
  const showCounter = images.length > 15;

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

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
          className="fixed inset-0 z-[100] bg-black flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full h-full flex flex-col"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-white z-20 absolute top-0 inset-x-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm flex-shrink-0">
                  <i className="fas fa-images mr-1.5"></i>
                  <span className="hidden sm:inline">{title}</span>
                </span>
                {!loading && !error && images.length > 0 && (
                  <span className="text-xs sm:text-sm font-bold opacity-90">
                    {index + 1} / {images.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {onRefresh && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                    disabled={loading}
                    title="Recargar"
                    className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                  >
                    <RefreshIcon />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  title="Cerrar (Esc)"
                  className="p-2 rounded-full text-white/80 hover:text-white hover:bg-red-500/80 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div
              className="flex-1 relative overflow-hidden flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                  <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Cargando...</span>
                </div>
              )}

              {!loading && error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-2xl">
                    <i className="fas fa-exclamation-triangle" />
                  </div>
                  <h3 className="text-base font-semibold">No se pudo cargar</h3>
                  <p className="text-xs opacity-80 max-w-md">{error.message}</p>
                  {ERROR_HINTS[error.code] && (
                    <p className="text-[11px] opacity-60 max-w-md inline-flex items-center gap-1.5">
                      <i className="fas fa-lightbulb text-amber-300" />
                      {ERROR_HINTS[error.code]}
                    </p>
                  )}
                </div>
              )}

              {!loading && !error && images.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 text-white/50">
                  <i className="far fa-folder-open text-5xl" />
                  <span className="text-xs font-semibold">Sin archivos para mostrar</span>
                </div>
              )}

              {!loading && !error && current && (
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={current.id || index}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0 flex items-center justify-center px-3 sm:px-12 py-16"
                  >
                    {!imgLoaded && !isVideo(current) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                    {isVideo(current) ? (
                      <video
                        key={current.url}
                        src={current.url}
                        controls
                        autoPlay={false}
                        playsInline
                        className="max-w-full max-h-full object-contain"
                        onLoadedData={() => setImgLoaded(true)}
                        onError={() => setImgLoaded(true)}
                      />
                    ) : (
                      <img
                        src={current.url}
                        alt={current.name || `Imagen ${index + 1}`}
                        loading="eager"
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgLoaded(true)}
                        draggable={false}
                        className={`max-w-full max-h-full object-contain select-none transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {!loading && !error && images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    aria-label="Anterior"
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 border border-white/10"
                  >
                    <ArrowLeftIcon />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    aria-label="Siguiente"
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 border border-white/10"
                  >
                    <ArrowRightIcon />
                  </button>
                </>
              )}
            </div>

            {!loading && !error && current && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white"
              >
                {current.name && (
                  <div className="px-4 sm:px-6 py-2 sm:py-3 text-center">
                    <p className="text-xs sm:text-sm font-medium opacity-90 truncate">
                      {current.name}
                    </p>
                  </div>
                )}

                {showDots && (
                  <div className="flex items-center justify-center gap-1.5 pb-3 sm:pb-4 px-4">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={`Ir a imagen ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                      />
                    ))}
                  </div>
                )}

                {showCounter && (
                  <div className="flex justify-center pb-4">
                    <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold">
                      {index + 1} / {images.length}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
