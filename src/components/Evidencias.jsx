import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { getYouTubeId, getYouTubeThumbnail } from "../utils/youtube";
import GaleriaModal from "./GaleriaModal";

const MESES = [
  "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const CATEGORIAS = [
  "Gestión", "Robótica", "Taller", "Feria", "Concurso",
  "Capacitación", "Proyecto", "Celebración", "Otro",
];

// Mes por defecto: el actual si está dentro del periodo escolar (mar-dic), si no, Marzo
const mesActual = new Date().getMonth(); // 0 = Ene ... 11 = Dic
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
  "Otro": "bg-gray-50 text-gray-500 dark:bg-dark-border dark:text-gray-400 border-gray-200 dark:border-dark-border",
};

function EvidenciaMedia({ evidencia }) {
  const ytId = evidencia.tipo === "Video" ? getYouTubeId(evidencia.url) : null;
  const src = ytId ? getYouTubeThumbnail(ytId, "hqdefault") : evidencia.url;

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-150 dark:border-dark-border bg-gray-100 dark:bg-dark-border aspect-video group/media">
      <img
        src={src}
        alt={evidencia.titulo}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-105"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      {evidencia.tipo === "Video" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
            <i className="fas fa-play text-sm ml-0.5"></i>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Evidencias({ isAdminMode = false, onEditClick = null, onDeleteClick = null }) {
  const { evidencias, deleteEvidencia } = useApp();

  const [mesSel, setMesSel] = useState(MES_INICIAL);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("Todas");
  const [galeriaOpen, setGaleriaOpen] = useState(false);

  const filtradas = useMemo(() => {
    const lista = evidencias || [];
    return lista.filter((e) => {
      const matchMes = e.mes === mesSel;
      const matchCategoria = categoriaSel === "Todas" || e.categoria === categoriaSel;
      const q = busqueda.toLowerCase();
      const matchBusqueda =
        (e.titulo || "").toLowerCase().includes(q) ||
        (e.desc || "").toLowerCase().includes(q);
      return matchMes && matchCategoria && matchBusqueda;
    });
  }, [evidencias, mesSel, busqueda, categoriaSel]);

  return (
    <div className="space-y-6">
      {/* Filtros: buscador + categoría + meses */}
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
            onClick={() => setGaleriaOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 dark:from-dark-accent dark:to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md hover:opacity-95 active:scale-95 transition-all whitespace-nowrap"
          >
            <i className="fas fa-images"></i>
            Galería Drive
          </button>
        </div>

        {/* Pills de meses */}
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
      </div>

      {/* Grid de evidencias */}
      {filtradas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtradas.map((e) => (
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
                    {e.tipo === "Video" && (
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-900/40">
                        <i className="fas fa-play mr-0.5 text-[7px]"></i> Video
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2 uppercase leading-tight line-clamp-2 text-left">
                    {e.titulo}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 flex-1 text-left">
                    {e.desc}
                  </p>

                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full py-2 bg-gray-50 dark:bg-dark-border hover:bg-primary dark:hover:bg-dark-accent hover:text-white text-gray-700 dark:text-gray-300 transition-colors rounded-xl border border-gray-150 dark:border-dark-border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <i className={`${e.tipo === "Video" ? "fas fa-play" : "fas fa-image"} text-[10px]`}></i>
                    {e.tipo === "Video" ? "Ver Video" : "Ver Foto"}
                  </a>

                  {isAdminMode && (
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
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 bg-white dark:bg-dark-card rounded-2xl border border-dashed border-gray-200 dark:border-dark-border text-center">
          <i className="far fa-star text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 uppercase">Sin evidencias</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 max-w-xs mx-auto">
            Prueba cambiando el mes o el filtro.
          </p>
        </div>
      )}

      <GaleriaModal open={galeriaOpen} onClose={() => setGaleriaOpen(false)} />
    </div>
  );
}
