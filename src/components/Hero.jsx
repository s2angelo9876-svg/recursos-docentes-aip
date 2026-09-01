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
  const { currentUser, recursos, tutoriales, evidencias } = useApp();
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
              <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-rose-300 bg-clip-text text-transparent">
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
                className="group inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-white text-primary-700 font-semibold text-[13px] hover:bg-amber-300 hover:text-primary-800 transition-colors shadow-sm"
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
            <div className="absolute inset-0 rounded-cardXl bg-white/[0.04] ring-1 ring-white/10 backdrop-blur-sm" />
            <div className="relative h-full p-6 flex flex-col gap-4">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative self-end w-44 rounded-2xl bg-gradient-to-br from-amber-300 to-rose-400 p-4 shadow-glow"
              >
                <div className="flex items-center gap-2 text-primary-900">
                  <i className="fas fa-graduation-cap text-base" />
                  <span className="text-[12px] font-bold">Aula AIP</span>
                </div>
                <p className="mt-2 text-[11px] text-primary-900/80 leading-snug">
                  {recursos?.length || 0} recursos · {tutoriales?.length || 0} tutoriales
                </p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-52 rounded-2xl bg-white/[0.08] ring-1 ring-white/20 backdrop-blur-md p-4"
              >
                <div className="flex items-center justify-between text-white/85">
                  <span className="text-[10px] uppercase tracking-widest font-semibold">
                    Cobertura
                  </span>
                  <i className="fas fa-chart-line text-amber-300" />
                </div>
                <p className="mt-3 text-[22px] font-bold tabular-nums">96%</p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[96%] bg-gradient-to-r from-amber-300 to-rose-300" />
                </div>
                <p className="mt-2 text-[10px] text-white/60">Áreas curriculares cubiertas</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative self-start w-48 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 ring-1 ring-white/20 p-4 shadow-glow"
              >
                <div className="flex items-center gap-2 text-amber-300">
                  <i className="fas fa-camera-retro text-base" />
                  <span className="text-[12px] font-bold text-white">Evidencias</span>
                </div>
                <p className="mt-2 text-[11px] text-white/80 leading-snug">
                  {evidencias?.length || 0} registros fotográficos del aula
                </p>
                <div className="mt-3 flex -space-x-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-7 w-7 rounded-full bg-white/15 ring-2 ring-primary-700 flex items-center justify-center text-[10px] font-bold"
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                  ))}
                  <span className="h-7 px-2 rounded-full bg-white/15 ring-2 ring-primary-700 flex items-center text-[10px] font-bold">
                    +{evidencias?.length || 0}
                  </span>
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
                  ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/40"
                  : "bg-sky-400/20 text-sky-100 ring-1 ring-sky-300/40"
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
              className={`group relative text-left rounded-cardLg bg-white dark:bg-dark-card border border-line dark:border-dark-border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 dark:hover:border-primary-500/40 ${
                i === 0 ? "md:row-span-1" : ""
              }`}
            >
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow-sm`}
              >
                <i className={`fas ${f.icon} text-base`} />
              </span>
              <span
                className={`mt-4 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${f.chipBg}`}
              >
                Explorar
              </span>
              <h3 className="mt-3 text-[17px] font-semibold tracking-tight text-ink dark:text-white">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[13px] text-ink-subtle leading-relaxed">
                {f.desc}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary-600 dark:text-primary-300 group-hover:gap-2.5 transition-all">
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
