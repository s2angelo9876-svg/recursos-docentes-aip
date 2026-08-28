import { useState, useMemo, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { getYouTubeId, getYouTubeThumbnail } from "../utils/youtube";
import { listDriveImages, DriveGalleryError, clearDriveCache } from "../services/googleDrive";
import GaleriaModal from "./GaleriaModal";

const MESES = [
  "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const CATEGORIAS = [
  "Gestión", "Robótica", "Taller", "Feria", "Concurso",
  "Capacitación", "Proyecto", "Celebración", "Galería", "Otro",
];

const DRIVE_CATEGORY = "Galería";

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
  "Celebración": "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400 border-pink-100 dark:border-pink-900/40",
  "Galería": "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40",
  "Otro": "bg-gray-50 text-gray-500 dark:bg-dark-border dark:text-gray-400 border-gray-200 dark:border-dark-border",
};

function normalizeImgs(ev) {
  const arr = Array.isArray(ev?.imagenes) ? ev.imagenes : [];
  if (arr.length > 0) return arr;
  if (ev?.url) return [{ url: ev.url, name: "imagen", mimetype: null, size: null }];
  return [];
}

function EvidenciaMedia({ evidencia }) {
  const imgs = normalizeImgs(evidencia);
  const isVideo = evidencia.tipo === "Video" && imgs.length === 1;
  const ytId = isVideo ? getYouTubeId(imgs[0]?.url) : null;
  const cover = imgs[0]?.url || "";
  const src = ytId
    ? getYouTubeThumbnail(ytId, "hqdefault")
    : (evidencia.thumb || cover);
  const isCollection = imgs.length > 1 && !isVideo;
  const isDrive = evidencia.source === "drive";

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-150 dark:border-dark-border bg-gray-100 dark:bg-dark-border aspect-video group/media">
      <img
        src={src}
        alt={evidencia.titulo}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-105"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
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
              {imgs.slice(1, 4).map((img, i) => (
                <div key={i} className="w-8 h-8 rounded-md overflow-hidden border-2 border-white/80 shadow-md rotate-3">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {imgs.length > 4 && (
                <div className="w-8 h-8 rounded-md bg-black/70 text-white text-[9px] font-black flex items-center justify-center border-2 border-white/80 shadow-md">
                  +{imgs.length - 4}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {isDrive && !isCollection && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-md">
          <i className="fas fa-images text-[11px]"></i>
        </div>
      )}
    </div>
  );
}

function DriveCollectionCard({ driveImages, onOpen, loading }) {
  if (driveImages.length === 0 && !loading) return null;

  const preview = driveImages.slice(0, 4);
  const total = driveImages.length;

  const renderCollage = () => {
    if (total === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <i className="fab fa-google-drive text-4xl"></i>
        </div>
      );
    }
    if (total === 1) {
      return <img src={preview[0].url} alt="" className="w-full h-full object-cover" />;
    }
    if (total === 2) {
      return (
        <div className="grid grid-cols-2 h-full gap-0.5">
          {preview.map((img, i) => (
            <img key={i} src={img.thumb || img.url} alt="" className="w-full h-full object-cover" />
          ))}
        </div>
      );
    }
    if (total === 3) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
          <img src={preview[0].thumb || preview[0].url} alt="" className="row-span-2 w-full h-full object-cover" />
          <img src={preview[1].thumb || preview[1].url} alt="" className="w-full h-full object-cover" />
          <img src={preview[2].thumb || preview[2].url} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
        {preview.map((img, i) => (
          <img key={i} src={img.thumb || img.url} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-dark-card shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col overflow-hidden"
    >
      <div className="p-3 pb-0">
        <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-150 dark:border-dark-border bg-gray-100 dark:bg-dark-border">
          {renderCollage()}

          {loading && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-white/95 dark:bg-dark-card/95 text-indigo-700 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm shadow-sm">
            <i className="fab fa-google-drive text-[10px]"></i> Drive
          </div>

          {total > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/80 text-white text-[10px] font-black backdrop-blur-sm">
              <i className="fas fa-images mr-1"></i>
              {total} {total === 1 ? "foto" : "fotos"}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-gray-50 text-gray-500 dark:bg-dark-border dark:text-gray-400 border-gray-200 dark:border-dark-border">
            <i className="far fa-images mr-1"></i> Carpeta Drive
          </span>
          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40">
            <i className="fab fa-google-drive mr-0.5 text-[7px]"></i> Compartida
          </span>
        </div>

        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2 uppercase leading-tight text-left">
          Galería Google Drive
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 flex-1 text-left">
          {total > 0
            ? `Colección de ${total} foto${total === 1 ? "" : "s"} almacenada${total === 1 ? "" : "s"} en la carpeta compartida de Google Drive.`
            : "Cargando carpeta compartida de Google Drive..."}
        </p>

        <button
          type="button"
          onClick={onOpen}
          disabled={total === 0}
          className="mt-4 w-full py-2 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-400 transition-colors rounded-xl border border-indigo-200 dark:border-indigo-900/50 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-images text-[10px]"></i>
          Ver Galería
        </button>
      </div>
    </motion.div>
  );
}

export default function Evidencias({ isAdminMode = false, onEditClick = null, onDeleteClick = null }) {
  const { evidencias, deleteEvidencia } = useApp();

  const [mesSel, setMesSel] = useState(MES_INICIAL);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("Todas");

  const [driveImages, setDriveImages] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState(null);

  const [galeria, setGaleria] = useState({ open: false, images: [], index: 0, title: "Galería", loading: false, error: null });

  const loadDrive = useCallback(async (force = false) => {
    setDriveLoading(true);
    setDriveError(null);
    if (force) clearDriveCache();
    try {
      const list = await listDriveImages({ forceRefresh: force });
      setDriveImages(list);
    } catch (e) {
      const err = e instanceof DriveGalleryError
        ? e
        : new DriveGalleryError(e?.message || "Error desconocido", "unknown");
      setDriveError(err);
      setDriveImages([]);
    } finally {
      setDriveLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrive(false);
  }, [loadDrive]);

  const filtradas = useMemo(() => {
    const base = evidencias || [];
    const q = busqueda.toLowerCase();

    return base.filter((e) => {
      const matchMes = e.mes === mesSel;
      const matchCategoria =
        categoriaSel === "Todas" || categoriaSel === "Galería"
          ? true
          : e.categoria === categoriaSel;
      const matchBusqueda =
        (e.titulo || "").toLowerCase().includes(q) ||
        (e.desc || "").toLowerCase().includes(q);
      return matchMes && matchCategoria && matchBusqueda;
    });
  }, [evidencias, mesSel, busqueda, categoriaSel]);

  const showDriveCard =
    driveImages.length > 0 &&
    (categoriaSel === "Todas" || categoriaSel === DRIVE_CATEGORY);

  const openDriveGaleria = (driveIndex = 0) => {
    const images = driveImages.map((img) => ({
      id: img.id,
      name: img.name,
      url: img.url,
      thumb: img.thumb,
    }));
    setGaleria({
      open: true,
      images,
      index: driveIndex,
      title: "Galería Google Drive",
      loading: driveLoading,
      error: driveError,
    });
  };

  const openEvidenciaGaleria = (ev) => {
    const images = normalizeImgs(ev).map((img, i) => ({
      id: img.url || `img-${i}`,
      name: img.name || `Foto ${i + 1}`,
      url: img.url,
      thumb: img.url,
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

  const closeGaleria = () => {
    setGaleria((g) => ({ ...g, open: false }));
  };

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
            <option value="Todas">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadDrive(true)}
            disabled={driveLoading}
            title="Recargar galería Drive"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-950/40 disabled:opacity-50 transition-all whitespace-nowrap"
          >
            <i className={`fas ${driveLoading ? "fa-spinner fa-spin" : "fa-sync-alt"}`}></i>
            {driveLoading ? "Cargando" : "Drive"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-gray-100 dark:border-dark-border">
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

        {driveError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-400">
            <i className="fas fa-exclamation-triangle"></i>
            <span>
              No se pudo cargar la galería de Drive: {driveError.message}
              {driveError.code === "not_found" && " (verifica que la carpeta sea pública)"}
            </span>
          </div>
        )}
      </div>

      {filtradas.length > 0 || showDriveCard ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {showDriveCard && (
              <DriveCollectionCard
                driveImages={driveImages}
                loading={driveLoading}
                onOpen={() => openDriveGaleria(0)}
              />
            )}
            {filtradas.map((e) => {
              const isDrive = e.source === "drive";
              const imgs = normalizeImgs(e);
              const isVideo = e.tipo === "Video" && imgs.length === 1;
              const isCollection = imgs.length > 1 && !isVideo;
              return (
                <motion.div
                  layout
                  key={e.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl border border-gray-150 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col overflow-hidden"
                >
                  <div className="p-3 pb-0">
                    <EvidenciaMedia evidencia={e} />
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-gray-50 text-gray-500 dark:bg-dark-border dark:text-gray-400 border-gray-200 dark:border-dark-border">
                        <i className="far fa-calendar-alt mr-1"></i>{e.mes}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${CATEGORIA_COLORS[e.categoria] || CATEGORIA_COLORS["Otro"]}`}>
                        {e.categoria}
                      </span>
                      {isVideo && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-900/40">
                          <i className="fas fa-play mr-0.5 text-[7px]"></i> Video
                        </span>
                      )}
                      {isCollection && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40">
                          <i className="fas fa-layer-group mr-0.5 text-[7px]"></i> {imgs.length} Fotos
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2 uppercase leading-tight line-clamp-2 text-left">
                      {e.titulo}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 flex-1 text-left">
                      {e.desc}
                    </p>

                    {isCollection ? (
                      <button
                        type="button"
                        onClick={() => openEvidenciaGaleria(e)}
                        className="mt-4 w-full py-2 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-400 transition-colors rounded-xl border border-indigo-200 dark:border-indigo-900/50 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <i className="fas fa-images text-[10px]"></i>
                        Ver Fotos
                      </button>
                    ) : (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 w-full py-2 bg-gray-50 dark:bg-dark-border hover:bg-primary dark:hover:bg-dark-accent hover:text-white text-gray-700 dark:text-gray-300 transition-colors rounded-xl border border-gray-150 dark:border-dark-border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <i className={`${isVideo ? "fas fa-play" : "fas fa-image"} text-[10px]`}></i>
                        {isVideo ? "Ver Video" : "Ver Foto"}
                      </a>
                    )}

                    {!isDrive && isAdminMode && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => onEditClick && onEditClick(e)}
                          className="flex-1 py-1.5 bg-amber-50 dark:bg-amber-950/10 hover:bg-amber-500 hover:text-white border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <i className="fas fa-edit text-[9px]"></i> Editar
                        </button>
                        <button
                          onClick={() => onDeleteClick ? onDeleteClick(e.id) : (window.confirm("¿Eliminar esta evidencia?") && deleteEvidencia(e.id))}
                          className="flex-1 py-1.5 bg-red-50 dark:bg-red-950/10 hover:bg-red-600 hover:text-white border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <i className="fas fa-trash-alt text-[9px]"></i> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-16 bg-white dark:bg-dark-card rounded-2xl border border-dashed border-gray-200 dark:border-dark-border text-center">
          <i className="far fa-star text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 uppercase">Sin evidencias</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 max-w-xs mx-auto">
            Prueba cambiando el mes o el filtro.
          </p>
        </div>
      )}

      <GaleriaModal
        open={galeria.open}
        onClose={closeGaleria}
        images={galeria.images}
        loading={galeria.loading}
        error={galeria.error}
        initialIndex={galeria.index}
        title={galeria.title}
        onRefresh={galeria.title === "Galería Drive" ? () => loadDrive(true) : null}
      />
    </div>
  );
}
