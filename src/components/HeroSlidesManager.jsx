import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "../utils/api.js";
import { useApp } from "../context/AppContext";
import { dispatchToast } from "./Toast";
import ConfirmModal from "./ConfirmModal";
import SignedImage from "./SignedImage";

const MAX_SLIDES = 3;
const ACCEPTED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function SlideFormModal({ open, slide, onClose, onSaved }) {
  const { token } = useApp();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(slide?.imagenUrl || "");
  const [activo, setActivo] = useState(slide?.activo ?? true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview(slide?.imagenUrl || "");
      setActivo(slide?.activo ?? true);
      setError("");
    }
  }, [open, slide]);

  const handleFile = (f) => {
    if (!f) return;
    if (!ACCEPTED_MIMES.includes(f.type)) {
      setError("Formato no permitido. Usa JPG, PNG o WEBP.");
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("La imagen excede el límite de 100 MB.");
      return;
    }
    setError("");
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    setError("");
    if (!slide && !file) {
      setError("Selecciona una imagen para crear el slide.");
      return;
    }
    setSaving(true);
    try {
      let imagenUrl = slide?.imagenUrl;
      let imagenPath = slide?.imagenPath || "";

      if (file) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        setUploading(false);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Error al subir la imagen.");
        }
        const data = await res.json();
        imagenUrl = data.url;
        imagenPath = data.filename || "";
      }

      const url = slide
        ? `${API_BASE}/api/admin/hero-slides/${slide.id}`
        : `${API_BASE}/api/admin/hero-slides`;
      const method = slide ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imagenUrl, imagenPath, activo }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar el slide.");
      }
      dispatchToast({ tone: "success", message: slide ? "Slide actualizado." : "Slide creado." });
      onSaved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-line dark:border-dark-border">
              <h3 className="text-base font-bold text-ink dark:text-white">
                {slide ? "Editar slide" : "Nuevo slide"}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-ink-subtle hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
                aria-label="Cerrar"
              >
                <i className="fas fa-xmark text-sm" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-ink-subtle dark:text-ink-meta mb-2">
                  Imagen {slide && "(opcional cambiar)"}
                </label>
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full aspect-video rounded-xl border-2 border-dashed border-line dark:border-dark-border bg-gray-50 dark:bg-dark-bg hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {preview ? (
<SignedImage
                  src={preview}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                  ) : (
                    <div className="text-center text-ink-subtle dark:text-ink-meta">
                      <i className="fas fa-cloud-arrow-up text-2xl mb-2 block" />
                      <p className="text-[12px] font-medium">Subir imagen</p>
                      <p className="text-[10px] mt-1">JPG · PNG · WEBP</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    className="hidden"
                  />
                </div>
                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreview(slide?.imagenUrl || "");
                    }}
                    className="mt-2 text-[11px] font-semibold text-accent-600 hover:text-accent-700"
                  >
                    Quitar imagen seleccionada
                  </button>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-4 h-4 rounded border-line text-primary-600 focus:ring-primary-500"
                />
                <span className="text-[13px] text-ink dark:text-white">Slide activo (visible en el home)</span>
              </label>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-accent-50 dark:bg-accent-700/15 text-accent-700 dark:text-accent-300 text-[12px] font-medium border border-accent-200 dark:border-accent-900/40">
                  <i className="fas fa-circle-exclamation mr-1.5" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line dark:border-dark-border bg-gray-50/60 dark:bg-dark-bg/40">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-[12px] font-semibold text-ink-subtle hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || (!slide && !file)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-[10px]" />
                    Subiendo…
                  </>
                ) : saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-[10px]" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <i className="fas fa-check text-[10px]" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function HeroSlidesManager() {
  const { token, loadDatabase } = useApp();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSlides = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/hero-slides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSlides(data);
      }
    } catch (e) {
      console.error("Error al cargar slides:", e);
      dispatchToast({ tone: "error", message: "No se pudieron cargar los slides." });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const move = async (id, direction) => {
    const idx = slides.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[idx], next[target]] = [next[target], next[idx]];
    setSlides(next);
    try {
      const res = await fetch(`${API_BASE}/api/admin/hero-slides-reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orden: next.map((s) => s.id) }),
      });
      if (!res.ok) throw new Error("Error al reordenar");
      dispatchToast({ tone: "success", message: "Orden actualizado." });
    } catch (e) {
      dispatchToast({ tone: "error", message: e.message });
      fetchSlides();
    }
  };

  const toggleActivo = async (slide) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/hero-slides/${slide.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imagenUrl: slide.imagenUrl,
          imagenPath: slide.imagenPath,
          activo: !slide.activo,
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, activo: !s.activo } : s))
      );
      dispatchToast({
        tone: "success",
        message: slide.activo ? "Slide desactivado." : "Slide activado.",
      });
    } catch (e) {
      dispatchToast({ tone: "error", message: e.message });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/hero-slides/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al eliminar");
      }
      dispatchToast({ tone: "success", message: "Slide eliminado." });
      setConfirmDelete(null);
      fetchSlides();
      loadDatabase({ force: true });
    } catch (e) {
      dispatchToast({ tone: "error", message: e.message });
    } finally {
      setDeleting(false);
    }
  };

  const onSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await fetchSlides();
    loadDatabase({ force: true });
  };

  const atLimit = slides.length >= MAX_SLIDES;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary-600 dark:text-primary-300">
            Configuración del hero
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-ink dark:text-white">
            Carrusel de imágenes
          </h3>
          <p className="mt-1 text-[13px] text-ink-subtle dark:text-ink-meta">
            Sube hasta {MAX_SLIDES} imágenes para el banner principal. Se mostrarán en el home con
            rotación automática cada 5.5 s.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={atLimit}
          title={atLimit ? `Máximo ${MAX_SLIDES} slides` : "Crear nuevo slide"}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <i className="fas fa-plus text-[10px]" />
          Nuevo slide
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-video rounded-2xl bg-gray-100 dark:bg-dark-hover animate-pulse"
            />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line dark:border-dark-border p-10 text-center">
          <i className="fas fa-images text-3xl text-gray-300 dark:text-ink-meta mb-3 block" />
          <p className="text-[13px] font-semibold text-ink dark:text-white">No hay slides todavía</p>
          <p className="mt-1 text-[12px] text-ink-subtle dark:text-ink-meta">
            Mientras no subas ninguno, se mostrará la imagen por defecto del home.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className="group relative rounded-2xl overflow-hidden bg-white dark:bg-dark-card border border-line dark:border-dark-border shadow-sm hover:shadow-card-hover transition-all"
            >
              <div className="aspect-video bg-gray-100 dark:bg-dark-bg overflow-hidden">
                <SignedImage
                  src={s.imagenUrl}
                  alt={`Slide ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-600/15 text-primary-700 dark:text-primary-300 text-[11px] font-bold">
                    {s.orden}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.activo
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-600 dark:bg-dark-hover dark:text-ink-meta"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.activo ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {s.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(s.id, "up")}
                    disabled={i === 0}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-ink-subtle hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Mover arriba"
                    title="Mover arriba"
                  >
                    <i className="fas fa-arrow-up text-[10px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(s.id, "down")}
                    disabled={i === slides.length - 1}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-ink-subtle hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Mover abajo"
                    title="Mover abajo"
                  >
                    <i className="fas fa-arrow-down text-[10px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActivo(s)}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-ink-subtle hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
                    aria-label={s.activo ? "Desactivar" : "Activar"}
                    title={s.activo ? "Desactivar" : "Activar"}
                  >
                    <i className={`fas ${s.activo ? "fa-eye-slash" : "fa-eye"} text-[10px]`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(s);
                      setFormOpen(true);
                    }}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-600/15 transition-colors"
                    aria-label="Editar"
                    title="Editar"
                  >
                    <i className="fas fa-pen text-[10px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(s)}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-700/15 transition-colors"
                    aria-label="Eliminar"
                    title="Eliminar"
                  >
                    <i className="fas fa-trash text-[10px]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SlideFormModal
        open={formOpen}
        slide={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={onSaved}
      />

      <ConfirmModal
        open={Boolean(confirmDelete)}
        title="Eliminar slide"
        message={`¿Seguro que quieres eliminar el slide #${confirmDelete?.orden}? Esta acción borra también la imagen del servidor y no se puede deshacer.`}
        confirmText="Eliminar"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />

      <p className="text-[11px] text-ink-meta dark:text-ink-meta">
        <i className="fas fa-circle-info mr-1" />
        Sugerido: imágenes en formato 16:7.5 con ancho mínimo 1200 px.
      </p>
    </div>
  );
}
