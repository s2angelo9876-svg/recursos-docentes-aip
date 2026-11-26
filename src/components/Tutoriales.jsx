import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { getYouTubeId, getYouTubeThumbnail } from "../utils/youtube";
import { SkeletonGrid } from "./Skeleton";

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

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="school-video-preview relative w-full aspect-video overflow-hidden block"
      aria-label={`Reproducir ${title}`}
    >
      {!imgError && <img
        src={getYouTubeThumbnail(id)}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span className="school-video-play">
          <i className="fas fa-play text-base ml-0.5" />
        </span>
      </div>
    </button>
  );
}

function AccessSelector({ onSelect }) {
  return (
    <section className="tutorial-audience" aria-labelledby="tutorial-audience-title">
      <h2 id="tutorial-audience-title">Elige qué tutoriales ver</h2>
      <div>
        <button type="button" onClick={() => onSelect("docente")}><i className="fas fa-chalkboard-teacher" aria-hidden="true" /><span><strong>Docentes</strong><small>Herramientas para preparar y acompañar tus clases.</small></span><i className="fas fa-arrow-right" aria-hidden="true" /></button>
        <button type="button" onClick={() => onSelect("estudiante")}><i className="fas fa-user-graduate" aria-hidden="true" /><span><strong>Estudiantes</strong><small>Guías para usar herramientas y desarrollar proyectos.</small></span><i className="fas fa-arrow-right" aria-hidden="true" /></button>
      </div>
    </section>
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
  const { tutoriales, deleteTutorial, tutorialAccess, setTutorialAccess, isLoading } = useApp();
  const [busqueda, setBusqueda] = useState("");
  const [areaSel, setAreaSel] = useState(AREA_TODAS);
  const accessType = isAdminMode ? null : tutorialAccess;
  const setAccessType = setTutorialAccess;

  const disponibles = useMemo(() => tutoriales.filter((tutorial) =>
    getYouTubeId(tutorial.url) && (isAdminMode || !accessType || tutorial.audiencia === "ambos" || tutorial.audiencia === accessType),
  ), [tutoriales, accessType, isAdminMode]);

  const tutorialesFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase().trim();
    return disponibles.filter((p) => {
      const matchArea =
        areaSel === AREA_TODAS || p.area === areaSel;

      const matchBusqueda =
        !termino ||
        (p.titulo || "").toLowerCase().includes(termino) ||
        (p.desc || "").toLowerCase().includes(termino) ||
        (p.area || "").toLowerCase().includes(termino) ||
        (p.area === AREA_TODAS && AREAS_CNEB.some((a) => a.toLowerCase().includes(termino)));

      return matchArea && matchBusqueda;
    });
  }, [disponibles, busqueda, areaSel]);
  const total = disponibles.length;

  const countsByArea = useMemo(() => {
    const map = new Map();
    for (const t of disponibles) {
      if (t.area) map.set(t.area, (map.get(t.area) || 0) + 1);
    }
    return map;
  }, [disponibles]);

  if (!accessType && !isAdminMode) {
    return <AccessSelector onSelect={setAccessType} />;
  }

  const hasActiveFilters = !!busqueda || areaSel !== AREA_TODAS;
  const clearFilters = () => {
    setBusqueda("");
    setAreaSel(AREA_TODAS);
  };

  if (isLoading && (isAdminMode || accessType)) {
    return <SkeletonGrid items={6} />;
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
            {accessType === "docente" ? "Para docentes" : "Para estudiantes"}
          </span>
          <button
            onClick={() => setAccessType(null)}
            type="button"
            className="school-secondary"
          >
            <i className="fas fa-arrow-rotate-left text-[10px]" />
            Cambiar público
          </button>
        </div>
      )}

      <div className="school-content-card">
        <div className="p-5 space-y-4">
          <div className="relative">
            <i className="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-meta text-sm pointer-events-none" />
            <input
              type="search"
              className="w-full pl-10 pr-4 h-11 rounded-btn border border-line dark:border-dark-border bg-white dark:bg-dark-input text-[13.5px] text-ink dark:text-white placeholder:text-ink-meta focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              placeholder="Buscar por título, área o descripción…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar tutoriales"
            />
          </div>

          <label className="school-select-filter block sm:hidden">Área curricular
            <select value={areaSel} onChange={(event) => setAreaSel(event.target.value)}>
              <option value={AREA_TODAS}>{AREA_TODAS}</option>
              {AREAS_CNEB.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <div className="hidden sm:flex items-start gap-3" role="group" aria-label="Área curricular">
            <span className="text-[12px] font-semibold text-ink-meta shrink-0 pt-3">
              Área
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                active={areaSel === AREA_TODAS}
                onClick={() => setAreaSel(AREA_TODAS)}
                count={total}
              >
                Todas
              </FilterChip>
              {AREAS_CNEB.map((a) => (
                <FilterChip
                  key={a}
                  active={areaSel === a}
                  onClick={() => setAreaSel(a)}
                  count={countsByArea.get(a) || 0}
                >
                  {a}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-3 bg-surface-alt/60 dark:bg-dark-elev/40 border-t border-line dark:border-dark-border flex items-center justify-between text-[12px] text-ink-subtle">
          <span role="status">
            Mostrando{" "}
            <span className="font-semibold text-ink dark:text-white tabular-nums">
              {tutorialesFiltrados.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold tabular-nums">{total}</span>{" "}
            {total === 1 ? "tutorial" : "tutoriales"}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
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
            {tutorialesFiltrados.map((p) => (
              <motion.article
                layout
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: easeOut }}
                className="school-content-card group flex flex-col overflow-hidden"
              >
                <YouTubeThumbnail key={p.url} url={p.url} title={p.titulo} />

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 text-primary-700 dark:bg-primary-600/15 dark:text-primary-300">
                      {p.area}
                    </span>
                    <AudiencePill audience={p.audiencia} />
                  </div>
                  <h2 className="school-card-title mt-2.5 text-ink dark:text-white">
                    {p.titulo}
                  </h2>
                  <p className="mt-1.5 text-[12.5px] text-ink-subtle leading-relaxed line-clamp-3 flex-1">
                    {p.desc}
                  </p>

                  <div className="mt-4 pt-4 border-t border-line-subtle dark:border-dark-border space-y-2">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="school-secondary w-full"
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
        <div className="rounded-cardLg border border-dashed border-line dark:border-dark-border bg-surface-alt/50 dark:bg-dark-card/40 py-20 px-6 text-center">
          <h2 className="school-card-title text-ink dark:text-white">
            {total === 0 ? "Aún no hay tutoriales para este público" : "Sin tutoriales que coincidan"}
          </h2>
          <p className="mt-1.5 text-[13px] text-ink-subtle max-w-sm mx-auto">
            {total > 0 ? "Prueba con otro término o cambia el área curricular."
              : isAdminMode ? "Usa el botón Nuevo tutorial para publicar el primero."
                : "Puedes consultar los tutoriales del otro público mientras se publican nuevas guías."}
          </p>
          {hasActiveFilters && total > 0 && (
            <button
              onClick={clearFilters}
              className="mt-5 h-9 px-4 rounded-btn bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <i className="fas fa-arrow-rotate-left text-[10px]" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 min-h-10 px-3 rounded-full text-[12px] font-medium transition-colors ${
        active
          ? "bg-primary-600 text-white shadow-sm"
          : "bg-surface-sunk dark:bg-dark-elev text-ink-subtle hover:text-ink dark:hover:text-white hover:bg-line dark:hover:bg-dark-border"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`text-[9px] tabular-nums px-1.5 py-0.5 rounded-full ${
          active ? "bg-white/20 text-white" : "bg-white dark:bg-dark-card text-ink-subtle"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}
