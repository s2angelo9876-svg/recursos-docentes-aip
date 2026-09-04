import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonStats, SkeletonFilterBar, SkeletonGrid } from "./Skeleton";

const AREAS_CNEB = [
  "Matemática",
  "Comunicación",
  "Inglés",
  "Arte y Cultura",
  "Ciencias Sociales",
  "DPCC",
  "Educación Física",
  "Educación Religiosa",
  "Ciencia y Tecnología",
  "Educación para el Trabajo",
];

const GRADOS = ["1.° Sec", "2.° Sec", "3.° Sec", "4.° Sec", "5.° Sec"];

const AREA_COLORS = {
  Matemática: { bar: "bg-primary-600", chip: "bg-primary-50 text-primary-700 dark:bg-primary-600/15 dark:text-primary-300" },
  Comunicación: { bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  Inglés: { bar: "bg-rose-500", chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  "Arte y Cultura": { bar: "bg-fuchsia-500", chip: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300" },
  "Ciencias Sociales": { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  DPCC: { bar: "bg-indigo-500", chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" },
  "Educación Física": { bar: "bg-orange-500", chip: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" },
  "Educación Religiosa": { bar: "bg-violet-500", chip: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  "Ciencia y Tecnología": { bar: "bg-cyan-500", chip: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300" },
  "Educación para el Trabajo": { bar: "bg-teal-500", chip: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300" },
};

const getTipoMeta = (tipo) => {
  const t = (tipo || "").toLowerCase();
  if (t.includes("video")) return { icon: "fa-play", label: "Video", cls: "bg-accent-500" };
  if (t.includes("web") || t.includes("app")) return { icon: "fa-globe", label: "Web", cls: "bg-sky-500" };
  if (t.includes("simul")) return { icon: "fa-flask-vial", label: "Simulación", cls: "bg-emerald-500" };
  if (t.includes("juego")) return { icon: "fa-gamepad", label: "Juego", cls: "bg-violet-500" };
  if (t.includes("colec")) return { icon: "fa-folder", label: "Colección", cls: "bg-amber-500" };
  return { icon: "fa-file-lines", label: tipo || "Documento", cls: "bg-slate-500" };
};

const getSubIconClass = (tipo, url) => {
  const t = (tipo || "").toLowerCase();
  const u = (url || "").toLowerCase();
  if (u.endsWith(".pdf") || t.includes("pdf")) return "fa-file-pdf text-accent-500";
  if (u.endsWith(".mp4") || u.endsWith(".mov") || t.includes("video")) return "fa-file-video text-sky-500";
  if (u.match(/\.(png|jpg|jpeg|gif|webp)/) || t.includes("imagen")) return "fa-file-image text-emerald-500";
  return "fa-link text-ink-meta";
};

const easeOut = [0.16, 1, 0.3, 1];
const PAGE_SIZE = 9;

export default function Repositorio({ isAdminMode = false, onEditClick = null, onDeleteClick = null }) {
  const { recursos, favoritos, toggleFavorito, deleteRecurso, isLoading } = useApp();

  const [busqueda, setBusqueda] = useState("");
  const [areaSel, setAreaSel] = useState("Todas");
  const [gradoSel, setGradoSel] = useState("Todos");
  const [expandedCards, setExpandedCards] = useState([]);
  const [page, setPage] = useState(1);

  const toggleCardExpansion = (id) => {
    setExpandedCards((prev) =>
      prev.includes(id) ? prev.filter((cardId) => cardId !== id) : [...prev, id]
    );
  };

  const filtrados = useMemo(() => {
    const listaRecursos = recursos || [];
    return listaRecursos.filter((r) => {
      const matchArea = areaSel === "Todas" || r.area === areaSel;
      const matchGrado = gradoSel === "Todos" || (r.grados && r.grados.includes(gradoSel));
      const matchBusqueda =
        (r.titulo || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.desc || "").toLowerCase().includes(busqueda.toLowerCase());
      return matchArea && matchGrado && matchBusqueda;
    });
  }, [recursos, areaSel, gradoSel, busqueda]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtrados.slice(pageStart, pageStart + PAGE_SIZE);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonStats count={4} />
        <SkeletonFilterBar />
        <SkeletonGrid items={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-cardLg border border-line dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-meta text-sm pointer-events-none" />
              <input
                type="text"
                className="w-full pl-10 pr-4 h-11 rounded-btn border border-line dark:border-dark-border bg-white dark:bg-dark-input text-[13.5px] text-ink dark:text-white placeholder:text-ink-meta focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="Buscar recursos por tema, título o descripción…"
                value={busqueda}
                onChange={(e) => handleFilterChange(setBusqueda)(e.target.value)}
                aria-label="Buscar recursos"
              />
            </div>

            <div className="relative">
              <select
                className="appearance-none h-11 pl-4 pr-10 rounded-btn border border-line dark:border-dark-border bg-white dark:bg-dark-input text-[13px] text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all cursor-pointer"
                value={areaSel}
                onChange={(e) => handleFilterChange(setAreaSel)(e.target.value)}
                aria-label="Filtrar por área"
              >
                <option value="Todas">Todas las áreas</option>
                {AREAS_CNEB.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-ink-meta text-[10px] pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-line-subtle dark:border-dark-border">
            <span className="text-[10px] font-semibold text-ink-meta uppercase tracking-wider mr-1">
              Grado
            </span>
            <FilterPill active={gradoSel === "Todos"} onClick={() => handleFilterChange(setGradoSel)("Todos")}>
              Todos
            </FilterPill>
            {GRADOS.map((g) => (
              <FilterPill
                key={g}
                active={gradoSel === g}
                onClick={() => handleFilterChange(setGradoSel)(g)}
              >
                {g}
              </FilterPill>
            ))}
          </div>
        </div>

        <div className="px-5 pb-4 flex items-center justify-between text-[12px] text-ink-subtle">
          <span>
            <span className="font-semibold text-ink dark:text-white tabular-nums">
              {filtrados.length}
            </span>{" "}
            {filtrados.length === 1 ? "recurso encontrado" : "recursos encontrados"}
          </span>
          {(busqueda || areaSel !== "Todas" || gradoSel !== "Todos") && (
            <button
              onClick={() => {
                setBusqueda("");
                setAreaSel("Todas");
                setGradoSel("Todos");
                setPage(1);
              }}
              className="text-primary-600 dark:text-primary-300 hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {filtrados.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {pageItems.map((r, i) => {
                const isFav = favoritos && favoritos.includes(r.id);
                const isExpanded = expandedCards.includes(r.id);
                const tipoMeta = getTipoMeta(r.tipo);
                const areaMeta = AREA_COLORS[r.area] || {
                  bar: "bg-slate-500",
                  chip: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
                };

                return (
                  <motion.article
                    layout
                    key={r.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease: easeOut }}
                    className="group relative flex flex-col rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-500/40 transition-all duration-300 overflow-hidden"
                  >
                    <div className={`h-1 w-full ${areaMeta.bar}`} aria-hidden />

                    <div className="relative h-32 bg-gradient-to-br from-surface-alt to-surface-sunk dark:from-dark-elev dark:to-dark-card flex items-center justify-center overflow-hidden">
                      <i
                        className={`fas ${tipoMeta.icon} text-4xl text-ink-meta/40 dark:text-white/15 group-hover:text-primary-500/60 group-hover:scale-110 transition-all duration-500`}
                      />
                      <span
                        className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${tipoMeta.cls}`}
                      >
                        <i className={`fas ${tipoMeta.icon} text-[8px]`} />
                        {tipoMeta.label}
                      </span>
                      <button
                        onClick={() => toggleFavorito(r.id)}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 dark:bg-dark-card/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
                        title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
                        aria-label={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
                      >
                        <i
                          className={`${isFav ? "fas text-amber-500" : "far text-ink-meta"} fa-star text-xs`}
                        />
                      </button>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <span
                        className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-[10px] font-semibold ${areaMeta.chip}`}
                      >
                        {r.area}
                      </span>

                      <h3 className="mt-2.5 text-[15px] font-semibold tracking-tight text-ink dark:text-white leading-snug">
                        {r.titulo}
                      </h3>
                      <p className="mt-1.5 text-[12.5px] text-ink-subtle leading-relaxed line-clamp-3">
                        {r.desc}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {r.grados?.slice(0, 4).map((g) => (
                          <span
                            key={g}
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-sunk dark:bg-dark-elev text-ink-subtle font-medium tabular-nums"
                          >
                            {g}
                          </span>
                        ))}
                        {r.grados && r.grados.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-sunk dark:bg-dark-elev text-ink-subtle font-medium">
                            +{r.grados.length - 4}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-4 border-t border-line-subtle dark:border-dark-border space-y-2">
                        {r.contenidos && r.contenidos.length > 1 ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => toggleCardExpansion(r.id)}
                              className="w-full h-9 px-3 bg-surface-alt dark:bg-dark-elev hover:bg-primary-50 dark:hover:bg-primary-600/15 text-ink dark:text-white rounded-btn text-[12px] font-medium transition-colors flex items-center justify-between"
                            >
                              <span className="inline-flex items-center gap-2">
                                <i className="fas fa-layer-group text-[11px] text-primary-600 dark:text-primary-300" />
                                Materiales ({r.contenidos.length})
                              </span>
                              <i
                                className={`fas ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-[10px] text-ink-meta`}
                              />
                            </button>
                            {isExpanded && (
                              <ul className="mt-2 space-y-1 max-h-44 overflow-y-auto pr-1">
                                {r.contenidos.map((mat) => (
                                  <li key={mat.id}>
                                    <a
                                      href={mat.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-alt/60 dark:bg-dark-elev/60 hover:bg-primary-50 dark:hover:bg-primary-600/10 transition-colors text-[12px]"
                                      title={`Abrir: ${mat.titulo}`}
                                    >
                                      <span className="inline-flex items-center gap-2 truncate">
                                        <i className={`fas ${getSubIconClass(mat.tipo, mat.url)} text-[11px] shrink-0`} />
                                        <span className="font-medium text-ink dark:text-white truncate">
                                          {mat.titulo}
                                        </span>
                                      </span>
                                      <i className="fas fa-arrow-up-right-from-square text-[9px] text-ink-meta shrink-0" />
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const singleUrl = r.contenidos?.[0]?.url || r.url;
                            return (
                              <a
                                href={singleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-btn bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-semibold transition-colors"
                              >
                                Abrir recurso
                                <i className="fas fa-arrow-up-right-from-square text-[10px]" />
                              </a>
                            );
                          })()
                        )}

                        {isAdminMode && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onEditClick && onEditClick(r)}
                              className="flex-1 h-8 rounded-btn bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-white text-[11px] font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                            >
                              <i className="fas fa-pen text-[9px]" /> Editar
                            </button>
                            <button
                              onClick={() =>
                                onDeleteClick
                                  ? onDeleteClick(r.id)
                                  : window.confirm("¿Eliminar este recurso?") && deleteRecurso(r.id)
                              }
                              className="flex-1 h-8 rounded-btn bg-accent-50 hover:bg-accent-500 hover:text-white text-accent-600 dark:bg-accent-700/15 dark:text-accent-300 dark:hover:bg-accent-500 dark:hover:text-white text-[11px] font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                            >
                              <i className="fas fa-trash text-[9px]" /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-1.5 pt-4" aria-label="Paginación">
              <PageBtn disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <i className="fas fa-chevron-left text-[10px]" />
              </PageBtn>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <PageBtn key={n} active={n === safePage} onClick={() => setPage(n)}>
                  {n}
                </PageBtn>
              ))}
              <PageBtn
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <i className="fas fa-chevron-right text-[10px]" />
              </PageBtn>
            </nav>
          )}
        </>
      ) : (
        <div className="rounded-cardLg border border-dashed border-line dark:border-dark-border bg-surface-alt/50 dark:bg-dark-card/40 py-16 px-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunk dark:bg-dark-elev text-ink-meta mb-4">
            <i className="fas fa-folder-open text-2xl" />
          </span>
          <h3 className="text-[15px] font-semibold text-ink dark:text-white">
            Sin recursos que coincidan
          </h3>
          <p className="mt-1.5 text-[13px] text-ink-subtle max-w-sm mx-auto">
            Ajusta los filtros o limpia la búsqueda para explorar todo el catálogo pedagógico.
          </p>
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 ${
        active
          ? "bg-primary-600 text-white shadow-sm"
          : "bg-surface-sunk dark:bg-dark-elev text-ink-subtle hover:text-ink dark:hover:text-white hover:bg-line dark:hover:bg-dark-border"
      }`}
    >
      {children}
    </button>
  );
}

function PageBtn({ active = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-w-9 h-9 px-3 rounded-btn text-[12px] font-semibold transition-colors inline-flex items-center justify-center gap-1 ${
        active
          ? "bg-primary-600 text-white"
          : disabled
            ? "text-ink-meta/50 cursor-not-allowed"
            : "text-ink-subtle hover:bg-surface-alt dark:hover:bg-dark-elev hover:text-ink dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
