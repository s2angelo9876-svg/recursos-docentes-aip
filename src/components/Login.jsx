import { useState } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1];

export default function Login({ onLoginSuccess }) {
  const { login } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Por favor ingresa tu usuario y contraseña.");
      return;
    }
    try {
      setError("");
      setLoading(true);
      const res = await login(username, password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setError(res.error || "Usuario o contraseña incorrectos.");
      }
    } catch {
      setError("Ocurrió un error al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-stretch overflow-hidden rounded-cardXl border border-line dark:border-dark-border bg-white dark:bg-dark-card shadow-card-hover">
      <aside className="hidden md:flex relative flex-col justify-between w-1/2 bg-gradient-to-br from-[#001D52] via-[#002670] to-[#003D9E] text-white p-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
        </div>
        <div
          className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-accent-500/30 blur-[100px] pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-primary-400/30 blur-[100px] pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute top-1/3 right-10 w-72 h-72 rounded-full bg-rose-500/25 blur-[100px] pointer-events-none"
          aria-hidden
        />

        <div className="relative flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <i className="fas fa-graduation-cap text-lg" />
          </span>
          <div className="leading-none">
            <p className="text-[15px] font-bold tracking-tight">Innova Bandera</p>
            <p className="text-[11px] text-white/70 mt-1">
              Aula de Innovación Pedagógica
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="relative"
        >
          <h1 className="text-3xl xl:text-4xl font-bold tracking-[-0.02em] leading-[1.1]">
            I.E. Emblemática
            <br />
            <span className="bg-gradient-to-r from-rose-300 via-white to-accent-300 bg-clip-text text-transparent">
              Bandera del Perú
            </span>
          </h1>
          <p className="mt-5 text-[14px] text-white/80 leading-relaxed max-w-sm">
            Plataforma institucional para la gestión de recursos pedagógicos del
            cuerpo docente. Ingresa con tus credenciales asignadas por el área AIP.
          </p>

          <ul className="mt-8 space-y-2.5 text-[12.5px] text-white/85">
            <li className="flex items-center gap-2.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                <i className="fas fa-check text-[9px]" />
              </span>
              Acceso seguro con credenciales institucionales
            </li>
            <li className="flex items-center gap-2.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                <i className="fas fa-check text-[9px]" />
              </span>
              Sincronización con el aula de innovación
            </li>
            <li className="flex items-center gap-2.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                <i className="fas fa-check text-[9px]" />
              </span>
              Respaldo y auditoría de actividades
            </li>
          </ul>
        </motion.div>

        <div className="relative">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/60">
            Honor · Lealtad · Trabajo
          </p>
          <p className="mt-1 text-[11px] text-white/50">
            © {new Date().getFullYear()} I.E. Bandera del Perú · Pisco, Ica
          </p>
        </div>
      </aside>

      <section className="flex-1 flex flex-col justify-center p-8 sm:p-12">
        <div className="max-w-sm w-full mx-auto">
          <span className="md:hidden inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-sm mb-6">
            <i className="fas fa-graduation-cap text-base" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-ink dark:text-white">
            Acceso al panel
          </h2>
          <p className="mt-1.5 text-[13px] text-ink-subtle">
            Ingresa tus credenciales para continuar.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-3 rounded-btn bg-accent-50 dark:bg-accent-700/15 border border-accent-100 dark:border-accent-700/30 text-accent-600 dark:text-accent-300 text-[13px] font-medium flex items-start gap-2.5"
              role="alert"
            >
              <i className="fas fa-circle-exclamation text-sm mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="login-user"
                className="block text-[12px] font-semibold text-ink dark:text-white"
              >
                Usuario
              </label>
              <div className="relative">
                <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-meta text-sm pointer-events-none" />
                <input
                  id="login-user"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="nombre.apellido"
                  className="w-full h-11 pl-10 pr-4 rounded-btn border border-line dark:border-dark-border bg-white dark:bg-dark-input text-[14px] text-ink dark:text-white placeholder:text-ink-meta focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-pass"
                  className="block text-[12px] font-semibold text-ink dark:text-white"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-[11px] text-accent-600 dark:text-accent-400 hover:underline font-medium"
                  tabIndex={-1}
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>
              <div className="relative">
                <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-meta text-sm pointer-events-none" />
                <input
                  id="login-pass"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-btn border border-line dark:border-dark-border bg-white dark:bg-dark-input text-[14px] text-ink dark:text-white placeholder:text-ink-meta focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-ink-meta hover:text-ink dark:hover:text-white hover:bg-surface-alt dark:hover:bg-dark-elev flex items-center justify-center transition-colors"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 rounded-btn bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white text-[14px] font-semibold transition-all shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin text-sm" />
                  Verificando…
                </>
              ) : (
                <>
                  Iniciar sesión
                  <i className="fas fa-arrow-right text-[11px]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-line-subtle dark:border-dark-border">
            <p className="text-[11px] text-ink-meta text-center">
              Acceso restringido al personal autorizado de la I.E. Bandera del Perú.
            </p>
            <p className="mt-1.5 text-[10px] text-ink-meta text-center">
              Soporte:{" "}
              <a
                href="mailto:contacto@banderadelperu.edu.pe"
                className="text-accent-600 dark:text-accent-400 hover:underline font-medium"
              >
                contacto@banderadelperu.edu.pe
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
