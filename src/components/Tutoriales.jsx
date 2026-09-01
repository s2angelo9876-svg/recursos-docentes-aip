import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { getYouTubeId, getYouTubeThumbnail } from "../utils/youtube";

const AREAS_CNEB = [
  "Matemática", "Comunicación", "Inglés", "Arte y Cultura",
  "Ciencias Sociales", "DPCC", "Educación Física", "Educación Religiosa",
  "Ciencia y Tecnología", "Educación para el Trabajo",
];
const AREA_TODAS = "Todas las áreas";

const easeOut = [0.16, 1, 0.3, 1];

function YouTubeThumbnail({ url, title }) {
  const id = getYouTubeId(url);
  const [imgError, setImgError] = useState(false);
  const [playing, setPlaying] = useState(false);

  if (!id) {
    return (
      <div className="w-full aspect-video bg-surface-alt dark:bg-dark-elev rounded-t-cardLg flex items-center justify-center">
        <i className="fas fa-link text-ink-meta text-2xl" />
      </div>
    );
  }

  if (playing) {
    return (
      <div className="w-full aspect-video rounded-t-cardLg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const thumb = imgError
    ? getYouTubeThumbnail(id, "0")
    : getYouTubeThumbnail(id, "mqdefault");

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="relative w-full aspect-video rounded-t-cardLg overflow-hidden group/thumb block"
      aria-label={`Reproducir ${title}`}
    >
      <img
        src={thumb}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
        onError={() => setImgError(true)}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent transition-opacity group-hover/thumb:opacity-90" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-600 text-white shadow-glow ring-4 ring-white/15 group-hover/thumb:scale-110 transition-transform">
          <i className="fas fa-play text-base ml-0.5" />
        </span>
      </div>
      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur text-white text-[10px] font-semibold">
        <i className="fab fa-youtube" />
        YouTube
      </span>
    </button>
  );
}

function AccessSelector({ onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="text-center mb-10 max-w-md"
      >
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-glow mb-5">
          <i className="fab fa-youtube text-2xl" />
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white">
          Tutoriales TIC
        </h2>
        <p className="mt-2 text-[14px] text-ink-subtle leading-relaxed">
          ¿Cómo deseas acceder al catálogo de tutoriales pedagógicos?
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          onClick={() => onSelect("docente")}
          className="group relative overflow-hidden rounded-cardLg border border-line dark:border-dark-border bg-white dark:bg-dark-card p-7 text-left hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary-200 dark:hover:border-primary-500/40 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-600/15 dark:text-primary-300 mb-4 group-hover:scale-110 transition-transform">
              <i className="fas fa-chalkboard-teacher text-lg" />
            </span>
            <h3 className="text-[17px] font-semibold text-ink dark:text-white">
              Docente
            </h3>
            <p className="mt-1.5 text-[13px] text-ink-subtle leading-relaxed">
              Catálogo completo de tutoriales pedagógicos y recursos TIC para tu práctica.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary-600 dark:text-primary-300 group-hover:gap-2.5 transition-all">
              Ingresar <i className="fas fa-arrow-right text-[10px]" />
            </span>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
          onClick={() => onSelect("estudiante")}
          className="group relative overflow-hidden rounded-cardLg border border-line dark:border-dark-border bg-white dark:bg-dark-card p-7 text-left hover:-translate-y-0.5 hover:shadow-card-hover hover:border-emerald-200 dark:hover:border-emerald-500/40 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-600/15 dark:text-emerald-300 mb-4 group-hover:scale-110 transition-transform">
              <i className="fas fa-user-graduate text-lg" />
            </span>
            <h3 className="text-[17px] font-semibold text-ink dark:text-white">
              Estudiante
            </h3>
            <p className="mt-1.5 text-[13px] text-ink-subtle leading-relaxed">
              Aprende con videos seleccionados por tus docentes y tutores.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-300 group-hover:gap-2.5 transition-all">
              Ingresar <i className="fas fa-arrow-right text-[10px]" />
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

function AudiencePill({ audience }) {
  if (!audience || audience === "ambos") return null;
  const map = {
    docente: {
      cls: "bg-primary-50 text-primary-700 dark:bg-primary-600/15 dark:text-primary-300",
      icon: "fa-chalkboard-teacher",
      label: "Docente",
    },
    estudiante: {
      cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-600/15 dark:text-emerald-300",
      icon: "fa-user-graduate",
      label: "Estudiante",
    },
  };
  const m = map[audience];
  if (!m) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${m.cls}`}
    >
      <i className={`fas ${m.icon} text-[8px]`} />
      {m.label}
    </span>
  );
}

export default function Tutoriales({ isAdminMode = false, onEditClick = null, onDeleteClick = null }) {
  const { tutoriales, deleteTutorial, tutorialAccess, setTutorialAccess } = useApp();
  const [busqueda, setBusqueda] = useState("");
  const [areaSel, setAreaSel] = useState(AREA_TODAS);
  const accessType = isAdminMode ? null : tutorialAccess;
  const setAccessType = setTutorialAccess;

  const tutorialesFiltrados = useMemo(() => {
    return tutoriales.filter((p) => {
      if (!getYouTubeId(p.url)) return false;

      const matchAudiencia =
        isAdminMode ||
        !accessType ||
        p.audiencia === "ambos" ||
        p.audiencia === accessType;

      const termino = busqueda.toLowerCase().trim();

      const matchArea =
        areaSel === AREA_TODAS || p.area === areaSel;

      const matchBusqueda =
        !termino ||
        (p.titulo || "").toLowerCase().includes(termino) ||
        (p.desc || "").toLowerCase().includes(termino) ||
        (p.area || "").toLowerCase().includes(termino) ||
        (p.area === AREA_TODAS && AREAS_CNEB.some((a) => a.toLowerCase().includes(termino)));

      return matchAudiencia && matchArea && matchBusqueda;
    });
  }, [tutoriales, busqueda, accessType, isAdminMode, areaSel]);

  if (!accessType && !isAdminMode) {
    return <AccessSelector onSelect={setAccessType} />;
  }

  return (
    <div className="space-y-6">
      {accessType && !isAdminMode && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${
              accessType === "docente"
                ? "bg-primary-50 dark:bg-primary-600/15 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-500/30"
                : "bg-emerald-50 dark:bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
            }`}
          >
            <i
              className={`fas ${
                accessType === "docente" ? "fa-chalkboard-teacher" : "fa-user-graduate"
              } text-[10px]`}
            />
            Modo {accessType === "docente" ? "Docente" : "Estudiante"}
          </span>
          <button
            onClick={() => setAccessType(null)}
            className="text-[12px] text-ink-subtle hover:text-ink dark:hover:text-white font-medium flex items-center gap-1.5 transition-colors"
          >
            <i className="fas fa-arrow-rotate-left text-[10px]" />
            Cambiar modo
          </button>
        </div>
      )}

      <div className="rounded-cardLg border border-line dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
        <div className="p-5 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-meta text-sm pointer-events-none" />
              <input
                type="text"
                className="w-full pl-10 pr-4 h-11 rounded-btn border border-line dark:border-dark-border bg-white dark:bg-dark-input text-[13.5px] text-ink dark:text-white placeholder:text-ink-meta focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="Buscar por título, área o descripción…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar tutoriales"
              />
            </div>
            <div className="relative">
              <select
                className="appearance-none h-11 pl-4 pr-10 rounded-btn border border-line dark:border-dark-border bg-white dark:bg-dark-input text-[13px] text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all cursor-pointer"
                value={areaSel}
                onChange={(e) => setAreaSel(e.target.value)}
                aria-label="Filtrar por área"
              >
                <option value={AREA_TODAS}>Todas las áreas</option>
                {AREAS_CNEB.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-ink-meta text-[10px] pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="px-5 pb-4 flex items-center justify-between text-[12px] text-ink-subtle">
          <span>
            <span className="font-semibold text-ink dark:text-white tabular-nums">
              {tutorialesFiltrados.length}
            </span>{" "}
            {tutorialesFiltrados.length === 1 ? "tutorial disponible" : "tutoriales disponibles"}
          </span>
          {(busqueda || areaSel !== AREA_TODAS) && (
            <button
              onClick={() => {
                setBusqueda("");
                setAreaSel(AREA_TODAS);
              }}
              className="text-primary-600 dark:text-primary-300 hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {tutorialesFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {tutorialesFiltrados.map((p, i) => (
              <motion.article
                layout
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: easeOut }}
                className="group flex flex-col rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-500/40 transition-all duration-300 overflow-hidden"
              >
                <YouTubeThumbnail url={p.url} title={p.titulo} />

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 text-primary-700 dark:bg-primary-600/15 dark:text-primary-300">
                      {p.area}
                    </span>
                    <AudiencePill audience={p.audiencia} />
                  </div>
                  <h3 className="mt-2.5 text-[15px] font-semibold tracking-tight text-ink dark:text-white leading-snug line-clamp-2">
                    {p.titulo}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] text-ink-subtle leading-relaxed line-clamp-3 flex-1">
                    {p.desc}
                  </p>

                  <div className="mt-4 pt-4 border-t border-line-subtle dark:border-dark-border space-y-2">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-btn bg-accent-600 hover:bg-accent-700 text-white text-[12px] font-semibold transition-colors"
                    >
                      <i className="fab fa-youtube text-[11px]" />
                      Ver en YouTube
                    </a>

                    {isAdminMode && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEditClick && onEditClick(p)}
                          className="flex-1 h-8 rounded-btn bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-white text-[11px] font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          <i className="fas fa-pen text-[9px]" /> Editar
                        </button>
                        <button
                          onClick={() => onDeleteClick ? onDeleteClick(p) : (window.confirm("¿Eliminar este tutorial?") && deleteTutorial(p.id))}
                          className="flex-1 h-8 rounded-btn bg-accent-50 hover:bg-accent-500 hover:text-white text-accent-600 dark:bg-accent-700/15 dark:text-accent-300 dark:hover:bg-accent-500 dark:hover:text-white text-[11px] font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          <i className="fas fa-trash text-[9px]" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-cardLg border border-dashed border-line dark:border-dark-border bg-surface-alt/50 dark:bg-dark-card/40 py-16 px-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunk dark:bg-dark-elev text-ink-meta mb-4">
            <i className="fab fa-youtube text-2xl" />
          </span>
          <h3 className="text-[15px] font-semibold text-ink dark:text-white">
            Sin tutoriales que coincidan
          </h3>
          <p className="mt-1.5 text-[13px] text-ink-subtle max-w-sm mx-auto">
            {isAdminMode
              ? 'Agrega el primer tutorial usando el botón "Nuevo".'
              : "Prueba con otro término o cambia el área curricular."}
          </p>
        </div>
      )}
    </div>
  );
}
