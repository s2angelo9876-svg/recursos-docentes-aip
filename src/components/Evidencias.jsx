import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { getYouTubeId, getYouTubeThumbnail } from "../utils/youtube";
import { listDriveImages, DriveGalleryError } from "../services/googleDrive";
import GaleriaModal from "./GaleriaModal";

const MESES = [
  "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MES_TODOS = "Todas";

const CATEGORIAS = [
  "Gestión", "Robótica", "Taller", "Feria", "Concurso",
  "Capacitación", "Proyecto", "Celebración", "Galería", "Otro",
];

const mesActual = new Date().getMonth();
const MES_INICIAL = mesActual >= 2 ? MESES[mesActual - 2] : "Marzo";

const CATEGORIA_META = {
  "Gestión":      { cls: "bg-primary-50 text-primary-700 dark:bg-primary-600/15 dark:text-primary-300 border-primary-100 dark:border-primary-500/30", icon: "fa-briefcase" },
  "Robótica":     { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-600/15 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/30", icon: "fa-robot" },
  "Taller":       { cls: "bg-violet-50 text-violet-700 dark:bg-violet-600/15 dark:text-violet-300 border-violet-100 dark:border-violet-500/30", icon: "fa-screwdriver-wrench" },
  "Feria":        { cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-100 dark:border-amber-500/30", icon: "fa-star" },
  "Concurso":     { cls: "bg-accent-50 text-accent-700 dark:bg-accent-700/15 dark:text-accent-300 border-accent-100 dark:border-accent-700/30", icon: "fa-trophy" },
  "Capacitación": { cls: "bg-cyan-50 text-cyan-700 dark:bg-cyan-600/15 dark:text-cyan-300 border-cyan-100 dark:border-cyan-500/30", icon: "fa-chalkboard-teacher" },
  "Proyecto":     { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-600/15 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/30", icon: "fa-diagram-project" },
  "Celebración":  { cls: "bg-pink-50 text-pink-700 dark:bg-pink-600/15 dark:text-pink-300 border-pink-100 dark:border-pink-500/30", icon: "fa-party-horn" },
  "Galería":      { cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-600/15 dark:text-indigo-300 border-indigo-100 dark:border-indigo-500/30", icon: "fa-images" },
  "Otro":         { cls: "bg-slate-50 text-slate-700 dark:bg-slate-600/15 dark:text-slate-300 border-slate-200 dark:border-slate-500/30", icon: "fa-tag" },
};

const TIPO_META = {
  Foto:  { icon: "fa-image",      cls: "bg-primary-500",  label: "Foto" },
  Video: { icon: "fa-video",      cls: "bg-accent-500",   label: "Video" },
  Ambos: { icon: "fa-photo-film", cls: "bg-violet-500",   label: "Mixto" },
};

const easeOut = [0.16, 1, 0.3, 1];

function isVideoItem(item) {
  if (!item) return false;
  if (item.mimetype?.startsWith("video/")) return true;
  if (item.mimetype?.startsWith("image/")) return false;
  if (typeof item.url === "string") {
    return /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(item.url);
  }
  return false;
}

function normalizeImgs(ev) {
  const arr = Array.isArray(ev?.imagenes) ? ev.imagenes : [];
  if (arr.length > 0) return arr;
  if (ev?.url) return [{ url: ev.url, name: "archivo", mimetype: null, size: null }];
  return [];
}

function StatsHeader({ total, totalFotos, totalVideos, categoriasCount }) {
  const stats = [
    { icon: "fa-calendar-check", value: total, label: "Actividades", accent: "from-primary-500/20 to-primary-600/5 text-primary-300" },
    { icon: "fa-image",           value: totalFotos, label: "Fotografías", accent: "from-cyan-500/20 to-cyan-600/5 text-cyan-300" },
    { icon: "fa-video",           value: totalVideos, label: "Videos",     accent: "from-accent-500/20 to-accent-600/5 text-accent-300" },
    { icon: "fa-tags",            value: categoriasCount, label: "Categorías", accent: "from-emerald-500/20 to-emerald-600/5 text-emerald-300" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="relative overflow-hidden rounded-cardLg border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4"
        >
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${s.accent} blur-2xl opacity-50 pointer-events-none`} />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-semibold text-ink-subtle uppercase tracking-wider">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-ink dark:text-white">
                {s.value}
              </p>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sunk dark:bg-dark-elev text-ink-subtle">
              <i className={`fas ${s.icon} text-sm`} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidenciaMedia({ evidencia, onOpen }) {
  const imgs = normalizeImgs(evidencia);
  const ytId = evidencia.tipo === "Video" && imgs.length === 1
    ? getYouTubeId(imgs[0]?.url)
    : null;
  const firstItem = imgs[0];
  const isFirstVideo = !ytId && firstItem && isVideoItem(firstItem);
  const isCollection = imgs.length > 1;

  const renderCover = () => {
    if (ytId) {
      return <img src={getYouTubeThumbnail(ytId, "hqdefault")} alt="" className="w-full h-full object-cover" />;
    }
    if (isFirstVideo) {
      return (
        <video
          src={firstItem.url}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <img
        src={firstItem?.url || ""}
        alt={evidencia.titulo}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative block w-full overflow-hidden rounded-t-cardLg aspect-video bg-gradient-to-br from-surface-sunk to-surface-alt dark:from-dark-elev dark:to-dark-card group"
    >
      {renderCover()}

      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {(isFirstVideo || ytId) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-600 text-white shadow-glow transition-transform group-hover:scale-110">
            <i className="fas fa-play text-sm ml-0.5" />
          </span>
        </div>
      )}

      {isCollection && (
        <>
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/95 text-white text-[10px] font-semibold shadow-sm">
            <i className="fas fa-layer-group text-[9px]" />
            {imgs.length}
          </span>
          {imgs.length >= 2 && (
            <div className="absolute top-3 left-3 flex gap-1.5">
              {imgs.slice(1, 4).map((img, i) => {
                const isVid = isVideoItem(img);
                return (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-md overflow-hidden border-2 border-white/80 shadow-md -rotate-3"
                  >
                    {isVid ? (
                      <div className="w-full h-full bg-slate-700 flex items-center justify-center text-white">
                        <i className="fas fa-play text-[9px]" />
                      </div>
                    ) : (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                );
              })}
              {imgs.length > 4 && (
                <div className="w-7 h-7 rounded-md bg-slate-900/85 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white/80 shadow-md">
                  +{imgs.length - 4}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </button>
  );
}

function EvidenciaCard({ ev, onOpen, isAdmin, onEdit, onDelete }) {
  const imgs = normalizeImgs(ev);
  const ytId = ev.tipo === "Video" && imgs.length === 1 ? getYouTubeId(imgs[0]?.url) : null;
  const isVideoOnly = ev.tipo === "Video" && imgs.length === 1 && !ytId && isVideoItem(imgs[0]);
  const isCollection = imgs.length > 1;
  const isDriveFolder = Boolean(ev.driveFolderUrl);
  const catMeta = CATEGORIA_META[ev.categoria] || CATEGORIA_META["Otro"];
  const tipoMeta = TIPO_META[ev.tipo] || TIPO_META.Foto;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="group relative flex flex-col rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border shadow-card hover:shadow-card-hover hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-500/40 transition-all duration-300 overflow-hidden"
    >
      <EvidenciaMedia evidencia={ev} onOpen={onOpen} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-alt dark:bg-dark-elev text-ink-subtle">
            <i className="far fa-calendar text-[9px]" />
            {ev.mes}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catMeta.cls}`}>
            <i className={`fas ${catMeta.icon} text-[9px]`} />
            {ev.categoria}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white ${tipoMeta.cls}`}>
            <i className={`fas ${tipoMeta.icon} text-[9px]`} />
            {tipoMeta.label}
          </span>
          {isDriveFolder && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-600/15 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/30">
              <i className="fab fa-google-drive text-[9px]" />
              Drive
            </span>
          )}
        </div>

        <h3 className="text-[15px] font-semibold tracking-tight text-ink dark:text-white leading-snug line-clamp-2">
          {ev.titulo}
        </h3>
        <p className="mt-1.5 text-[12.5px] text-ink-subtle leading-relaxed line-clamp-3 flex-1">
          {ev.desc}
        </p>

        <div className="mt-4 pt-4 border-t border-line-subtle dark:border-dark-border space-y-2">
          {isCollection || isDriveFolder ? (
            <button
              type="button"
              onClick={onOpen}
              className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-btn bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold transition-colors"
            >
              <i className={`${isDriveFolder ? "fab fa-google-drive" : "fas fa-images"} text-[11px]`} />
              {isDriveFolder ? "Abrir carpeta" : `Ver galería (${imgs.length})`}
            </button>
          ) : ytId ? (
            <a
              href={imgs[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-btn bg-accent-600 hover:bg-accent-700 text-white text-[12px] font-semibold transition-colors"
            >
              <i className="fab fa-youtube text-[11px]" />
              Ver en YouTube
            </a>
          ) : isVideoOnly ? (
            <button
              type="button"
              onClick={onOpen}
              className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-btn bg-accent-600 hover:bg-accent-700 text-white text-[12px] font-semibold transition-colors"
            >
              <i className="fas fa-play text-[10px]" />
              Reproducir video
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-btn bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-semibold transition-colors"
            >
              <i className="fas fa-expand text-[10px]" />
              Ver foto
            </button>
          )}

          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="flex-1 h-8 rounded-btn bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-white text-[11px] font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-pen text-[9px]" /> Editar
              </button>
              <button
                onClick={onDelete}
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
}

function FilterChip({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11.5px] font-medium transition-all duration-200 ${
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

export default function Evidencias({ isAdminMode = false, onEditClick = null, onDeleteClick = null }) {
  const { evidencias } = useApp();
  const [mesSel, setMesSel] = useState(MES_INICIAL);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("Todas");
  const [galeria, setGaleria] = useState({
    open: false,
    images: [],
    index: 0,
    title: "Galería",
    loading: false,
    error: null,
  });

  const stats = useMemo(() => {
    const list = evidencias || [];
    let fotos = 0;
    let videos = 0;
    const cats = new Set();
    for (const e of list) {
      if (e.categoria) cats.add(e.categoria);
      const imgs = normalizeImgs(e);
      for (const img of imgs) {
        if (isVideoItem(img)) videos += 1;
        else fotos += 1;
      }
    }
    return { total: list.length, totalFotos: fotos, totalVideos: videos, categoriasCount: cats.size };
  }, [evidencias]);

  const countsByMonth = useMemo(() => {
    const map = new Map();
    for (const e of evidencias || []) {
      if (e.mes) map.set(e.mes, (map.get(e.mes) || 0) + 1);
    }
    return map;
  }, [evidencias]);

  const countsByCategoria = useMemo(() => {
    const map = new Map();
    for (const e of evidencias || []) {
      if (e.categoria) map.set(e.categoria, (map.get(e.categoria) || 0) + 1);
    }
    return map;
  }, [evidencias]);

  const filtradas = useMemo(() => {
    const base = evidencias || [];
    const q = busqueda.toLowerCase();
    return base
      .filter((e) => {
        const matchMes = mesSel === MES_TODOS || e.mes === mesSel;
        const matchCategoria = categoriaSel === "Todas" || e.categoria === categoriaSel;
        const matchBusqueda =
          (e.titulo || "").toLowerCase().includes(q) ||
          (e.desc || "").toLowerCase().includes(q);
        return matchMes && matchCategoria && matchBusqueda;
      })
      .sort((a, b) => {
        const da = a.fecha ? new Date(a.fecha).getTime() : 0;
        const db = b.fecha ? new Date(b.fecha).getTime() : 0;
        return db - da;
      });
  }, [evidencias, mesSel, busqueda, categoriaSel]);

  const grouped = useMemo(() => {
    if (mesSel !== MES_TODOS) return null;
    const map = new Map();
    for (const e of filtradas) {
      const fecha = e.fecha ? new Date(e.fecha) : new Date();
      const year = String(fecha.getFullYear());
      if (!map.has(year)) map.set(year, new Map());
      const monthKey = e.mes || MESES[0];
      if (!map.get(year).has(monthKey)) map.get(year).set(monthKey, []);
      map.get(year).get(monthKey).push(e);
    }
    return map;
  }, [filtradas, mesSel]);

  const hasActiveFilters = busqueda || categoriaSel !== "Todas" || mesSel !== MES_INICIAL;

  const openEvidenciaGaleria = async (ev) => {
    if (ev.driveFolderUrl) {
      setGaleria({
        open: true,
        images: [],
        index: 0,
        title: ev.titulo || "Galería Drive",
        loading: true,
        error: null,
      });
      try {
        const list = await listDriveImages({ folderId: ev.driveFolderUrl });
        const images = list.map((img) => ({
          id: img.id,
          name: img.name,
          url: img.url,
          thumb: img.thumb,
          mimetype: img.mimetype || null,
          size: img.size || null,
        }));
        setGaleria((g) => ({
          ...g,
          images,
          loading: false,
          error: images.length === 0 ? new DriveGalleryError("La carpeta está vacía o no es accesible", "empty") : null,
        }));
      } catch (err) {
        const e = err instanceof DriveGalleryError
          ? err
          : new DriveGalleryError(err?.message || "Error desconocido", "unknown");
        setGaleria((g) => ({ ...g, loading: false, error: e }));
      }
      return;
    }

    const images = normalizeImgs(ev).map((img, i) => ({
      id: img.url || `img-${i}`,
      name: img.name || `Archivo ${i + 1}`,
      url: img.url,
      thumb: img.url,
      mimetype: img.mimetype || null,
    }));
    setGaleria({
      open: true,
      images,
      index: 0,
      title: ev.titulo || "Galería",
      loading: false,
      error: null,
    });
  };

  const closeGaleria = () => setGaleria((g) => ({ ...g, open: false }));
  const clearFilters = () => {
    setMesSel(MES_INICIAL);
    setCategoriaSel("Todas");
    setBusqueda("");
  };

  const renderFlat = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <AnimatePresence mode="popLayout">
        {filtradas.map((e) => (
          <EvidenciaCard
            key={e.id}
            ev={e}
            onOpen={() => openEvidenciaGaleria(e)}
            isAdmin={isAdminMode}
            onEdit={() => onEditClick && onEditClick(e)}
            onDelete={() => onDeleteClick && onDeleteClick(e)}
          />
        ))}
      </AnimatePresence>
    </div>
  );

  const renderGrouped = () => {
    if (grouped.size === 0) return renderEmpty();
    return (
      <div className="space-y-10">
        {Array.from(grouped.entries()).map(([year, months]) => {
          const totalYear = [...months.values()].reduce((acc, arr) => acc + arr.length, 0);
          return (
            <section key={year}>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-[15px] font-semibold tracking-tight text-ink dark:text-white">
                  {year}
                </h2>
                <span className="text-[11px] font-medium text-ink-subtle">
                  {totalYear} {totalYear === 1 ? "actividad" : "actividades"}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-line dark:from-dark-border to-transparent" />
              </div>

              <div className="space-y-7">
                {Array.from(months.entries()).map(([month, items]) => (
                  <div key={month}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-[12px] font-semibold tracking-tight text-ink dark:text-white inline-flex items-center gap-1.5">
                        <i className="far fa-calendar text-ink-meta" />
                        {month}
                      </h3>
                      <span className="text-[11px] text-ink-subtle">({items.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <AnimatePresence mode="popLayout">
                        {items.map((e) => (
                          <EvidenciaCard
                            key={e.id}
                            ev={e}
                            onOpen={() => openEvidenciaGaleria(e)}
                            isAdmin={isAdminMode}
                            onEdit={() => onEditClick && onEditClick(e)}
                            onDelete={() => onDeleteClick && onDeleteClick(e)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  const renderEmpty = () => (
    <div className="rounded-cardLg border border-dashed border-line dark:border-dark-border bg-surface-alt/50 dark:bg-dark-card/40 py-20 px-6 text-center">
      <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-600/15 dark:to-primary-700/10 text-primary-500 mb-5">
        <i className="far fa-image text-3xl" />
        <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-white text-[10px] font-bold">!</span>
      </div>
      <h3 className="text-[16px] font-semibold text-ink dark:text-white">
        {stats.total === 0 ? "Aún no hay evidencias registradas" : "Sin coincidencias"}
      </h3>
      <p className="mt-1.5 text-[13px] text-ink-subtle max-w-sm mx-auto">
        {stats.total === 0
          ? "Sube la primera actividad usando el botón + Nuevo en la cabecera."
          : "Prueba con otro mes, categoría o limpia los filtros para ver más resultados."}
      </p>
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="mt-5 h-9 px-4 rounded-btn bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5"
        >
          <i className="fas fa-arrow-rotate-left text-[10px]" />
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <StatsHeader
        total={stats.total}
        totalFotos={stats.totalFotos}
        totalVideos={stats.totalVideos}
        categoriasCount={stats.categoriasCount}
      />

      <div className="rounded-cardLg border border-line dark:border-dark-border bg-white dark:bg-dark-card shadow-card overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-meta text-sm pointer-events-none" />
              <input
                type="text"
                className="w-full pl-10 pr-4 h-11 rounded-btn border border-line dark:border-dark-border bg-white dark:bg-dark-input text-[13.5px] text-ink dark:text-white placeholder:text-ink-meta focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="Buscar por título o descripción…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar evidencias"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-ink-meta uppercase tracking-wider w-20 flex-shrink-0">
                Mes
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <FilterChip
                  active={mesSel === MES_TODOS}
                  onClick={() => setMesSel(MES_TODOS)}
                  count={stats.total}
                >
                  Todas
                </FilterChip>
                {MESES.map((m) => (
                  <FilterChip
                    key={m}
                    active={mesSel === m}
                    onClick={() => setMesSel(m)}
                    count={countsByMonth.get(m) || 0}
                  >
                    {m}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-ink-meta uppercase tracking-wider w-20 flex-shrink-0 pt-2">
                Categoría
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <FilterChip
                  active={categoriaSel === "Todas"}
                  onClick={() => setCategoriaSel("Todas")}
                >
                  Todas
                </FilterChip>
                {CATEGORIAS.map((c) => (
                  <FilterChip
                    key={c}
                    active={categoriaSel === c}
                    onClick={() => setCategoriaSel(c)}
                    count={countsByCategoria.get(c) || 0}
                  >
                    {c}
                  </FilterChip>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-surface-alt/60 dark:bg-dark-elev/40 border-t border-line dark:border-dark-border flex items-center justify-between text-[12px] text-ink-subtle">
          <span>
            Mostrando{" "}
            <span className="font-semibold text-ink dark:text-white tabular-nums">
              {filtradas.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold tabular-nums">{stats.total}</span>{" "}
            {stats.total === 1 ? "evidencia" : "evidencias"}
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

      {filtradas.length > 0
        ? (mesSel === MES_TODOS ? renderGrouped() : renderFlat())
        : renderEmpty()}

      <GaleriaModal
        open={galeria.open}
        onClose={closeGaleria}
        images={galeria.images}
        loading={galeria.loading}
        error={galeria.error}
        initialIndex={galeria.index}
        title={galeria.title}
      />
    </div>
  );
}
