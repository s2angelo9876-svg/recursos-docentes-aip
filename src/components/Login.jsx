import { useState } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";

export default function Login({ onLoginSuccess, description = "Ingresa tu usuario y contraseña." }) {
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
    <div className="school-login">
      <aside className="school-login-aside">
        <img src="/portada-1280.webp" alt="Estudiantes en el aula de innovación" width="1600" height="900" />
        <div><p>Aula de Innovación Pedagógica</p><strong>Innova Bandera</strong></div>
      </aside>

      <section className="flex-1 flex flex-col justify-center p-8 sm:p-12">
        <div className="max-w-sm w-full mx-auto">
          <h1 className="school-login-title">
            Inicia sesión
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-subtle">
            {description}
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
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="nombre.apellido"
                  className="w-full h-11 pl-10 pr-4 rounded-btn border border-line dark:border-dark-border bg-white dark:bg-dark-input text-[14px] text-ink dark:text-white placeholder:text-ink-meta focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-pass" className="block text-[12px] font-semibold text-ink dark:text-white">
                Contraseña
              </label>
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
                  className="school-icon absolute right-0 top-0"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="school-button w-full mt-2 disabled:opacity-60"
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
          <details className="school-login-help mt-5">
            <summary>¿Olvidaste tu contraseña?</summary>
            <p className="mt-2 text-[13px] text-ink-subtle">Solicita al equipo del Aula de Innovación Pedagógica que la restablezca.</p>
          </details>
        </div>
      </section>
    </div>
  );
}
