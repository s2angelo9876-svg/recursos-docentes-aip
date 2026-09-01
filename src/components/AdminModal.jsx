import { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { API_BASE } from "../utils/api.js";
import { getYouTubeId, getYouTubeThumbnail, isValidYouTubeUrl } from "../utils/youtube";
import { listDriveImages } from "../services/googleDrive";

const AREAS_CNEB = [
  "Matemática", "Comunicación", "Inglés", "Arte y Cultura",
  "Ciencias Sociales", "DPCC", "Educación Física", "Educación Religiosa",
  "Ciencia y Tecnología", "Educación para el Trabajo"
];
// Solo para tutoriales: incluye la opción transversal "Todas las áreas"
const AREAS_TUTORIAL = [...AREAS_CNEB, "Todas las áreas"];
const GRADOS = ["1.° Sec", "2.° Sec", "3.° Sec", "4.° Sec", "5.° Sec"];
const TIPOS_RECURSO = ["Video", "Web / App", "PDF", "Simulación", "Juego", "Colección"];
const MESES = ["Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const CATEGORIAS_EVIDENCIA = ["Gestión", "Robótica", "Taller", "Feria", "Concurso", "Capacitación", "Proyecto", "Celebración", "Otro"];
const TIPOS_EVIDENCIA = ["Foto", "Video", "Ambos"];

// Tope de archivos permitidos en una colección de evidencias
const MAX_EVIDENCE_FILES = 30;

// Fusiona archivos nuevos con los existentes, descartando duplicados (mismo nombre + tamaño)
// y respetando el tope máximo. Devuelve { next, dropped, capped } para que la UI pueda avisar.
const mergeEvidenceFiles = (prev, incoming) => {
  if (!incoming || incoming.length === 0) {
    return { next: prev, dropped: [], capped: 0 };
  }
  const seen = new Set(prev.map((f) => `${f.name}::${f.size}::${f.lastModified || 0}`));
  const dropped = [];
  const accepted = [];
  for (const f of incoming) {
    const key = `${f.name}::${f.size}::${f.lastModified || 0}`;
    if (seen.has(key)) {
      dropped.push(f.name);
      continue;
    }
    if (prev.length + accepted.length >= MAX_EVIDENCE_FILES) {
      dropped.push(f.name);
      continue;
    }
    seen.add(key);
    accepted.push(f);
  }
  const capped = Math.max(0, prev.length + accepted.length - MAX_EVIDENCE_FILES);
  return { next: [...prev, ...accepted], dropped, capped };
};

/**
 * AdminModal — Modal CMS reutilizable para agregar/editar recursos, tutoriales y noticias.
 * Props:
 *   isOpen        {boolean}
 *   onClose       {function}
 *   type          {"recursos" | "tutoriales" | "noticias"}
 *   editingItem   {object | null}  — null para agregar
 */
export default function AdminModal({ isOpen, onClose, type, editingItem }) {
  const {
    addRecurso, updateRecurso,
    addTutorial, updateTutorial,
    addNoticia, updateNoticia,
    addEvidencia, updateEvidencia,
    token, logout
  } = useApp();

  // ── Recursos ─────────────────────────────────────────────
  const [recTitulo, setRecTitulo] = useState("");
  const [recArea, setRecArea] = useState(AREAS_CNEB[0]);
  const [recGrados, setRecGrados] = useState([]);
  const [recTipo, setRecTipo] = useState(TIPOS_RECURSO[0]);
  const [recDesc, setRecDesc] = useState("");
  const [recContenidos, setRecContenidos] = useState([]);
  const [isCollection, setIsCollection] = useState(false);
  const [singleSourceType, setSingleSourceType] = useState("url");
  const [singleUrl, setSingleUrl] = useState("");
  const [singleFile, setSingleFile] = useState(null);

  // Mini-form para material en colección
  const [newMatTitulo, setNewMatTitulo] = useState("");
  const [newMatTipo, setNewMatTipo] = useState("url");
  const [newMatUrl, setNewMatUrl] = useState("");
  const [newMatFile, setNewMatFile] = useState(null);
  const [uploadProgressMsg, setUploadProgressMsg] = useState("");
  const [loadingFile, setLoadingFile] = useState(false);

  // ── Tutoriales ────────────────────────────────
  const [tutTitulo, setTutTitulo] = useState("");
  const [tutArea, setTutArea] = useState(AREAS_CNEB[0]);
  const [tutDesc, setTutDesc] = useState("");
  const [tutUrl, setTutUrl] = useState("");
  const [tutAudiencia, setTutAudiencia] = useState("ambos");

  // ── Noticias ──────────────────────────────────────────────
  const [notTitulo, setNotTitulo] = useState("");
  const [notDesc, setNotDesc] = useState("");
  const [notAutor, setNotAutor] = useState("");

  // ── Evidencias ────────────────────────────────────────────
  const [eviTitulo, setEviTitulo] = useState("");
  const [eviMes, setEviMes] = useState(MESES[0]);
  const [eviCategoria, setEviCategoria] = useState(CATEGORIAS_EVIDENCIA[0]);
  const [eviTipo, setEviTipo] = useState(TIPOS_EVIDENCIA[0]);
  const [eviDesc, setEviDesc] = useState("");
  const [eviSourceType, setEviSourceType] = useState("url");
  const [eviUrl, setEviUrl] = useState("");
  const [eviFile, setEviFile] = useState(null);
  const [eviFiles, setEviFiles] = useState([]);
  const [eviCollectionMode, setEviCollectionMode] = useState(false);
  const [eviExistingImagenes, setEviExistingImagenes] = useState([]);
  const [eviDriveUrl, setEviDriveUrl] = useState("");
  const [eviDriveCover, setEviDriveCover] = useState(null);
  const [eviDriveCoverLoading, setEviDriveCoverLoading] = useState(false);

  // ── Form-level error banner ───────────────────────────────
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // ── Object URLs para preview de los archivos de colección ──
  // Pre-computamos aquí (no en render) y revocamos al desmontar o cuando cambian.
  const eviFilePreviews = useMemo(() => {
    return eviFiles.map((f) => URL.createObjectURL(f));
  }, [eviFiles]);
  useEffect(() => {
    return () => {
      for (const u of eviFilePreviews) URL.revokeObjectURL(u);
    };
  }, [eviFilePreviews]);

  useEffect(() => {
    if (isOpen) {
      setFormError("");
      setFormSubmitting(false);
    }
  }, [isOpen, editingItem]);

  // ── Drive cover preview: cuando el usuario pega una URL de Drive ──
  useEffect(() => {
    if (eviSourceType !== "drive" || !eviDriveUrl || !eviDriveUrl.includes("/folders/")) {
      setEviDriveCover(null);
      return;
    }
    let cancelled = false;
    setEviDriveCoverLoading(true);
    listDriveImages({ folderId: eviDriveUrl })
      .then((list) => {
        if (cancelled) return;
        setEviDriveCover(list[0]?.url || null);
      })
      .catch(() => {
        if (cancelled) return;
        setEviDriveCover(null);
      })
      .finally(() => {
        if (cancelled) return;
        setEviDriveCoverLoading(false);
      });
    return () => { cancelled = true; };
  }, [eviDriveUrl, eviSourceType]);

  // ── Populate form when editing ────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      if (type === "recursos") {
        setRecTitulo(editingItem.titulo || "");
        setRecArea(editingItem.area || AREAS_CNEB[0]);
        setRecGrados(editingItem.grados || []);
        setRecTipo(editingItem.tipo || TIPOS_RECURSO[0]);
        setRecDesc(editingItem.desc || "");
        setRecContenidos(editingItem.contenidos || []);
        const isColl = editingItem.tipo === "Colección";
        setIsCollection(isColl);
        if (!isColl) {
          const firstCont = editingItem.contenidos?.[0];
          const isFile = firstCont?.tipo === "archivo";
          setSingleSourceType(isFile ? "archivo" : "url");
          setSingleUrl(isFile ? "" : (editingItem.url || ""));
          setSingleFile(null);
        } else {
          setSingleSourceType("url");
          setSingleUrl("");
          setSingleFile(null);
        }
        setNewMatTitulo(""); setNewMatTipo("url"); setNewMatUrl(""); setNewMatFile(null);
      } else if (type === "tutoriales") {
        setTutTitulo(editingItem.titulo || "");
        setTutArea(editingItem.area || AREAS_CNEB[0]);
        setTutDesc(editingItem.desc || "");
        setTutUrl(editingItem.url || "");
        setTutAudiencia(editingItem.audiencia || "ambos");
      } else if (type === "noticias") {
        setNotTitulo(editingItem.titulo || "");
        setNotDesc(editingItem.desc || "");
        setNotAutor(editingItem.autor || "");
      } else if (type === "evidencias") {
        setEviTitulo(editingItem.titulo || "");
        setEviMes(editingItem.mes || MESES[0]);
        setEviCategoria(editingItem.categoria || CATEGORIAS_EVIDENCIA[0]);
        setEviTipo(editingItem.tipo || TIPOS_EVIDENCIA[0]);
        setEviDesc(editingItem.desc || "");
        const existingImgs = Array.isArray(editingItem.imagenes) ? editingItem.imagenes : [];
        setEviExistingImagenes(existingImgs);
        setEviDriveCover(null);
        setEviDriveCoverLoading(false);
        if (editingItem.driveFolderUrl) {
          setEviSourceType("drive");
          setEviDriveUrl(editingItem.driveFolderUrl);
          setEviCollectionMode(false);
          setEviUrl("");
          setEviFile(null);
          setEviFiles([]);
          setEviDriveCover(editingItem.url || null);
        } else if (existingImgs.length > 1) {
          setEviSourceType("archivo");
          setEviCollectionMode(true);
          setEviDriveUrl("");
          setEviUrl("");
          setEviFile(null);
          setEviFiles([]);
        } else {
          setEviSourceType("url");
          setEviCollectionMode(false);
          setEviDriveUrl("");
          setEviUrl(editingItem.url || "");
          setEviFile(null);
          setEviFiles([]);
        }
      }
    } else {
      // Reset for "add" mode
      setRecTitulo(""); setRecArea(AREAS_CNEB[0]); setRecGrados([]); setRecTipo(TIPOS_RECURSO[0]);
      setRecDesc(""); setRecContenidos([]); setIsCollection(false);
      setSingleSourceType("url"); setSingleUrl(""); setSingleFile(null);
      setNewMatTitulo(""); setNewMatTipo("url"); setNewMatUrl(""); setNewMatFile(null);
      setUploadProgressMsg(""); setLoadingFile(false);
      setTutTitulo(""); setTutArea(AREAS_CNEB[0]); setTutDesc("");
      setTutUrl(""); setTutAudiencia("ambos");
      setNotTitulo(""); setNotDesc(""); setNotAutor("");
      setEviTitulo(""); setEviMes(MESES[0]); setEviCategoria(CATEGORIAS_EVIDENCIA[0]);
      setEviTipo(TIPOS_EVIDENCIA[0]); setEviDesc("");
      setEviSourceType("url"); setEviUrl(""); setEviFile(null);
      setEviFiles([]); setEviCollectionMode(false); setEviExistingImagenes([]);
      setEviDriveUrl(""); setEviDriveCover(null); setEviDriveCoverLoading(false);
    }
  }, [isOpen, editingItem, type]);

  // ── Helpers ───────────────────────────────────────────────
  const handleGradeToggle = (grado) =>
    setRecGrados(prev => prev.includes(grado) ? prev.filter(g => g !== grado) : [...prev, grado]);

  const uploadFile = async (file) => {
    if (file.size > 100 * 1024 * 1024) {
      alert("El archivo excede el límite permitido de 100 MB.");
      return null;
    }
    try {
      setLoadingFile(true);
      setUploadProgressMsg("Subiendo archivo...");
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: formData
      });
      if (response.status === 401 || response.status === 403) {
        logout();
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        setUploadProgressMsg("Sesión inválida.");
        return null;
      }
      if (!response.ok) throw new Error("Error en la carga.");
      const resData = await response.json();
      setUploadProgressMsg("¡Archivo cargado!");
      setTimeout(() => setUploadProgressMsg(""), 2000);
      return resData.url;
    } catch (_err) {
      console.error(_err);
      alert("Fallo al subir archivo al servidor.");
      setUploadProgressMsg("Error al cargar.");
      return null;
    } finally {
      setLoadingFile(false);
    }
  };

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return [];
    const oversized = files.find(f => f.size > 100 * 1024 * 1024);
    if (oversized) {
      alert(`"${oversized.name}" excede el límite de 100 MB.`);
      return null;
    }
    try {
      setLoadingFile(true);
      setUploadProgressMsg(`Subiendo ${files.length} archivo(s)...`);
      const formData = new FormData();
      for (const f of files) formData.append("files", f);
      const response = await fetch(`${API_BASE}/api/uploads`, {
        method: "POST",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: formData
      });
      if (response.status === 401 || response.status === 403) {
        logout();
        alert("Tu sesión ha expirado.");
        return null;
      }
      if (!response.ok) throw new Error("Error en la carga múltiple.");
      const resData = await response.json();
      setUploadProgressMsg(`¡${resData.files.length} archivo(s) subido(s)!`);
      setTimeout(() => setUploadProgressMsg(""), 2000);
      return resData.files;
    } catch (_err) {
      console.error(_err);
      alert("Fallo al subir archivos al servidor.");
      setUploadProgressMsg("Error al cargar.");
      return null;
    } finally {
      setLoadingFile(false);
    }
  };

  const removeEviFile = (idx) => {
    setEviFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Maneja la selección de archivos en el modo colección: ACUMULA, descarta duplicados
  // y respeta el máximo de MAX_EVIDENCE_FILES. Resetea el input para permitir
  // volver a elegir los mismos archivos.
  const handleEviCollectionPick = (e) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) {
      e.target.value = "";
      return;
    }
    setEviFiles((prev) => {
      const { next, dropped, capped } = mergeEvidenceFiles(prev, incoming);
      if (dropped.length > 0) {
        const reason = capped > 0
          ? `Se omitieron ${dropped.length} archivo(s) (máx. ${MAX_EVIDENCE_FILES}).`
          : `Se omitieron ${dropped.length} archivo(s) duplicado(s).`;
        setUploadProgressMsg(reason);
        setTimeout(() => setUploadProgressMsg(""), 3500);
      } else {
        setUploadProgressMsg(`+${incoming.length} archivo(s) añadido(s)`);
        setTimeout(() => setUploadProgressMsg(""), 2000);
      }
      return next;
    });
    e.target.value = "";
  };

  // Wrapper para el input del modo individual. Resetea el input para permitir
  // re-seleccionar el mismo archivo y notifica si el usuario quiere cambiar.
  const handleEviSinglePick = (e) => {
    const file = e.target.files?.[0] || null;
    setEviFile(file);
    e.target.value = "";
  };

  const removeEviExisting = (idx) => {
    setEviExistingImagenes(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddMaterial = async () => {
    if (recContenidos.length >= 10) { alert("Máximo 10 materiales."); return; }
    if (!newMatTitulo) { alert("Escribe el nombre del material."); return; }
    let finalUrl = "";
    if (newMatTipo === "url") {
      if (!newMatUrl) { alert("Ingrese la URL."); return; }
      finalUrl = newMatUrl;
    } else {
      if (!newMatFile) { alert("Seleccione un archivo."); return; }
      const uploaded = await uploadFile(newMatFile);
      if (!uploaded) return;
      finalUrl = uploaded;
    }
    setRecContenidos(prev => [...prev, { id: Date.now(), titulo: newMatTitulo, tipo: newMatTipo, url: finalUrl, fileName: newMatTipo === "archivo" ? newMatFile.name : null }]);
    setNewMatTitulo(""); setNewMatUrl(""); setNewMatFile(null);
  };

  const handleRemoveMaterial = (id) =>
    setRecContenidos(prev => prev.filter(item => item.id !== id));

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);

    let ok = false;
    try {
      ok = await _handleSubmit();
    } catch (err) {
      console.error("Submit error:", err);
      setFormError(err?.message || "Error inesperado al guardar.");
    } finally {
      setFormSubmitting(false);
    }
    if (ok) onClose();
  };

  const _handleSubmit = async () => {
    if (type === "recursos") {
      if (!recTitulo || !recDesc) { alert("Complete los campos obligatorios."); return false; }
      let finalUrl, finalContenidos;
      if (isCollection) {
        if (recContenidos.length === 0) { alert("Añade al menos 1 material a la colección."); return false; }
        finalUrl = recContenidos[0]?.url || "#";
        finalContenidos = recContenidos;
      } else {
        if (singleSourceType === "url") {
          if (!singleUrl) { alert("Ingrese la URL del recurso."); return false; }
          finalUrl = singleUrl;
        } else {
          if (singleFile) {
            const uploaded = await uploadFile(singleFile);
            if (!uploaded) return false;
            finalUrl = uploaded;
          } else if (editingItem?.url) {
            finalUrl = editingItem.url;
          } else {
            alert("Seleccione un archivo."); return false;
          }
        }
        finalContenidos = [{ id: Date.now(), titulo: recTitulo, tipo: singleSourceType, url: finalUrl, fileName: singleSourceType === "archivo" ? (singleFile ? singleFile.name : finalUrl.split("/").pop()) : null }];
      }
      const data = { titulo: recTitulo, area: recArea, grados: recGrados.length > 0 ? recGrados : ["Cualquiera"], tipo: isCollection ? "Colección" : recTipo, desc: recDesc, url: finalUrl, contenidos: finalContenidos };
      const result = editingItem
        ? await updateRecurso(editingItem.id, data)
        : await addRecurso(data);
      if (!result?.success) { setFormError(result?.error || "No se pudo guardar el recurso."); return false; }
      return true;

    } else if (type === "tutoriales") {
      if (!tutTitulo || !tutDesc || !tutUrl) { alert("Complete los campos obligatorios."); return false; }
      if (!isValidYouTubeUrl(tutUrl)) { alert("Ingrese un enlace válido de YouTube."); return false; }
      const data = { titulo: tutTitulo, area: tutArea, desc: tutDesc, url: tutUrl, audiencia: tutAudiencia };
      const result = editingItem
        ? await updateTutorial(editingItem.id, data)
        : await addTutorial(data);
      if (!result?.success) { setFormError(result?.error || "No se pudo guardar el tutorial."); return false; }
      return true;

    } else if (type === "noticias") {
      if (!notTitulo || !notDesc || !notAutor) { alert("Complete los campos obligatorios."); return false; }
      const data = { titulo: notTitulo, desc: notDesc, autor: notAutor };
      const result = editingItem
        ? await updateNoticia(editingItem.id, { ...editingItem, ...data })
        : await addNoticia(data);
      if (!result?.success) { setFormError(result?.error || "No se pudo guardar el comunicado."); return false; }
      return true;

    } else if (type === "evidencias") {
      if (!eviTitulo || !eviDesc) { alert("Complete los campos obligatorios."); return false; }

      let data;
      if (eviSourceType === "drive") {
        if (!eviDriveUrl) { alert("Pega el link de la carpeta de Google Drive."); return false; }
        if (eviDriveCoverLoading) {
          setFormError("Espera a que cargue la vista previa de la carpeta.");
          return false;
        }
        data = {
          titulo: eviTitulo,
          mes: eviMes,
          categoria: eviCategoria,
          tipo: eviTipo,
          desc: eviDesc,
          url: eviDriveCover || null,
          imagenes: null,
          driveFolderUrl: eviDriveUrl,
        };
      } else if (eviSourceType === "url") {
        if (!eviUrl) { alert("Ingrese la URL de la evidencia."); return false; }
        data = {
          titulo: eviTitulo,
          mes: eviMes,
          categoria: eviCategoria,
          tipo: eviTipo,
          desc: eviDesc,
          url: eviUrl,
          imagenes: [{ url: eviUrl, name: "imagen", mimetype: null, size: null }],
          driveFolderUrl: null,
        };
      } else if (eviCollectionMode) {
        const nuevas = eviFiles.length > 0 ? await uploadFiles(eviFiles) : null;
        if (eviFiles.length > 0 && nuevas === null) {
          setFormError("La subida de archivos falló. Intenta de nuevo.");
          return false;
        }
        const uploaded = nuevas || [];
        const all = [...eviExistingImagenes, ...uploaded];
        if (all.length === 0) { alert("Sube al menos una foto o conserva las existentes."); return false; }
        data = {
          titulo: eviTitulo,
          mes: eviMes,
          categoria: eviCategoria,
          tipo: eviTipo,
          desc: eviDesc,
          url: all[0]?.url || "",
          imagenes: all,
          driveFolderUrl: null,
        };
      } else {
        let finalUrl;
        if (eviFile) {
          const uploaded = await uploadFile(eviFile);
          if (!uploaded) {
            setFormError("La subida del archivo falló. Intenta de nuevo.");
            return false;
          }
          finalUrl = uploaded;
        } else if (editingItem?.url) {
          finalUrl = editingItem.url;
        } else {
          alert("Seleccione un archivo."); return false;
        }
        data = {
          titulo: eviTitulo,
          mes: eviMes,
          categoria: eviCategoria,
          tipo: eviTipo,
          desc: eviDesc,
          url: finalUrl,
          imagenes: [{
            url: finalUrl,
            name: eviFile ? eviFile.name : "imagen",
            mimetype: eviFile?.type || null,
            size: eviFile?.size || null,
          }],
          driveFolderUrl: null,
        };
      }

      const result = editingItem
        ? await updateEvidencia(editingItem.id, data)
        : await addEvidencia(data);

      if (!result?.success) {
        setFormError(result?.error || "No se pudo guardar la evidencia.");
        return false;
      }
      return true;
    }
    return false;
  };

  if (!isOpen) return null;

  const typeLabel = type === "recursos" ? "Recurso" : type === "tutoriales" ? "Tutorial" : type === "evidencias" ? "Evidencia" : "Comunicado";
  const typeIcon = type === "recursos" ? "fas fa-book" : type === "tutoriales" ? "fab fa-youtube" : type === "evidencias" ? "fas fa-images" : "fas fa-bullhorn";

  const youtubePreviewId = type === "tutoriales" ? getYouTubeId(tutUrl) : null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget && !formSubmitting) onClose(); }}>
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-800 dark:from-dark-border dark:to-dark-card px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <i className={`${typeIcon} text-white text-sm`}></i>
            </div>
            <div>
              <h4 className="font-black text-white uppercase text-sm tracking-tight">
                {editingItem ? "Editar" : "Nuevo"} {typeLabel}
              </h4>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
                Panel CMS · Solo Admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={formSubmitting}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {formError && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-[11px] text-red-700 dark:text-red-400">
              <i className="fas fa-exclamation-triangle mt-0.5"></i>
              <div className="flex-1">
                <strong className="font-black">Error:</strong> {formError}
              </div>
              <button
                type="button"
                onClick={() => setFormError("")}
                className="text-red-400 hover:text-red-700 dark:hover:text-red-200"
                aria-label="Cerrar"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          {/* ── RECURSO FIELDS ──────────────────────────── */}
          {type === "recursos" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Título *</label>
                <input
                  type="text" required
                  placeholder="Ej. Colección de Álgebra y Geometría"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary dark:focus:ring-dark-accent outline-none text-gray-800 dark:text-gray-200"
                  value={recTitulo} onChange={(e) => setRecTitulo(e.target.value)}
                />
              </div>

              {/* Collection toggle */}
              <div className="flex items-center gap-2.5 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <input
                  type="checkbox" id="isCollectionModal"
                  className="w-4 h-4 accent-primary dark:accent-dark-accent"
                  checked={isCollection}
                  onChange={(e) => { setIsCollection(e.target.checked); setRecTipo(e.target.checked ? "Colección" : TIPOS_RECURSO[0]); }}
                />
                <label htmlFor="isCollectionModal" className="text-xs font-bold text-blue-800 dark:text-blue-300 cursor-pointer select-none">
                  <i className="fas fa-layer-group mr-1.5"></i>¿Es una colección de múltiples materiales?
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Área Curricular</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs outline-none text-gray-700 dark:text-gray-200" value={recArea} onChange={(e) => setRecArea(e.target.value)}>
                    {AREAS_CNEB.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Categoría</label>
                  {isCollection ? (
                    <div className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-border/30 rounded-xl text-xs text-gray-500 font-bold uppercase">Colección</div>
                  ) : (
                    <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs outline-none text-gray-700 dark:text-gray-200" value={recTipo} onChange={(e) => setRecTipo(e.target.value)}>
                      {TIPOS_RECURSO.filter(t => t !== "Colección").map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider block">Grados Dirigidos</label>
                <div className="flex flex-wrap gap-1.5">
                  {GRADOS.map(g => (
                    <button key={g} type="button" onClick={() => handleGradeToggle(g)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${recGrados.includes(g) ? "bg-primary dark:bg-dark-accent text-white border-primary" : "bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:bg-gray-50"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {isCollection ? (
                /* Collection builder */
                <div className="space-y-3 p-4 border border-dashed border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-border/20 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-black uppercase text-gray-900 dark:text-white tracking-wider">Materiales (Máx. 10)</h5>
                    <span className="text-[9px] font-bold text-gray-400">{recContenidos.length} / 10</span>
                  </div>
                  {recContenidos.length > 0 && (
                    <div className="space-y-1.5">
                      {recContenidos.map(mat => (
                        <div key={mat.id} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-dark-card border border-gray-150 dark:border-dark-border text-xs">
                          <div className="flex items-center gap-2 truncate flex-1 pr-2">
                            <i className={mat.tipo === "url" ? "fas fa-link text-blue-500" : "fas fa-file-alt text-orange-500"}></i>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{mat.titulo}</span>
                          </div>
                          <button type="button" onClick={() => handleRemoveMaterial(mat.id)} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"><i className="fas fa-times"></i></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {recContenidos.length < 10 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-dark-border space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Nombre del Material</label>
                          <input type="text" placeholder="Ej. Ficha PDF de ejercicios" className="w-full px-2 py-1.5 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-lg text-[11px] outline-none text-gray-800 dark:text-gray-200" value={newMatTitulo} onChange={(e) => setNewMatTitulo(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Tipo</label>
                          <select className="w-full px-2 py-1.5 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-lg text-[11px] outline-none text-gray-700 dark:text-gray-300" value={newMatTipo} onChange={(e) => setNewMatTipo(e.target.value)}>
                            <option value="url">Enlace</option>
                            <option value="archivo">Archivo</option>
                          </select>
                        </div>
                      </div>
                      {newMatTipo === "url" ? (
                        <input type="url" placeholder="https://ejemplo.com/recurso" className="w-full px-2 py-1.5 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-lg text-[11px] outline-none text-gray-800 dark:text-gray-200" value={newMatUrl} onChange={(e) => setNewMatUrl(e.target.value)} />
                      ) : (
                        <label className="block w-full py-2 border border-dashed border-gray-300 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl text-center cursor-pointer text-[11px] font-bold text-gray-600 dark:text-gray-300">
                          <i className="fas fa-file-upload mr-1 text-primary"></i>
                          {newMatFile ? newMatFile.name : "Examinar archivo"}
                          <input type="file" onChange={(e) => setNewMatFile(e.target.files[0])} className="hidden" />
                        </label>
                      )}
                      {uploadProgressMsg && <div className="text-[9px] text-blue-600 dark:text-blue-400 font-black animate-pulse">{uploadProgressMsg}</div>}
                      <button type="button" disabled={loadingFile} onClick={handleAddMaterial} className="w-full py-1.5 bg-gray-100 dark:bg-dark-border hover:bg-primary hover:text-white dark:hover:bg-dark-accent text-gray-700 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 disabled:opacity-50">
                        {loadingFile ? "Subiendo..." : <><i className="fas fa-plus"></i> Agregar material</>}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Single resource source */
                <div className="space-y-3 p-4 border border-dashed border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-border/20 rounded-2xl">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider block">Origen del Recurso *</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSingleSourceType("url")} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${singleSourceType === "url" ? "bg-primary dark:bg-dark-accent text-white border-primary" : "bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border"}`}>
                      <i className="fas fa-link"></i> Enlace Web
                    </button>
                    <button type="button" onClick={() => setSingleSourceType("archivo")} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${singleSourceType === "archivo" ? "bg-primary dark:bg-dark-accent text-white border-primary" : "bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border"}`}>
                      <i className="fas fa-file-upload"></i> Subir Archivo
                    </button>
                  </div>
                  {singleSourceType === "url" ? (
                    <input type="url" required placeholder="https://ejemplo.com/recurso" className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200" value={singleUrl} onChange={(e) => setSingleUrl(e.target.value)} />
                  ) : (
                    <div className="space-y-1">
                      <label className="block w-full py-3 border border-dashed border-gray-300 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl text-center cursor-pointer text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors">
                        <i className="fas fa-file-upload mr-2 text-primary dark:text-dark-accent text-lg"></i>
                        {singleFile ? singleFile.name : (editingItem?.url ? "Cambiar archivo actual" : "Examinar archivo")}
                        <input type="file" onChange={(e) => setSingleFile(e.target.files[0])} className="hidden" />
                      </label>
                      {!singleFile && editingItem?.url && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 italic font-bold text-center">✓ Archivo actual en Supabase Storage</div>
                      )}
                    </div>
                  )}
                  {uploadProgressMsg && <div className="text-[9px] text-blue-600 dark:text-blue-400 font-black animate-pulse">{uploadProgressMsg}</div>}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Descripción *</label>
                <textarea required rows={3} placeholder="Breve explicación del recurso..." className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200 resize-none" value={recDesc} onChange={(e) => setRecDesc(e.target.value)} />
              </div>
            </>
          )}

          {/* ── TUTORIAL FIELDS ──────────────────────────── */}
          {type === "tutoriales" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Título del Tutorial *</label>
                <input type="text" required placeholder="Ej. Uso de Canva en el Aula" className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200" value={tutTitulo} onChange={(e) => setTutTitulo(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Área Curricular</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs outline-none text-gray-700 dark:text-gray-200" value={tutArea} onChange={(e) => setTutArea(e.target.value)}>
                    {AREAS_TUTORIAL.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Audiencia *</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs outline-none text-gray-700 dark:text-gray-200" value={tutAudiencia} onChange={(e) => setTutAudiencia(e.target.value)}>
                    <option value="docente">Docente</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Enlace de YouTube *</label>
                <input type="url" required placeholder="https://www.youtube.com/watch?v=..." className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200" value={tutUrl} onChange={(e) => setTutUrl(e.target.value)} />
                {tutUrl && !isValidYouTubeUrl(tutUrl) && (
                  <p className="text-[10px] text-red-500 font-bold">URL de YouTube no válida.</p>
                )}
              </div>
              {youtubePreviewId && (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border">
                  <img src={getYouTubeThumbnail(youtubePreviewId)} alt="Vista previa" className="w-full h-32 object-cover" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Descripción *</label>
                <textarea required rows={3} placeholder="Describe el contenido del tutorial..." className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200 resize-none" value={tutDesc} onChange={(e) => setTutDesc(e.target.value)} />
              </div>
            </>
          )}

          {/* ── EVIDENCIA FIELDS ──────────────────────────── */}
          {type === "evidencias" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Título de la Actividad *</label>
                <input type="text" required placeholder="Ej. Feria de Ciencias 2026" className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200" value={eviTitulo} onChange={(e) => setEviTitulo(e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Mes *</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs outline-none text-gray-700 dark:text-gray-200" value={eviMes} onChange={(e) => setEviMes(e.target.value)}>
                    {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Categoría *</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs outline-none text-gray-700 dark:text-gray-200" value={eviCategoria} onChange={(e) => setEviCategoria(e.target.value)}>
                    {CATEGORIAS_EVIDENCIA.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Tipo *</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs outline-none text-gray-700 dark:text-gray-200" value={eviTipo} onChange={(e) => setEviTipo(e.target.value)}>
                    {TIPOS_EVIDENCIA.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3 p-4 border border-dashed border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-border/20 rounded-2xl">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider block">Origen de la Evidencia *</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEviSourceType("url"); setEviCollectionMode(false); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${eviSourceType === "url" ? "bg-primary dark:bg-dark-accent text-white border-primary" : "bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border"}`}>
                    <i className="fas fa-link"></i> Enlace Web
                  </button>
                  <button type="button" onClick={() => { setEviSourceType("archivo"); setEviCollectionMode(false); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${eviSourceType === "archivo" ? "bg-primary dark:bg-dark-accent text-white border-primary" : "bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border"}`}>
                    <i className="fas fa-file-upload"></i> Subir Archivo
                  </button>
                  <button type="button" onClick={() => { setEviSourceType("drive"); setEviCollectionMode(false); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${eviSourceType === "drive" ? "bg-primary dark:bg-dark-accent text-white border-primary" : "bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border"}`}>
                    <i className="fab fa-google-drive"></i> Drive
                  </button>
                </div>

                {eviSourceType === "url" ? (
                  <input type="url" required placeholder={eviTipo === "Video" ? "https://www.youtube.com/watch?v=..." : "https://ejemplo.com/foto.jpg"} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200" value={eviUrl} onChange={(e) => setEviUrl(e.target.value)} />
                ) : eviSourceType === "drive" ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full px-3 py-2 border border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 dark:text-gray-200"
                      value={eviDriveUrl}
                      onChange={(e) => setEviDriveUrl(e.target.value)}
                    />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                      <i className="fas fa-info-circle mr-1"></i>
                      Pega el link de una carpeta de Drive que tenga habilitada la opción "Cualquier persona con el enlace puede ver".
                    </p>
                    {eviDriveCoverLoading && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-[11px] text-indigo-700 dark:text-indigo-400">
                        <div className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                        <span>Cargando vista previa de la carpeta...</span>
                      </div>
                    )}
                    {!eviDriveCoverLoading && eviDriveCover && (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-900/50 bg-gray-100 dark:bg-dark-border">
                        <img
                          src={eviDriveCover}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px]">
                          <span className="flex items-center gap-1 font-black uppercase tracking-wider">
                            <i className="fab fa-google-drive"></i> Vista previa OK
                          </span>
                        </div>
                      </div>
                    )}
                    {!eviDriveCoverLoading && !eviDriveCover && eviDriveUrl && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-400">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>No se pudo cargar vista previa. Verifica que la carpeta sea pública.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEviCollectionMode(false)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${!eviCollectionMode ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40" : "bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border"}`}>
                        <i className="fas fa-image mr-1"></i> Una foto
                      </button>
                      <button type="button" onClick={() => setEviCollectionMode(true)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${eviCollectionMode ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40" : "bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border"}`}>
                        <i className="fas fa-images mr-1"></i> Colección de fotos
                      </button>
                    </div>

                    {!eviCollectionMode ? (
                      <div className="space-y-1">
                        <label className="block w-full py-3 border border-dashed border-gray-300 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl text-center cursor-pointer text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors">
                          <i className="fas fa-file-upload mr-2 text-primary dark:text-dark-accent text-lg"></i>
                          {eviFile ? eviFile.name : (editingItem?.url ? "Cambiar archivo actual" : "Examinar archivo")}
                          <input
                            type="file"
                            accept={eviTipo === "Video" ? "video/*" : eviTipo === "Ambos" ? "image/*,video/*" : "image/*"}
                            onChange={handleEviSinglePick}
                            className="hidden"
                          />
                        </label>
                        {!eviFile && editingItem?.url && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 italic font-bold text-center">✓ Archivo actual en el servidor</div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block w-full py-3 border border-dashed border-indigo-300 dark:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-xl text-center cursor-pointer text-xs font-bold text-indigo-700 dark:text-indigo-400 transition-colors">
                          <i className="fas fa-cloud-upload-alt mr-2 text-lg"></i>
                          {eviTipo === "Video"
                            ? "Selecciona uno o varios videos"
                            : eviTipo === "Ambos"
                              ? "Selecciona fotos y/o videos"
                              : "Selecciona una o varias fotos"}
                          <input
                            type="file"
                            accept={eviTipo === "Video" ? "video/*" : eviTipo === "Ambos" ? "image/*,video/*" : "image/*"}
                            multiple
                            onChange={handleEviCollectionPick}
                            className="hidden"
                          />
                        </label>

                        {eviExistingImagenes.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Actuales ({eviExistingImagenes.length})</p>
                            <div className="grid grid-cols-4 gap-2">
                              {eviExistingImagenes.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border group/preview">
                                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => removeEviExisting(i)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                    title="Quitar"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {eviFiles.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Nuevas ({eviFiles.length})</p>
                            <div className="grid grid-cols-4 gap-2">
                              {eviFiles.map((f, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-900/50 group/preview">
                                  <img src={eviFilePreviews[i]} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => removeEviFile(i)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                    title="Quitar"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate">
                                    {f.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-gray-500 dark:text-gray-400 italic text-center">
                          {eviFiles.length === 0 && eviExistingImagenes.length === 0
                            ? `Puedes agregar más fotos en varias selecciones (máx. ${MAX_EVIDENCE_FILES}, 100MB c/u)`
                            : `Total: ${eviExistingImagenes.length + eviFiles.length}/${MAX_EVIDENCE_FILES} foto(s) · puedes seguir agregando`}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {uploadProgressMsg && <div className="text-[9px] text-blue-600 dark:text-blue-400 font-black animate-pulse">{uploadProgressMsg}</div>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Descripción *</label>
                <textarea required rows={3} placeholder="Breve descripción de la actividad..." className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200 resize-none" value={eviDesc} onChange={(e) => setEviDesc(e.target.value)} />
              </div>
            </>
          )}

          {/* ── NOTICIA FIELDS ────────────────────────────── */}
          {type === "noticias" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Título del Comunicado *</label>
                <input type="text" required placeholder="Ej. Resultados de la Convocatoria" className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200" value={notTitulo} onChange={(e) => setNotTitulo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Autor / Emisor *</label>
                <input type="text" required placeholder="Ej. Coordinación Pedagógica" className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200" value={notAutor} onChange={(e) => setNotAutor(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Contenido *</label>
                <textarea required rows={4} placeholder="Texto del comunicado oficial..." className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-gray-200 resize-none" value={notDesc} onChange={(e) => setNotDesc(e.target.value)} />
              </div>
            </>
          )}

          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-150 dark:border-dark-border flex justify-end gap-2 flex-shrink-0 bg-white dark:bg-dark-card">
            <button type="button" onClick={onClose} disabled={formSubmitting} className="px-4 py-2 border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-border text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loadingFile || formSubmitting} className="px-5 py-2 bg-primary dark:bg-dark-accent hover:bg-blue-800 dark:hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
              {formSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
