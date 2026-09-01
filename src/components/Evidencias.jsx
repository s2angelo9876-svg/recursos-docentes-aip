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

const CATEGORIA_COLORS = {
  "Gestión": "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-100 dark:border-blue-900/40",
  "Robótica": "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 border-green-100 dark:border-green-900/40",
  "Taller": "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 border-purple-100 dark:border-purple-900/40",
  "Feria": "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
  "Concurso": "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-900/40",
  "Capacitación": "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/40",
  "Proyecto": "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
  "Celebración": "bg-pink-50 text-pink-600 dark:text-pink-600 dark:bg-pink-950/30 dark:text-pink-400 border-pink-100 dark:border-pink-900/40",
  "Galería": "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40",
  "Otro": "bg-gray-50 text-gray-500 dark:bg-dark-border dark:text-gray-400 border-gray-200 dark:border-dark-border",
};

function isVideoItem(item) {
  if (!item) return false;
  if (item.mimetype && item.mimetype.startsWith("video/")) return true;
  if (item.mimetype && item.mimetype.startsWith("image/")) return false;
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

function EvidenciaMedia({ evidencia }) {
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
        className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-105"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-150 dark:border-dark-border bg-gray-100 dark:bg-dark-border aspect-video group/media">
      {renderCover()}

      {(isFirstVideo || ytId) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
            <i className="fas fa-play text-sm ml-0.5"></i>
          </div>
        </div>
      )}

      {isCollection && (
        <>
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-md text-[10px] font-black">
            <i className="fas fa-layer-group text-[11px]"></i>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-black backdrop-blur-sm">
            1 / {imgs.length}
          </div>
          {imgs.length >= 2 && (
            <div className="absolute top-2 left-2 flex gap-1">
              {imgs.slice(1, 4).map((img, i) => {
                const isVid = isVideoItem(img);
                return (
                  <div key={i} className="w-8 h-8 rounded-md overflow-hidden border-2 border-white/80 shadow-md rotate-3 relative">
                    {isVid ? (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white">
                        <i className="fas fa-play text-[10px]"></i>
                      </div>
                    ) : (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                );
              })}
              {imgs.length > 4 && (
                <div className="w-8 h-8 rounded-md bg-black/70 text-white text-[9px] font-black flex items-center justify-center border-2 border-white/80 shadow-md">
                  +{imgs.length - 4}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EvidenciaCard({ ev, onOpenGaleria, isAdminMode, onEditClick, onDeleteClick }) {
  const imgs = normalizeImgs(ev);
  const ytId = ev.tipo === "Video" && imgs.length === 1
    ? getYouTubeId(imgs[0]?.url)
    : null;
  const isVideoOnly = ev.tipo === "Video" && imgs.length === 1 && !ytId && isVideoItem(imgs[0]);
  const isCollection = imgs.length > 1;
  const isDriveFolder = Boolean(ev.driveFolderUrl);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-gray-150 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col overflow-hidden"
    >
      <div className="p-3 pb-0">
        <EvidenciaMedia evidencia={ev} />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-gray-50 text-gray-500 dark:bg-dark-border dark:text-gray-400 border-gray-200 dark:border-dark-border">
            <i className="far fa-calendar-alt mr-1"></i>{ev.mes}
          </span>
          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${CATEGORIA_COLORS[ev.categoria] || CATEGORIA_COLORS["Otro"]}`}>
            {ev.categoria}
          </span>
          {ev.tipo === "Video" && (
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-900/40">
              <i className="fas fa-video mr-0.5 text-[7px]"></i> Video
            </span>
          )}
          {ev.tipo === "Ambos" && (
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 border-violet-100 dark:border-violet-900/40">
              <i className="fas fa-photo-video mr-0.5 text-[7px]"></i> Mixto
            </span>
          )}
          {isCollection && !isDriveFolder && (
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40">
              <i className="fas fa-layer-group mr-0.5 text-[7px]"></i> {imgs.length}
            </span>
          )}
          {isDriveFolder && (
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40">
              <i className="fab fa-google-drive mr-0.5 text-[7px]"></i> Carpeta
            </span>
          )}
        </div>

        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2 uppercase leading-tight line-clamp-2 text-left">
          {ev.titulo}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 flex-1 text-left">
          {ev.desc}
        </p>

        {isCollection || isDriveFolder ? (
          <button
            type="button"
            onClick={() => onOpenGaleria(ev)}
            className="mt-4 w-full py-2 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-400 transition-colors rounded-xl border border-indigo-200 dark:border-indigo-900/50 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
          >
            <i className={`${isDriveFolder ? "fab fa-google-drive" : "fas fa-images"} text-[10px]`}></i>
            Ver Galería
          </button>
        ) : ytId ? (
          <a
            href={imgs[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-600 hover:text-white text-red-700 dark:text-red-400 transition-colors rounded-xl border border-red-200 dark:border-red-900/50 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
          >
            <i className="fab fa-youtube text-[10px]"></i>
            Ver en YouTube
          </a>
        ) : isVideoOnly ? (
          <button
            type="button"
            onClick={() => onOpenGaleria(ev)}
            className="mt-4 w-full py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-600 hover:text-white text-red-700 dark:text-red-400 transition-colors rounded-xl border border-red-200 dark:border-red-900/50 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
          >
            <i className="fas fa-play text-[10px]"></i>
            Ver Video
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenGaleria(ev)}
            className="mt-4 w-full py-2 bg-gray-50 dark:bg-dark-border hover:bg-primary dark:hover:bg-dark-accent hover:text-white text-gray-700 dark:text-gray-300 transition-colors rounded-xl border border-gray-150 dark:border-dark-border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
          >
            <i className="fas fa-image text-[10px]"></i>
            Ver Foto
          </button>
        )}

        {isAdminMode && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onEditClick && onEditClick(ev)}
              className="flex-1 py-1.5 bg-amber-50 dark:bg-amber-950/10 hover:bg-amber-500 hover:text-white border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <i className="fas fa-edit text-[9px]"></i> Editar
            </button>
            <button
              onClick={() => onDeleteClick && onDeleteClick(ev.id)}
              className="flex-1 py-1.5 bg-red-50 dark:bg-red-950/10 hover:bg-red-600 hover:text-white border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <i className="fas fa-trash-alt text-[9px]"></i> Eliminar
            </button>
          </div>
        )}
      </div>
    </motion.div>
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

  const filtradas = useMemo(() => {
    const base = evidencias || [];
    const q = busqueda.toLowerCase();

    return base
      .filter((e) => {
        const matchMes = mesSel === MES_TODOS || e.mes === mesSel;
        const matchCategoria =
          categoriaSel === "Todas"
            ? true
            : e.categoria === categoriaSel;
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

  const renderFlat = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <AnimatePresence mode="popLayout">
        {filtradas.map((e) => (
          <EvidenciaCard
            key={e.id}
            ev={e}
            onOpenGaleria={openEvidenciaGaleria}
            isAdminMode={isAdminMode}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </AnimatePresence>
    </div>
  );

  const renderGrouped = () => {
    if (grouped.size === 0) return renderEmpty();
    return (
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([year, months]) => (
          <section key={year}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {year}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 dark:from-dark-border to-transparent" />
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-300">
                {[...months.values()].reduce((acc, arr) => acc + arr.length, 0)} items
              </span>
            </div>

            <div className="space-y-6">
              {Array.from(months.entries()).map(([month, items]) => (
                <div key={month}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <i className="far fa-calendar-alt mr-1.5"></i>
                      {month}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      ({items.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                      {items.map((e) => (
                        <EvidenciaCard
                          key={e.id}
                          ev={e}
                          onOpenGaleria={openEvidenciaGaleria}
                          isAdminMode={isAdminMode}
                          onEditClick={onEditClick}
                          onDeleteClick={onDeleteClick}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  };

  const renderEmpty = () => (
    <div className="py-16 bg-white dark:bg-dark-card rounded-2xl border border-dashed border-gray-200 dark:border-dark-border text-center">
      <i className="far fa-star text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
      <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 uppercase">Sin evidencias</h3>
      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 max-w-xs mx-auto">
        {mesSel === MES_TODOS
          ? "Aún no hay evidencias registradas."
          : "Prueba cambiando el mes o el filtro."}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-gray-150 dark:border-dark-border shadow-sm space-y-4 transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 text-xs">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-accent text-xs"
              placeholder="Buscar actividad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select
            className="border border-gray-200 dark:border-dark-border rounded-xl px-3 py-2 text-xs bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 outline-none"
            value={categoriaSel}
            onChange={(e) => setCategoriaSel(e.target.value)}
          >
            <option value="Todas">Todas las categorías</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-gray-100 dark:border-dark-border">
          <button
            onClick={() => setMesSel(MES_TODOS)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${mesSel === MES_TODOS
              ? "bg-gradient-to-r from-primary to-blue-600 dark:from-dark-accent dark:to-blue-500 text-white border-transparent shadow-sm"
              : "bg-gray-50 dark:bg-dark-border text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:bg-gray-100"
              }`}
          >
            <i className="fas fa-layer-group mr-1"></i> Todas
          </button>
          {MESES.map((m) => (
            <button
              key={m}
              onClick={() => setMesSel(m)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${mesSel === m
                ? "bg-primary dark:bg-dark-accent text-white border-primary dark:border-dark-accent"
                : "bg-gray-50 dark:bg-dark-border text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:bg-gray-100"
                }`}
            >
              {m}
            </button>
          ))}
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
