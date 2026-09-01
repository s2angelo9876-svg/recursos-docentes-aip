
import { useApp } from "../context/AppContext";

export default function Header({ activeTab, setActiveTab }) {
  const { darkMode, setDarkMode, currentUser, logout } = useApp();
  const isAdmin = currentUser?.rol === "Administrador";

  const SECCIONES = [
    { key: "portada", label: "Inicio", iconClass: "fas fa-rocket" },
    { key: "recursos", label: "Recursos", iconClass: "fas fa-book" },
    { key: "evidencias", label: "Evidencias", iconClass: "fas fa-images" },
    { key: "tutoriales", label: "Tutoriales", iconClass: "fab fa-youtube" },
    { key: "noticias", label: "Noticias", iconClass: "fas fa-bullhorn" },
    ...(isAdmin ? [{ key: "admin", label: "Gestión", iconClass: "fas fa-user-cog" }] : []),
  ];

  const getRoleBadge = (rol) => {
    if (rol === "Administrador") return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
    if (rol === "Docente") return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
    return "bg-gray-400 text-white";
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-dark-border shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer select-none flex-shrink-0" onClick={() => setActiveTab("portada")}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-2xl blur-md opacity-40" />
            <img
              src="/Img logo AIP.jpeg"
              alt="Logo AIP"
              className="relative h-11 w-11 object-cover rounded-xl shadow-lg ring-2 ring-white dark:ring-dark-card"
            />
          </div>
          <div className="text-left hidden sm:block">
            <h1 className="text-base font-black tracking-tight uppercase text-gray-900 dark:text-white leading-none">
              Innova Bandera
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-none mt-1 tracking-wide">
              I.E. Bandera del Perú · Pisco
            </p>
          </div>
        </div>

        {/* Navigation + Controls */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-gradient-to-br from-gray-50 to-gray-100/80 dark:from-dark-border dark:to-dark-bg/50 rounded-2xl p-1.5 border border-gray-200/40 dark:border-dark-border/40">
            {SECCIONES.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveTab(s.key)}
                title={s.label}
                className={`relative px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 overflow-hidden ${
                  activeTab === s.key
                    ? "bg-gradient-to-r from-primary to-blue-700 dark:from-dark-accent dark:to-blue-600 text-white shadow-md shadow-primary/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-dark-card/60"
                }`}
              >
                {activeTab === s.key && (
                  <span className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                )}
                <i className={`${s.iconClass} text-[11px] relative`}></i>
                <span className="relative">{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden md:block w-px h-7 bg-gradient-to-b from-transparent via-gray-300 dark:via-dark-border to-transparent"></div>

          {/* Login button — visible only when not authenticated */}
          {!currentUser && (
            <button
              onClick={() => setActiveTab("login")}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-blue-700 dark:from-dark-accent dark:to-blue-600 hover:from-blue-800 hover:to-primary text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
              title="Iniciar Sesión"
            >
              <i className="fas fa-sign-in-alt text-[11px]"></i>
              <span className="hidden lg:inline">Ingresar</span>
            </button>
          )}

          {/* User info & logout — visible when authenticated */}
          {currentUser && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-700 dark:from-dark-accent dark:to-blue-600 text-white flex items-center justify-center font-black text-[11px]">
                  {getInitials(currentUser.nombre)}
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">
                    {currentUser.nombre}
                  </div>
                  <div className={`text-[8px] font-black px-1.5 py-0.5 rounded-full mt-0.5 inline-block uppercase tracking-wider ${getRoleBadge(currentUser.rol)} ${isAdmin ? "animate-pulse" : ""}`}>
                    {isAdmin && <i className="fas fa-shield-alt mr-0.5"></i>}
                    {currentUser.rol}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 hover:bg-red-600 hover:text-white hover:border-red-600 text-red-600 dark:text-red-400 transition-all flex items-center justify-center shadow-sm hover:shadow-md active:scale-95"
                title="Cerrar Sesión"
              >
                <i className="fas fa-sign-out-alt text-xs"></i>
              </button>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-border transition-all flex items-center justify-center text-gray-700 dark:text-amber-400 shadow-sm hover:shadow-md active:scale-95"
            title={darkMode ? "Modo Claro" : "Modo Oscuro"}
          >
            {darkMode ? (
              <i className="fas fa-sun text-sm"></i>
            ) : (
              <i className="fas fa-moon text-sm text-primary"></i>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-100 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {SECCIONES.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveTab(s.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                activeTab === s.key
                  ? "bg-gradient-to-r from-primary to-blue-700 text-white shadow-md"
                  : "bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-300"
              }`}
            >
              <i className={`${s.iconClass} text-[10px]`}></i>
              {s.label}
            </button>
          ))}
          {!currentUser && (
            <button
              onClick={() => setActiveTab("login")}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary to-blue-700 text-white text-[11px] font-bold uppercase tracking-wider"
              title="Iniciar Sesión"
            >
              <i className="fas fa-sign-in-alt text-[10px]"></i>
              Ingresar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
