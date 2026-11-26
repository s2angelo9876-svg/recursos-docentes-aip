import { storageLink } from "../services/imageUrl";
import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { getYouTubeId, getYouTubeThumbnail } from "../utils/youtube";
import { listDriveImages, DriveGalleryError } from "../services/googleDrive";
import GaleriaModal from "./GaleriaModal";
import { SkeletonGrid } from "./Skeleton";
import SignedImage from "./SignedImage";

const MESES = [
  "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MES_ABREV = {
  "Marzo": "Mar", "Abril": "Abr", "Mayo": "May", "Junio": "Jun",
  "Julio": "Jul", "Agosto": "Ago", "Septiembre": "Sep",
  "Octubre": "Oct", "Noviembre": "Nov", "Diciembre": "Dic",
};
const MES_TODOS = "Todas";

const mesActual = new Date().getMonth();
const MES_INICIAL = mesActual >= 2 ? MESES[mesActual - 2] : "Marzo";

const TIPO_META = {
  Foto:  { icon: "fa-image",      cls: "bg-primary-500",  label: "Foto" },
  Video: { icon: "fa-video",      cls: "bg-accent-500",   label: "Video" },
  Ambos: { icon: "fa-photo-film", cls: "bg-violet-700",   label: "Mixto" },
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
      return <img src={getYouTubeThumbnail(ytId, "hqdefault")} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />;
    }
    if (isFirstVideo) {
      return (
        <video
          src={storageLink(firstItem.url) || undefined}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <SignedImage
        src={firstItem?.url || ""}
        alt={evidencia.titulo}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
    );
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Abrir ${evidencia.titulo}`}
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
                      <SignedImage src={img.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
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

function EvidenciaCard({ ev, onOpen, isAdmin, onEdit, onDelete, titleAs: Title = "h2" }) {
  const imgs = normalizeImgs(ev);
  const ytId = ev.tipo === "Video" && imgs.length === 1 ? getYouTubeId(imgs[0]?.url) : null;
  const isVideoOnly = ev.tipo === "Video" && imgs.length === 1 && !ytId && isVideoItem(imgs[0]);
  const isCollection = imgs.length > 1;
  const isDriveFolder = Boolean(ev.driveFolderUrl);
  const tipoMeta = TIPO_META[ev.tipo] || TIPO_META.Foto;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="school-content-card group relative flex flex-col overflow-hidden"
    >
      <EvidenciaMedia evidencia={ev} onOpen={onOpen} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-alt dark:bg-dark-elev text-ink-subtle">
            <i className="far fa-calendar text-[9px]" />
            {ev.mes}
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

        <Title className="school-card-title text-ink dark:text-white">
          {ev.titulo}
        </Title>
        <p className="mt-1.5 text-[12.5px] text-ink-subtle leading-relaxed line-clamp-3 flex-1">
          {ev.desc}
        </p>

        <div className="mt-4 pt-4 border-t border-line-subtle dark:border-dark-border space-y-2">
          {isCollection || isDriveFolder ? (
            <button
              type="button"
              onClick={onOpen}
              className="school-secondary w-full"
            >
              <i className={`${isDriveFolder ? "fab fa-google-drive" : "fas fa-images"} text-[11px]`} />
              {isDriveFolder ? "Abrir carpeta" : `Ver galería (${imgs.length})`}
            </button>
          ) : ytId ? (
            <a
              href={imgs[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="school-secondary w-full"
            >
              <i className="fab fa-youtube text-[11px]" />
              Ver en YouTube
            </a>
          ) : isVideoOnly ? (
            <button
              type="button"
              onClick={onOpen}
              className="school-secondary w-full"
            >
              <i className="fas fa-play text-[10px]" />
              Reproducir video
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="school-secondary w-full"
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

function FilterChip({ active, onClick, children, label = children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}, ${count} ${count === 1 ? "evidencia" : "evidencias"}`}
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

