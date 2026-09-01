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

  const openCmsAdd = (type) => setCmsModal({ open: true, type, item: null });
  const openCmsEdit = (type, item) => setCmsModal({ open: true, type, item });
  const closeCms = () => setCmsModal({ open: false, type: "recursos", item: null });

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-dark-bg text-gray-900 dark:text-gray-100 antialiased flex flex-col justify-between transition-colors duration-300">

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
      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-grow">
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
                  onDeleteClick={(id) => { if (window.confirm("¿Eliminar esta evidencia?")) deleteEvidencia(id); }}
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
                  onDeleteClick={(id) => { if (window.confirm("¿Eliminar este tutorial?")) deleteTutorial(id); }}
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
      <footer className="bg-[#001D52] dark:bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo + descripción */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/img/escudo.png" alt="Logo" className="w-10 h-10 rounded-xl bg-white/10 p-1" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div>
                <h4 className="font-black text-base uppercase tracking-tight">INNOVA BANDERA</h4>
                <p className="text-[10px] text-blue-200/70 font-semibold">I.E. Bandera del Perú · Pisco</p>
              </div>
            </div>
            <p className="text-xs text-blue-100/70 leading-relaxed">
              Institución educativa pública emblemática comprometida con la excelencia y la formación integral.
            </p>
          </div>

          {/* Column 2: Navegación */}
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-4">Navegación</h5>
            <ul className="space-y-2 text-xs text-blue-100/80">
              <li><button onClick={() => setActiveTab("portada")} className="hover:text-yellow-300 transition-colors">Inicio</button></li>
              <li><button onClick={() => setActiveTab("recursos")} className="hover:text-yellow-300 transition-colors">Recursos</button></li>
              <li><button onClick={() => setActiveTab("evidencias")} className="hover:text-yellow-300 transition-colors">Evidencias</button></li>
              <li><button onClick={() => setActiveTab("tutoriales")} className="hover:text-yellow-300 transition-colors">Tutoriales</button></li>
              <li><button onClick={() => setActiveTab("noticias")} className="hover:text-yellow-300 transition-colors">Noticias</button></li>
            </ul>
          </div>

          {/* Column 3: Recursos */}
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-4">Recursos</h5>
            <ul className="space-y-2 text-xs text-blue-100/80">
              <li><a href="#" className="hover:text-yellow-300 transition-colors">Biblioteca Digital</a></li>
              <li><a href="#" className="hover:text-yellow-300 transition-colors">Soporte Técnico</a></li>
              <li><a href="#" className="hover:text-yellow-300 transition-colors">Portal Académico</a></li>
              <li><a href="#" className="hover:text-yellow-300 transition-colors">Calendario Escolar</a></li>
            </ul>
          </div>

          {/* Column 4: Contacto */}
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-4">Contacto</h5>
            <ul className="space-y-2 text-xs text-blue-100/80">
              <li className="flex items-start gap-2">
                <i className="fas fa-envelope mt-0.5 text-blue-300"></i>
                <a href="mailto:contacto@banderadelperu.edu.pe" className="hover:text-yellow-300 transition-colors break-all">contacto@banderadelperu.edu.pe</a>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-map-marker-alt mt-0.5 text-blue-300"></i>
                <span>Pisco, Ica, Perú</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-phone mt-0.5 text-blue-300"></i>
                <span>Aula de Innovación Pedagógica</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-blue-200/70">
            <p className="font-semibold">© 2026 I.E. Bandera del Perú · Aula de Innovación Pedagógica · Prof. Luis Fajardo</p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Facebook" className="w-7 h-7 rounded-full bg-white/10 hover:bg-yellow-400 hover:text-[#001D52] flex items-center justify-center transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" aria-label="YouTube" className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors">
                <i className="fab fa-youtube"></i>
              </a>
              <a href="#" aria-label="Instagram" className="w-7 h-7 rounded-full bg-white/10 hover:bg-pink-500 hover:text-white flex items-center justify-center transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContextProvider>
        <AppContent />
      </AppContextProvider>
    </Router>
  );
}