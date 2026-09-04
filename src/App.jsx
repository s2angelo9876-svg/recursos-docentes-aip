import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppContextProvider, useApp } from "./context/AppContext";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Repositorio from "./components/Repositorio";
import Tutoriales from "./components/Tutoriales";
import Noticias from "./components/Noticias";
import Evidencias from "./components/Evidencias";
import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";
import AdminModal from "./components/AdminModal";
import ConfirmModal from "./components/ConfirmModal";
import { ToastProvider } from "./components/Toast";

function SectionHeader({ icon, iconColor, title, onAdd }) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-dark-border">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center`}>
          <i className={`${icon} text-[14px]`}></i>
        </div>
        <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white">{title}</h2>
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary dark:bg-dark-accent hover:bg-blue-800 dark:hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
        >
          <i className="fas fa-plus-circle text-[11px]"></i> Nuevo
        </button>
      )}
    </div>
  );
}

function AppContent() {
  const { currentUser, deleteTutorial, deleteEvidencia } = useApp();
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

  const setActiveTab = (tabKey) => {
    if (tabKey === "portada") navigate("/");
    else navigate(`/${tabKey}`);
  };

  // ── CMS Modal state (shared across all views) ──────────
  const [cmsModal, setCmsModal] = useState({ open: false, type: "recursos", item: null });

  // ── Confirm-delete modal state (reemplaza window.confirm) ──
  const [pendingDelete, setPendingDelete] = useState(null);

  const openCmsAdd = (type) => setCmsModal({ open: true, type, item: null });
  const openCmsEdit = (type, item) => setCmsModal({ open: true, type, item });
  const closeCms = () => setCmsModal({ open: false, type: "recursos", item: null });

  const closeDelete = () => setPendingDelete(null);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "evidencia") {
      await deleteEvidencia(pendingDelete.id);
    } else if (pendingDelete.kind === "tutorial") {
      await deleteTutorial(pendingDelete.id);
    }
    setPendingDelete(null);
  };

  return (
    <div className="min-h-screen bg-surface-alt dark:bg-dark-bg text-ink dark:text-white antialiased flex flex-col justify-between transition-colors duration-300">

      {/* Navigation Header */}
      <Header activeTab={tab} setActiveTab={setActiveTab} />

      {/* Admin / Docente edit banner */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-1.5 px-4 text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <i className="fas fa-shield-alt animate-pulse"></i>
          MODO ADMINISTRADOR ACTIVO — Puedes editar cualquier contenido directamente
          <i className="fas fa-shield-alt animate-pulse"></i>
        </div>
      )}
      {isDocente && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-1.5 px-4 text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <i className="fas fa-pen animate-pulse"></i>
          MODO EDICIÓN DOCENTE — Puedes gestionar recursos y tutoriales
          <i className="fas fa-pen animate-pulse"></i>
        </div>
      )}

      {/* Dynamic Content Main area */}
      <main id="main-content" className="max-w-6xl w-full mx-auto px-4 py-8 flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <motion.div key="portada" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                <Hero setActiveTab={setActiveTab} />
              </motion.div>
            } />
            <Route path="/portada" element={<Navigate to="/" replace />} />

            <Route path="/login" element={
              currentUser ? <Navigate to="/" replace /> : (
                <motion.div key="login" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                  <Login onLoginSuccess={() => navigate("/")} />
                </motion.div>
              )
            } />

            <Route path="/recursos" element={
              !currentUser ? (
                <motion.div key="recursos-login" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                  <Login onLoginSuccess={() => navigate("/recursos")} />
                </motion.div>
              ) : (
                <motion.div key="recursos" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-6 text-left">
                  <SectionHeader
                    icon="fas fa-book"
                    iconColor="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    title="Recursos Pedagógicos"
                  />
                  <Repositorio isAdminMode={false} />
                </motion.div>
              )
            } />

            <Route path="/evidencias" element={
              <motion.div key="evidencias" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-6 text-left">
                <SectionHeader
                  icon="fas fa-images"
                  iconColor="bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                  title="Evidencias por Mes"
                  onAdd={isAdmin || isDocente ? () => openCmsAdd("evidencias") : null}
                />
                <Evidencias
                  isAdminMode={isAdmin || isDocente}
                  onEditClick={(item) => openCmsEdit("evidencias", item)}
                  onDeleteClick={(item) => setPendingDelete({ kind: "evidencia", id: item.id, titulo: item.titulo })}
                />
              </motion.div>
            } />

            <Route path="/tutoriales" element={
              <motion.div key="tutoriales" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-6 text-left">
                <SectionHeader
                  icon="fab fa-youtube"
                  iconColor="bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                  title="Tutoriales TIC"
                  onAdd={isAdmin ? () => openCmsAdd("tutoriales") : null}
                />
                <Tutoriales
                  isAdminMode={isAdmin}
                  onEditClick={(item) => openCmsEdit("tutoriales", item)}
                  onDeleteClick={(item) => setPendingDelete({ kind: "tutorial", id: item.id, titulo: item.titulo })}
                />
              </motion.div>
            } />

            <Route path="/proyectos" element={<Navigate to="/tutoriales" replace />} />

            <Route path="/noticias" element={
              <motion.div key="noticias" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-6 text-left">
                <SectionHeader
                  icon="fas fa-bullhorn"
                  iconColor="bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                  title="Comunicados y Talleres TIC"
                  onAdd={isAdmin ? () => openCmsAdd("noticias") : null}
                />
                <Noticias
                  isAdminMode={isAdmin}
                  onEditClick={(item) => openCmsEdit("noticias", item)}
                />
              </motion.div>
            } />

            <Route path="/admin" element={
              <motion.div key="admin" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                {currentUser ? (
                  currentUser.rol === "Administrador" ? (
                    <AdminPanel />
                  ) : (
                    <Navigate to="/" replace />
                  )
                ) : (
                  <Login onLoginSuccess={() => navigate("/admin")} />
                )}
              </motion.div>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* CMS Modal — shared across all views */}
      <AdminModal
        isOpen={cmsModal.open}
        onClose={closeCms}
        type={cmsModal.type}
        editingItem={cmsModal.item}
      />

      {/* Footer */}
      <footer className="bg-[#001D52] dark:bg-black text-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/Img logo AIP.jpeg"
                alt="Logo I.E. Bandera del Perú"
                className="h-10 w-10 rounded-xl bg-white/10 p-1 object-cover ring-1 ring-white/15"
              />
              <div className="leading-none">
                <p className="text-[14px] font-semibold tracking-tight">Innova Bandera</p>
                <p className="text-[11px] text-blue-200/70 mt-1">
                  I.E. Emblemática Bandera del Perú · Pisco, Ica
                </p>
              </div>
            </div>

            <nav aria-label="Enlaces del pie" className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <button onClick={() => setActiveTab("portada")} className="text-[13px] text-white/80 hover:text-white transition-colors">
                Inicio
              </button>
              <button onClick={() => setActiveTab("recursos")} className="text-[13px] text-white/80 hover:text-white transition-colors">
                Recursos
              </button>
              <button onClick={() => setActiveTab("evidencias")} className="text-[13px] text-white/80 hover:text-white transition-colors">
                Evidencias
              </button>
              <button onClick={() => setActiveTab("noticias")} className="text-[13px] text-white/80 hover:text-white transition-colors">
                Noticias
              </button>
              <a
                href="mailto:contacto@banderadelperu.edu.pe"
                className="text-[13px] text-white/80 hover:text-white transition-colors"
              >
                Contacto
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="#"
                aria-label="Facebook"
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <i className="fab fa-facebook-f text-xs" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-accent-500 flex items-center justify-center transition-colors"
              >
                <i className="fab fa-youtube text-xs" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-pink-500 flex items-center justify-center transition-colors"
              >
                <i className="fab fa-instagram text-xs" />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-blue-200/60">
            <p>
              © {new Date().getFullYear()} Aula de Innovación Pedagógica · Prof. Luis Fajardo. Todos los derechos reservados.
            </p>
            <p className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-soft-pulse" />
              Plataforma operativa · {new Date().toLocaleDateString("es-PE", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </footer>

      <ConfirmModal
        open={!!pendingDelete}
        title={
          pendingDelete?.kind === "evidencia"
            ? "Eliminar evidencia"
            : pendingDelete?.kind === "tutorial"
              ? "Eliminar tutorial"
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
        onConfirm={confirmDelete}
        onClose={closeDelete}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContextProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AppContextProvider>
    </Router>
  );
}