export default function Evidencias({ isAdminMode = false, onEditClick = null, onDeleteClick = null }) {
  const { evidencias, isLoading } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(null);
  const initialMonth = evidencias.some((e) => e.mes === MES_INICIAL) ? MES_INICIAL : MES_TODOS;
  const mesSel = selectedMonth ?? initialMonth;
  const total = evidencias.length;
  const [busqueda, setBusqueda] = useState("");
  const [galeria, setGaleria] = useState({
    open: false,
    images: [],
    index: 0,
    title: "Galería",
    loading: false,
    error: null,
  });

  const countsByMonth = useMemo(() => {
    const map = new Map();
    for (const e of evidencias || []) {
      if (e.mes) map.set(e.mes, (map.get(e.mes) || 0) + 1);
    }
    return map;
  }, [evidencias]);

  const filtradas = useMemo(() => {
    const base = evidencias || [];
    const q = busqueda.toLowerCase();
    return base
      .filter((e) => {
        const matchMes = mesSel === MES_TODOS || e.mes === mesSel;
        const matchBusqueda =
          (e.titulo || "").toLowerCase().includes(q) ||
          (e.desc || "").toLowerCase().includes(q);
        return matchMes && matchBusqueda;
      })
      .sort((a, b) => {
        const da = a.fecha ? new Date(a.fecha).getTime() : 0;
        const db = b.fecha ? new Date(b.fecha).getTime() : 0;
        return db - da;
      });
  }, [evidencias, mesSel, busqueda]);

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

  const hasActiveFilters = busqueda || mesSel !== initialMonth;

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
    setSelectedMonth(null);
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
                            titleAs="h4"
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
      <h2 className="school-card-title text-ink dark:text-white">
        {total === 0 ? "Aún no hay evidencias registradas" : "Sin coincidencias"}
      </h2>
      <p className="mt-1.5 text-[13px] text-ink-subtle max-w-sm mx-auto">
        {total > 0 ? "Prueba con otro mes o limpia los filtros para ver más resultados."
          : isAdminMode ? "Usa el botón Nuevo para publicar la primera actividad."
            : "Las actividades del aula se mostrarán aquí cuando se publiquen."}
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

  if (isLoading) {
    return <SkeletonGrid items={6} />;
  }

  return (
    <div className="space-y-6">
      <div className="school-content-card">
        <div className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-meta text-sm pointer-events-none" />
              <input
                type="search"
                className="w-full pl-10 pr-4 h-11 rounded-btn border border-line dark:border-dark-border bg-white dark:bg-dark-input text-[13.5px] text-ink dark:text-white placeholder:text-ink-meta focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="Buscar por título o descripción…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar evidencias"
              />
            </div>
          </div>

          <label className="school-select-filter block sm:hidden">Mes
            <select value={mesSel} onChange={(event) => setSelectedMonth(event.target.value)}>
              <option value={MES_TODOS}>Todos los meses</option>
              {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <div className="hidden sm:flex items-center gap-3" role="group" aria-label="Mes">
            <span className="text-[12px] font-semibold text-ink-meta shrink-0">
              Mes
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                active={mesSel === MES_TODOS}
                onClick={() => setSelectedMonth(MES_TODOS)}
                count={total}
              >
                Todas
              </FilterChip>
              {MESES.map((m) => (
                <FilterChip
                  key={m}
                  active={mesSel === m}
                  onClick={() => setSelectedMonth(m)}
                  label={m}
                  count={countsByMonth.get(m) || 0}
                >
                  {MES_ABREV[m] || m}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-surface-alt/60 dark:bg-dark-elev/40 border-t border-line dark:border-dark-border flex items-center justify-between text-[12px] text-ink-subtle">
          <span role="status">
            Mostrando{" "}
            <span className="font-semibold text-ink dark:text-white tabular-nums">
              {filtradas.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold tabular-nums">{total}</span>{" "}
            {total === 1 ? "evidencia" : "evidencias"}
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
