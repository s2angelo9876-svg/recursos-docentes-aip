/**
 * Skeleton — placeholders con shimmer para estados de carga.
 *
 * Variantes:
 *  - <Skeleton />                 → bloque rectangular animado
 *  - <SkeletonText lines={3} />   → varias líneas de texto
 *  - <SkeletonCard />            → card con header, título, descripción y footer
 *  - <SkeletonStats count={4} /> → grid de stats cards
 *  - <SkeletonGrid items={6} />  → grid de cards
 *
 * Usa la animación .skeleton definida en index.css (background gradient
 * que se desliza). Compatible con dark mode automáticamente.
 */

export function Skeleton({ className = "", style }) {
  return <div className={`skeleton rounded-md ${className}`} style={style} />;
}

export function SkeletonText({ lines = 3, className = "" }) {
  // Variamos el ancho de cada línea para un look más orgánico
  const widths = ["w-full", "w-11/12", "w-4/5", "w-3/4", "w-2/3"];
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border p-5 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-32 w-full mb-4 rounded-xl" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-cardLg border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-2.5 w-2/3" />
              <Skeleton className="h-7 w-1/2" />
            </div>
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ items = 6, columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <div className={`grid ${columns} gap-5`}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border p-5 flex items-center gap-4"
        >
          <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonFilterBar() {
  return (
    <div className="rounded-cardLg border border-line dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-5 space-y-4">
      <Skeleton className="h-11 w-full rounded-btn" />
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
    </div>
  );
}
