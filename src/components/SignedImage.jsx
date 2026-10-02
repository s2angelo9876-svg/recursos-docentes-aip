import { useEffect, useState } from "react";
import { resolveImageUrl } from "../services/imageUrl";

/**
 * <SignedImage> reemplaza <img> para imágenes que viven en Supabase Storage.
 * Resuelve la URL a una versión firmada (con cache en sessionStorage).
 * Mientras resuelve, no renderiza nada (evita el warning de React por src="").
 *
 * Props: hereda todas las de <img> + `src` que puede ser URL pública de Supabase.
 */
export default function SignedImage({ src, alt, onClick, className, decoding, draggable, ...rest }) {
  const isStorage = src?.includes("/storage/v1/object/");
  const [resolved, setResolved] = useState(isStorage ? null : src);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setResolved(null);
      return;
    }
    if (!isStorage) {
      setResolved(src);
      return;
    }
    resolveImageUrl(src)
      .then((url) => {
        if (!cancelled) {
          setResolved(url);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setResolved(src); // fallback a la URL original
        }
      });
    return () => {
      cancelled = true;
    };
  }, [src, isStorage]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-dark-bg text-gray-400 text-[10px] ${className || ""}`}
        title="No se pudo cargar la imagen"
      >
        <i className="fas fa-image" />
      </div>
    );
  }

  // Si es una imagen de Storage que aún no resolvió, no renderizamos nada
  // para evitar el warning "An empty string was passed to src".
  if (!resolved) return null;

  return (
    <img
      src={resolved}
      alt={alt || ""}
      className={className}
      decoding={decoding}
      draggable={draggable}
      onClick={onClick}
      onError={() => setError(true)}
      {...rest}
    />
  );
}