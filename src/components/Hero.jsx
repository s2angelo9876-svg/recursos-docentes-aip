import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1];

const stats = [
  { value: "147", label: "Recursos publicados" },
  { value: "23", label: "Docentes activos" },
  { value: "10", label: "Áreas curriculares" },
  { value: "96%", label: "Cobertura pedagógica" },
];

const features = [
  {
    key: "recursos",
    icon: "fa-book-open",
    accent: "from-primary-500 to-primary-700",
    chipBg: "bg-primary-50 text-primary-600 dark:bg-primary-600/10 dark:text-primary-300",
    title: "Recursos por área",
    desc: "Guías, simuladores y materiales pedagógicos organizados por competencia, área curricular y grado.",
  },
  {
    key: "tutoriales",
    icon: "fa-circle-play",
    accent: "from-accent-500 to-accent-700",
    chipBg: "bg-accent-50 text-accent-600 dark:bg-accent-700/15 dark:text-accent-300",
    title: "Tutoriales paso a paso",
    desc: "Capacitación audiovisual para docentes y estudiantes, filtrada por audiencia y nivel.",
  },
  {
    key: "evidencias",
    icon: "fa-images",
    accent: "from-emerald-500 to-emerald-700",
    chipBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-700/15 dark:text-emerald-300",
    title: "Evidencias mensuales",
    desc: "Registro fotográfico de actividades, talleres y logros institucionales del aula AIP.",
  },
];

