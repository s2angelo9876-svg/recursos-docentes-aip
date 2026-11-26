import { useState, useEffect, lazy, Suspense, Component } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AppContextProvider, useApp } from "./context/AppContext";
import Header from "./components/Header";
import Hero from "./components/Hero";
import { ToastProvider } from "./components/Toast";
import ConfirmModal from "./components/ConfirmModal";

const Repositorio = lazy(() => import("./components/Repositorio"));
const Tutoriales = lazy(() => import("./components/Tutoriales"));
const Noticias = lazy(() => import("./components/Noticias"));
const Evidencias = lazy(() => import("./components/Evidencias"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const Login = lazy(() => import("./components/Login"));
const AdminModal = lazy(() => import("./components/AdminModal"));
const CommandPalette = lazy(() => import("./components/CommandPalette"));

class RouteErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[RouteErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/15 text-red-500 mb-3">
            <i className="fas fa-triangle-exclamation text-lg" />
          </span>
          <h3 className="text-[15px] font-semibold text-ink dark:text-white">
            No se pudo cargar esta sección
          </h3>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 h-9 px-4 rounded-btn bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <i className="fas fa-arrow-rotate-left text-[10px]" /> Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const sectionDescriptions = {
  "Biblioteca pedagógica": "Explora materiales para preparar tus clases y guárdalos como favoritos.",
  "Evidencias por mes": "Consulta actividades y proyectos del Aula de Innovación Pedagógica.",
  "Tutoriales TIC": "Guías en video para docentes y estudiantes.",
  "Comunicados": "Avisos, talleres y novedades de la comunidad educativa.",
};

function SectionHeader({ title, onAdd }) {
  return (
    <header className="school-page-title">
      <div><h1>{title}</h1><p>{sectionDescriptions[title]}</p></div>
      {onAdd && <button type="button" className="school-button" onClick={onAdd}><i className="fas fa-plus" aria-hidden="true" /> Nuevo</button>}
    </header>
  );
}

function AppContent() {
  const { currentUser, deleteTutorial, deleteEvidencia, deleteRecurso, sessionReady, failedSections, isLoading, loadDatabase } = useApp();
  const isAdmin = currentUser?.rol === "Administrador";
  const isDocente = currentUser?.rol === "Docente";

  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (path) => {
    if (path === "/" || path === "/portada") return "portada";
    if (path.startsWith("/recursos")) return "recursos";
    if (path.startsWith("/evidencias")) return "evidencias";
    if (path.startsWith("/tutoriales") || path.startsWith("/proyectos")) return "tutoriales";
    if (path.startsWith("/noticias")) return "noticias";
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/login")) return "login";
    return "portada";
  };

  const tab = getTabFromPath(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  const setActiveTab = (tabKey) => {
    if (tabKey === "portada") navigate("/");
    else navigate(`/${tabKey}`);
  };

  // Listener para navegación desde el CommandPalette (Cmd+K)
  useEffect(() => {
    const onNav = (e) => {
      const target = e.detail?.target;
      if (target) setActiveTab(target);
      // scroll-to-top en cada navegación del command palette
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("innova:navigate", onNav);
    return () => window.removeEventListener("innova:navigate", onNav);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── CMS Modal state (shared across all views) ──────────
  const [cmsModal, setCmsModal] = useState({ open: false, type: "recursos", item: null });

  // ── Confirm-delete modal state (reemplaza window.confirm) ──
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCmsAdd = (type) => setCmsModal({ open: true, type, item: null });
  const openCmsEdit = (type, item) => setCmsModal({ open: true, type, item });
  const closeCms = () => setCmsModal({ open: false, type: "recursos", item: null });

  const closeDelete = () => setPendingDelete(null);

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const remove = {
        evidencia: deleteEvidencia, tutorial: deleteTutorial, recurso: deleteRecurso,
      }[pendingDelete.kind];
      await remove(pendingDelete.id);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-alt dark:bg-dark-bg text-ink dark:text-white antialiased flex flex-col justify-between transition-colors duration-300">
      {/* Navigation Header */}
      <Header />

      {/* Dynamic Content Main area */}
      <main id="main-content" tabIndex={-1} key={location.pathname} className={`school-main w-full flex-grow ${tab === "admin" && isAdmin ? "school-main-admin" : ""}`}>
        {failedSections.length > 0 && tab !== "login" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line-strong bg-white p-4 text-sm text-ink dark:border-dark-border dark:bg-dark-card dark:text-white">
            <p role="status">
              {isLoading ? "Reintentando la carga…" : `No se pudieron actualizar estas secciones: ${failedSections.join(", ")}.`}
            </p>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => loadDatabase({ force: true })}
              className="min-h-10 rounded-btn bg-primary-700 px-3 font-semibold text-white hover:bg-primary-800 disabled:opacity-70"
            >
              Reintentar
            </button>
          </div>
        )}
        <RouteErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center py-24" aria-busy="true">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
            </div>
          }>
          {sessionReady ? <Routes location={location}>
            <Route path="/" element={<Hero />} />
            <Route path="/portada" element={<Navigate to="/" replace />} />

            <Route path="/login" element={
              currentUser ? <Navigate to="/" replace /> : <Login onLoginSuccess={() => navigate("/")} />
            } />

            <Route path="/recursos" element={
              !currentUser ? (
                <Login description="Ingresa a tu cuenta para consultar los materiales de la biblioteca." onLoginSuccess={() => navigate(location.pathname + location.search)} />
              ) : (
                <div className="space-y-6 text-left">
                  <SectionHeader
                    title="Biblioteca pedagógica"
                    onAdd={isAdmin || isDocente ? () => openCmsAdd("recursos") : null}
                  />
                  <Repositorio
                    isAdminMode={isAdmin || isDocente}
                    onEditClick={(item) => openCmsEdit("recursos", item)}
                    onDeleteClick={(item) => setPendingDelete({ kind: "recurso", id: item.id, titulo: item.titulo })}
                  />
                </div>
              )
            } />

            <Route path="/evidencias" element={
              <div className="space-y-6 text-left">
                <SectionHeader
                  title="Evidencias por mes"
                  onAdd={isAdmin || isDocente ? () => openCmsAdd("evidencias") : null}
                />
                <Evidencias
                  isAdminMode={isAdmin || isDocente}
                  onEditClick={(item) => openCmsEdit("evidencias", item)}
                  onDeleteClick={(item) => setPendingDelete({ kind: "evidencia", id: item.id, titulo: item.titulo })}
                />
              </div>
            } />

            <Route path="/tutoriales" element={
              <div className="space-y-6 text-left">
                <SectionHeader
                  title="Tutoriales TIC"
                  onAdd={isAdmin || isDocente ? () => openCmsAdd("tutoriales") : null}
                />
                <Tutoriales
                  isAdminMode={isAdmin || isDocente}
                  onEditClick={(item) => openCmsEdit("tutoriales", item)}
                  onDeleteClick={(item) => setPendingDelete({ kind: "tutorial", id: item.id, titulo: item.titulo })}
                />
              </div>
            } />

            <Route path="/proyectos" element={<Navigate to="/tutoriales" replace />} />

            <Route path="/noticias" element={
              <div className="space-y-6 text-left">
                <SectionHeader
                  title="Comunicados"
                  onAdd={isAdmin ? () => openCmsAdd("noticias") : null}
                />
                <Noticias
                  isAdminMode={isAdmin}
                  onEditClick={(item) => openCmsEdit("noticias", item)}
                />
              </div>
            } />

            <Route path="/admin" element={
              currentUser ? (
                currentUser.rol === "Administrador" ? <AdminPanel /> : <Navigate to="/" replace />
              ) : (
                <Login description="Ingresa con una cuenta de administración." onLoginSuccess={() => navigate(location.pathname + location.search)} />
              )
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes> : <p role="status" className="p-6 text-ink-subtle">Comprobando sesión…</p>}
          </Suspense>
        </RouteErrorBoundary>
      </main>

      {/* CMS Modal — shared across all views */}
      <AdminModal
        isOpen={cmsModal.open}
        onClose={closeCms}
        type={cmsModal.type}
        editingItem={cmsModal.item}
      />

      {/* Footer */}
      {(tab !== "admin" || !isAdmin) && <footer className="school-footer text-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center flex-shrink-0">
                <img
                  src="/escudo-bandera.webp"
                  alt="Escudo I.E. Bandera del Perú"
                  width="44"
                  height="44"
                  loading="lazy"
                  decoding="async"
                  className="h-10 sm:h-11 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                />
              </div>
              <div className="leading-none">
                <p className="text-[14px] font-semibold tracking-tight">Innova Bandera</p>
                <p className="school-footer-note mt-1">
                  I.E. Emblemática Bandera del Perú · Pisco, Ica
                </p>
              </div>
            </div>

            <nav aria-label="Enlaces del pie" className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link to="/" className="school-footer-link">Inicio</Link>
              <Link to="/recursos" className="school-footer-link">Biblioteca</Link>
              <Link to="/tutoriales" className="school-footer-link">Tutoriales</Link>
              <Link to="/evidencias" className="school-footer-link">Evidencias</Link>
              <Link to="/noticias" className="school-footer-link">Comunicados</Link>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="https://www.youtube.com/@AIP.L.Fajardo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Canal oficial de YouTube AIP"
                title="Canal de YouTube @AIP.L.Fajardo"
                className="school-footer-social"
              >
                <i className="fab fa-youtube text-sm" />
              </a>
            </div>
          </div>

          <p className="school-footer-note mt-8 pt-6 border-t border-white/20">
            © {new Date().getFullYear()} Aula de Innovación Pedagógica · Prof. Luis Fajardo. Todos los derechos reservados.
          </p>
        </div>
      </footer>}

      <CommandPalette />

      <ConfirmModal
        open={!!pendingDelete}
        title={
          pendingDelete?.kind === "evidencia"
            ? "Eliminar evidencia"
            : pendingDelete?.kind === "tutorial"
              ? "Eliminar tutorial"
              : pendingDelete?.kind === "recurso"
                ? "Eliminar recurso"
                : "Confirmar eliminación"
        }
        message={
          pendingDelete?.titulo
            ? `¿Seguro que deseas eliminar "${pendingDelete.titulo}"? Esta acción no se puede deshacer.`
            : "¿Seguro que deseas eliminar este elemento? Esta acción no se puede deshacer."
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={closeDelete}
      />
    </div>
  );
}

export default function App() {
  return (
    <RouteErrorBoundary>
      <Router>
        <AppContextProvider>
          <ToastProvider>
            <MotionConfig reducedMotion="user">
              <AppContent />
            </MotionConfig>
          </ToastProvider>
        </AppContextProvider>
      </Router>
    </RouteErrorBoundary>
  );
}
