import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const COMMAND_EVENT = "innova:command";

// Dispara la paleta de comandos desde cualquier parte
export function openCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COMMAND_EVENT));
}

function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function highlight(text, query) {
  if (!query) return text;
  const safe = String(text);
  const n = norm(query);
  const lower = norm(safe);
  const idx = lower.indexOf(n);
  if (idx === -1) return safe;
  return (
    <>
      {safe.slice(0, idx)}
      <mark className="bg-primary-100 dark:bg-primary-600/25 text-primary-700 dark:text-primary-200 rounded-sm px-0.5">
        {safe.slice(idx, idx + query.length)}
      </mark>
      {safe.slice(idx + query.length)}
    </>
  );
}

function buildItems({ recursos, tutoriales, noticias, evidencias }) {
  const items = [];

  recursos?.forEach((r) => items.push({
    id: `r-${r.id}`,
    kind: "Recurso",
    icon: "fa-book-open",
    iconCls: "bg-primary-50 text-primary-600 dark:bg-primary-600/15 dark:text-primary-300",
    title: r.titulo,
    sub: `${r.area} · ${r.tipo}`,
    target: "recursos",
    payload: r,
  }));

  tutoriales?.forEach((t) => items.push({
    id: `t-${t.id}`,
    kind: "Tutorial",
    icon: "fa-circle-play",
    iconCls: "bg-accent-50 text-accent-600 dark:bg-accent-700/15 dark:text-accent-300",
    title: t.titulo,
    sub: `${t.area}${t.audiencia && t.audiencia !== "ambos" ? ` · ${t.audiencia}` : ""}`,
    target: "tutoriales",
    payload: t,
  }));

  evidencias?.forEach((e) => items.push({
    id: `e-${e.id}`,
    kind: "Evidencia",
    icon: "fa-image",
    iconCls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-600/15 dark:text-emerald-300",
    title: e.titulo,
    sub: `${e.mes}${e.categoria ? ` · ${e.categoria}` : ""}`,
    target: "evidencias",
    payload: e,
  }));

  noticias?.forEach((n) => items.push({
    id: `n-${n.id}`,
    kind: "Comunicado",
    icon: "fa-bullhorn",
    iconCls: "bg-violet-50 text-violet-600 dark:bg-violet-600/15 dark:text-violet-300",
    title: n.titulo,
    sub: `${n.autor || "AIP"}${n.fecha ? ` · ${n.fecha}` : ""}`,
    target: "noticias",
    payload: n,
  }));

  // Comandos de navegación estática
  items.push(
    { id: "nav-inicio",    kind: "Ir a", icon: "fa-house",         iconCls: "bg-slate-50 text-slate-700 dark:bg-slate-600/15 dark:text-slate-300", title: "Inicio",                  sub: "Portada principal",        target: "portada",  payload: null },
    { id: "nav-recursos",  kind: "Ir a", icon: "fa-book-open",     iconCls: "bg-primary-50 text-primary-600 dark:bg-primary-600/15 dark:text-primary-300", title: "Recursos",                sub: "Biblioteca pedagógica",   target: "recursos",  payload: null },
    { id: "nav-tutoriales",kind: "Ir a", icon: "fa-circle-play",   iconCls: "bg-accent-50 text-accent-600 dark:bg-accent-700/15 dark:text-accent-300", title: "Tutoriales",              sub: "Capacitaciones TIC",      target: "tutoriales",payload: null },
    { id: "nav-evidencias",kind: "Ir a", icon: "fa-images",        iconCls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-600/15 dark:text-emerald-300", title: "Evidencias",              sub: "Galería institucional",   target: "evidencias",payload: null },
    { id: "nav-noticias",  kind: "Ir a", icon: "fa-bullhorn",      iconCls: "bg-violet-50 text-violet-600 dark:bg-violet-600/15 dark:text-violet-300", title: "Noticias",                sub: "Comunicados oficiales",   target: "noticias",  payload: null },
    { id: "nav-login",     kind: "Ir a", icon: "fa-arrow-right-to-bracket", iconCls: "bg-slate-50 text-slate-700 dark:bg-slate-600/15 dark:text-slate-300", title: "Iniciar sesión",          sub: "Acceso al panel",         target: "login",     payload: null },
  );

  return items;
}

function searchItems(items, query) {
  if (!query) return items.slice(0, 12);
  const q = norm(query);
  const scored = [];
  for (const it of items) {
    const titleScore = norm(it.title).includes(q) ? 0 : 1;
    const subScore = norm(it.sub).includes(q) ? 0 : 1;
    if (titleScore === 1 && subScore === 1) continue;
    // título pesa más que sub
    const score = (titleScore === 0 ? 0 : 1) + (subScore === 0 ? 0.5 : 1);
    scored.push({ it, score });
  }
  return scored.sort((a, b) => a.score - b.score).map((x) => x.it).slice(0, 20);
}

export function CommandPalette() {
  const { recursos, tutoriales, noticias, evidencias } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const items = useMemo(
    () => buildItems({ recursos, tutoriales, noticias, evidencias }),
    [recursos, tutoriales, noticias, evidencias]
  );

  const filtered = useMemo(() => searchItems(items, query), [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, []);

  const select = useCallback(
    (it) => {
      if (!it) return;
      // Disparamos un evento con el target y payload para que App.jsx navegue
      window.dispatchEvent(
        new CustomEvent("innova:navigate", {
          detail: { target: it.target, payload: it.payload },
        })
      );
      close();
    },
    [close]
  );

  useEffect(() => {
    const onKey = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    };
    const onOpen = () => {
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_EVENT, onOpen);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) {
      setActiveIdx(0);
      // pequeño delay para que el input ya esté montado
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Atajos de teclado para navegar con flechas + enter
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        select(filtered[activeIdx]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, activeIdx, select]);

  // Scroll el item activo a la vista
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="cmdk-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[500] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
      >
        <motion.div
          key="cmdk-panel"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border shadow-card-hover overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 h-14 border-b border-line dark:border-dark-border">
            <i className="fas fa-magnifying-glass text-ink-meta text-sm" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none text-[15px] text-ink dark:text-white placeholder:text-ink-meta"
              placeholder="Buscar recursos, tutoriales, evidencias..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar en toda la plataforma"
            />
            <kbd className="hidden sm:inline-flex h-6 px-1.5 items-center rounded-md border border-line dark:border-dark-border bg-surface-alt dark:bg-dark-elev text-[10px] font-semibold text-ink-subtle">
              Esc
            </kbd>
          </div>

          <div
            ref={listRef}
            className="max-h-[50vh] overflow-y-auto py-2"
            role="listbox"
          >
            {filtered.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <i className="fas fa-folder-open text-3xl text-ink-meta mb-3" />
                <p className="text-[14px] font-semibold text-ink dark:text-white">
                  Sin resultados para &ldquo;{query}&rdquo;
                </p>
                <p className="mt-1 text-[12px] text-ink-subtle">
                  Prueba con otro término o navega por las secciones.
                </p>
              </div>
            ) : (
              filtered.map((it, idx) => {
                const active = idx === activeIdx;
                return (
                  <button
                    key={it.id}
                    type="button"
                    data-idx={idx}
                    onClick={() => select(it)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full text-left px-3 py-2 mx-1 rounded-lg flex items-center gap-3 transition-colors ${
                      active
                        ? "bg-primary-50 dark:bg-primary-600/15"
                        : "hover:bg-surface-alt dark:hover:bg-dark-elev"
                    }`}
                    role="option"
                    aria-selected={active}
                  >
                    <span
                      className={`flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg ${it.iconCls}`}
                    >
                      <i className={`fas ${it.icon} text-sm`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-ink dark:text-white truncate">
                        {highlight(it.title, query)}
                      </p>
                      <p className="text-[11.5px] text-ink-subtle truncate">
                        {highlight(it.sub, query)}
                      </p>
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-alt dark:bg-dark-elev text-ink-subtle uppercase tracking-wider">
                      {it.kind}
                    </span>
                    {active && (
                      <i className="fas fa-arrow-right text-[10px] text-primary-600 dark:text-primary-300" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-4 h-10 border-t border-line dark:border-dark-border bg-surface-alt/50 dark:bg-dark-elev/30 text-[10.5px] text-ink-subtle">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <kbd className="h-5 px-1 rounded border border-line dark:border-dark-border bg-white dark:bg-dark-card font-semibold">↑</kbd>
                <kbd className="h-5 px-1 rounded border border-line dark:border-dark-border bg-white dark:bg-dark-card font-semibold">↓</kbd>
                navegar
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="h-5 px-1.5 rounded border border-line dark:border-dark-border bg-white dark:bg-dark-card font-semibold">↵</kbd>
                seleccionar
              </span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <kbd className="h-5 px-1.5 rounded border border-line dark:border-dark-border bg-white dark:bg-dark-card font-semibold">esc</kbd>
                cerrar
              </span>
            </div>
            <span className="inline-flex items-center gap-1">
              <kbd className="h-5 px-1.5 rounded border border-line dark:border-dark-border bg-white dark:bg-dark-card font-semibold">Ctrl</kbd>
              <kbd className="h-5 px-1 rounded border border-line dark:border-dark-border bg-white dark:bg-dark-card font-semibold">K</kbd>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
