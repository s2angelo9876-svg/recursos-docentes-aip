import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function Header({ activeTab, setActiveTab }) {
  const { darkMode, setDarkMode, currentUser, logout } = useApp();
  const isAdmin = currentUser?.rol === "Administrador";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const SECCIONES = [
    { key: "portada", label: "Inicio", icon: "fa-house" },
    { key: "recursos", label: "Recursos", icon: "fa-book-open" },
    { key: "evidencias", label: "Evidencias", icon: "fa-images" },
    { key: "tutoriales", label: "Tutoriales", icon: "fa-circle-play" },
    { key: "noticias", label: "Noticias", icon: "fa-bullhorn" },
    ...(isAdmin ? [{ key: "admin", label: "Gestión", icon: "fa-shield-halved" }] : []),
  ];

  const getRoleBadge = (rol) => {
    if (rol === "Administrador") return { label: "Administrador", cls: "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300" };
    if (rol === "Docente") return { label: "Docente", cls: "bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-300" };
    return { label: "Invitado", cls: "bg-slate-500/15 text-slate-600 ring-1 ring-slate-500/30 dark:text-slate-300" };
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  };

  const go = (key) => {
    setActiveTab(key);
    setMobileOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 transition-colors duration-300">
      <div
        className={`border-b backdrop-blur-xl ${
          darkMode
            ? "bg-dark-surface/90 border-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.04)]"
            : "bg-primary-800/95 border-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.06)]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => go("portada")}
            className="flex items-center gap-2.5 group flex-shrink-0"
            aria-label="Ir al inicio"
          >
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-xl bg-white/20 blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
              <img
                src="/Escudo Bandera.jpeg"
                alt="Logo Innova Bandera"
                className="relative h-10 w-10 rounded-xl object-cover ring-1 ring-white/40 shadow-lg"
              />
            </span>
            <span className="hidden sm:flex flex-col items-start leading-none text-white">
              <span className="text-[15px] font-bold tracking-tight">Innova Bandera</span>
              <span className="text-[11px] font-medium text-white/70 mt-0.5">
                I.E. Bandera del Perú · Pisco
              </span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-1 ml-2" aria-label="Navegación principal">
            {SECCIONES.map((s) => {
              const active = activeTab === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => go(s.key)}
                  className={`relative px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors duration-200 flex items-center gap-2 ${
                    active
                      ? "text-white bg-white/15"
                      : "text-white/75 hover:text-white hover:bg-white/8"
                  }`}
                >
                  <i className={`fas ${s.icon} text-[12px] ${active ? "text-white" : "text-white/60"}`} />
                  <span>{s.label}</span>
                  {active && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-[19px] h-[2px] w-6 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex-1" />

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={darkMode ? "Modo claro" : "Modo oscuro"}
          >
            <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"} text-sm`} />
          </button>

          {/* Buscador global (Cmd+K) */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("innova:command"))}
            className="hidden lg:inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/85 hover:text-white transition-colors text-[12px] font-medium"
            aria-label="Búsqueda global (presiona Ctrl+K)"
            title="Búsqueda global (Ctrl+K)"
          >
            <i className="fas fa-magnifying-glass text-xs" />
            <span>Buscar</span>
            <kbd className="hidden xl:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-semibold tracking-wide">
              Ctrl K
            </kbd>
          </button>

          {!currentUser ? (
            <button
              onClick={() => go("login")}
              className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white text-primary-700 font-semibold text-[13px] hover:bg-white/90 transition-colors shadow-sm"
            >
              <i className="fas fa-arrow-right-to-bracket text-xs" />
              <span>Acceder</span>
            </button>
          ) : (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 h-10 pl-1.5 pr-3 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-white to-white/70 text-primary-700 font-bold text-[12px] flex items-center justify-center">
                  {getInitials(currentUser.nombre)}
                </span>
                <span className="hidden md:flex flex-col items-start leading-none">
                  <span className="text-[12px] font-semibold">{currentUser.nombre}</span>
                  <span className="text-[10px] text-white/70 mt-0.5">{getRoleBadge(currentUser.rol).label}</span>
                </span>
                <i className="fas fa-chevron-down text-[9px] text-white/60" />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div
                    className={`absolute right-0 top-12 w-60 rounded-2xl border shadow-xl overflow-hidden z-50 ${
                      darkMode
                        ? "bg-dark-card border-dark-border"
                        : "bg-white border-line shadow-card-hover"
                    }`}
                  >
                    <div className="p-4 border-b border-line dark:border-dark-border">
                      <div className="text-[13px] font-semibold text-ink dark:text-white">
                        {currentUser.nombre}
                      </div>
                      <div className="text-[11px] text-ink-subtle mt-0.5">
                        {currentUser.usuario || currentUser.email}
                      </div>
                      <span
                        className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getRoleBadge(currentUser.rol).cls}`}
                      >
                        {getRoleBadge(currentUser.rol).label}
                      </span>
                    </div>
                    <div className="p-1.5">
                      {isAdmin && (
                        <button
                          onClick={() => go("admin")}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-ink dark:text-white hover:bg-surface-alt dark:hover:bg-dark-hover transition-colors text-left"
                        >
                          <i className="fas fa-shield-halved w-4 text-ink-subtle" />
                          Panel de gestión
                        </button>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-700/20 transition-colors text-left"
                      >
                        <i className="fas fa-right-from-bracket w-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white"
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
          >
            <i className={`fas ${mobileOpen ? "fa-xmark" : "fa-bars"} text-base`} />
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-primary-800/95 backdrop-blur-xl">
            <nav className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 gap-2">
              {SECCIONES.map((s) => {
                const active = activeTab === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => go(s.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-white text-primary-700"
                        : "text-white/85 hover:bg-white/10"
                    }`}
                  >
                    <i className={`fas ${s.icon} text-xs ${active ? "" : "text-white/60"}`} />
                    {s.label}
                  </button>
                );
              })}
              {!currentUser && (
                <button
                  onClick={() => go("login")}
                  className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white text-primary-700 font-semibold text-[13px]"
                >
                  <i className="fas fa-arrow-right-to-bracket" />
                  Acceder al panel
                </button>
              )}
              {currentUser && (
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent-600 text-white font-semibold text-[13px]"
                >
                  <i className="fas fa-right-from-bracket" />
                  Cerrar sesión
                </button>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 text-white font-medium text-[13px]"
              >
                <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`} />
                {darkMode ? "Modo claro" : "Modo oscuro"}
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