export default function Hero({ setActiveTab }) {
  const { currentUser, recursos, tutoriales, evidencias, noticias } = useApp();
  const isAdmin = currentUser?.rol === "Administrador";
  const isDocente = currentUser?.rol === "Docente";

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-cardLg bg-gradient-to-br from-[#001D52] via-[#002670] to-[#003D9E] text-white shadow-card-hover">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>
        <div
          className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-primary-400/30 blur-[100px] pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-accent-500/20 blur-[100px] pointer-events-none"
          aria-hidden
        />

        <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-10 px-6 sm:px-10 lg:px-14 py-12 lg:py-16">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur text-[11px] font-medium tracking-wide"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-soft-pulse" />
              Plataforma educativa · 2026
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: easeOut }}
              className="mt-5 text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-[-0.02em] leading-[1.05]"
            >
              Repositorio digital
              <br />
              de recursos{" "}
              <span className="bg-gradient-to-r from-primary-300 via-white to-accent-300 bg-clip-text text-transparent">
                pedagógicos
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: easeOut }}
              className="mt-5 text-[15px] text-white/80 leading-relaxed max-w-xl"
            >
              Accede, comparte y gestiona materiales educativos de la I.E. Bandera del Perú.
              Un espacio institucional moderno diseñado para potenciar el aprendizaje y la
              innovación docente.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: easeOut }}
              className="mt-7 flex flex-wrap gap-3"
            >
            <button
              onClick={() => setActiveTab("recursos")}
              className="group inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-white text-primary-700 font-semibold text-[13px] hover:bg-primary-50 transition-colors shadow-sm"
            >
              Explorar recursos
              <i className="fas fa-arrow-right text-[11px] transition-transform group-hover:translate-x-0.5" />
            </button>
              <button
                onClick={() => setActiveTab("evidencias")}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-white/10 ring-1 ring-white/25 text-white font-semibold text-[13px] hover:bg-white/15 transition-colors backdrop-blur"
              >
                <i className="fas fa-play text-[10px]" />
                Ver evidencias
              </button>
            </motion.div>

            <motion.dl
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32, ease: easeOut }}
              className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl"
            >
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`${
                    i > 0 ? "sm:border-l sm:border-white/15 sm:pl-5" : ""
                  }`}
                >
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums leading-none">
                    {s.value}
                  </dd>
                  <p className="mt-2 text-[10.5px] uppercase tracking-[0.12em] text-white/65 font-medium">
                    {s.label}
                  </p>
                </div>
              ))}
            </motion.dl>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: easeOut }}
            className="relative hidden lg:block"
            aria-hidden
          >
            <div className="relative h-full grid grid-cols-2 grid-rows-2 gap-3">
              {/* Brand pill (top, full width) */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="col-span-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-glow ring-1 ring-white/20"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white">
                  <i className="fas fa-graduation-cap text-sm" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-primary-900">Aula de Innovación Pedagógica</p>
                  <p className="text-[11px] text-primary-700/70">I.E. Bandera del Perú · Pisco</p>
                </div>
                <span className="inline-flex h-6 items-center gap-1 rounded-full bg-accent-600 px-2 text-[10px] font-bold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-soft-pulse" />
                  Activa
                </span>
              </motion.div>

              {/* Cobertura (bento left, más grande con visual) */}
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="row-span-2 rounded-2xl bg-white/[0.08] ring-1 ring-white/15 backdrop-blur-md p-5 flex flex-col"
              >
                <div className="flex items-center justify-between text-white/85">
                  <span className="text-[10px] uppercase tracking-[0.12em] font-semibold">
                    Cobertura
                  </span>
                  <i className="fas fa-chart-line text-accent-300" />
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-white">96%</p>
                <p className="mt-1 text-[11px] text-white/60">Áreas curriculares cubiertas</p>
                <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[96%] bg-accent-500" />
                </div>
                <div className="mt-auto pt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { v: recursos?.length || 0, l: "Recursos" },
                    { v: tutoriales?.length || 0, l: "Tuto." },
                    { v: evidencias?.length || 0, l: "Evid." },
                  ].map((m) => (
                    <div key={m.l} className="rounded-xl bg-white/5 py-2">
                      <p className="text-[15px] font-bold text-white tabular-nums">{m.v}</p>
                      <p className="text-[9px] text-white/55 uppercase tracking-wider mt-0.5">{m.l}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Actividad reciente (bento right, más compacto) */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-2xl bg-gradient-to-br from-primary-500/40 to-primary-700/40 ring-1 ring-white/20 p-4 flex flex-col"
              >
                <div className="flex items-center gap-2 text-white mb-2">
                  <i className="fas fa-bolt text-xs" />
                  <span className="text-[10px] uppercase tracking-[0.12em] font-semibold">
                    Actividad
                  </span>
                </div>
                <p className="text-[11px] text-white/85 leading-relaxed">
                  {noticias?.[0]?.titulo
                    ? `Último: "${noticias[0].titulo.slice(0, 32)}${noticias[0].titulo.length > 32 ? "…" : ""}"`
                    : "Sin comunicados recientes aún"}
                </p>
                <div className="mt-auto pt-3 flex items-center gap-1.5 text-[10px] text-white/60">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-soft-pulse" />
                  En vivo
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {(isAdmin || isDocente) && (
          <div className="absolute top-4 right-4 z-10">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur ${
                isAdmin
                  ? "bg-accent-500/25 text-accent-100 ring-1 ring-accent-300/50"
                  : "bg-primary-300/20 text-primary-100 ring-1 ring-primary-300/40"
              }`}
            >
              <i className={`fas ${isAdmin ? "fa-shield-halved" : "fa-pen"} text-[9px]`} />
              {isAdmin ? "Modo administrador" : "Modo edición docente"}
            </span>
          </div>
        )}
      </section>

      <section>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-2xl mb-8"
        >
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary-600 dark:text-primary-300">
            Una herramienta para el docente del siglo XXI
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-[-0.015em] text-ink dark:text-white">
            Empodera tu práctica pedagógica
          </h2>
          <p className="mt-3 text-[14px] text-ink-subtle leading-relaxed">
            Herramientas digitales integradas para acceder, organizar y compartir
            conocimiento con la comunidad educativa de la I.E. Bandera del Perú.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.button
              key={f.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: easeOut }}
              onClick={() => setActiveTab(f.key)}
              className="group relative flex flex-col text-left rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 dark:hover:border-primary-500/40 min-h-[220px]"
            >
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow-sm`}
              >
                <i className={`fas ${f.icon} text-base`} />
              </span>
              <span
                className={`mt-4 self-start inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${f.chipBg}`}
              >
                Explorar
              </span>
              <h3 className="mt-3 text-[17px] font-semibold tracking-tight text-ink dark:text-white">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[13px] text-ink-subtle dark:text-ink-meta leading-relaxed">
                {f.desc}
              </p>
              <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary-600 dark:text-primary-300 group-hover:gap-2.5 transition-all">
                Ir a la sección
                <i className="fas fa-arrow-right text-[10px]" />
              </span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
