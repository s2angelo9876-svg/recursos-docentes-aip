import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1];


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
          className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-accent-500/35 blur-[100px] pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-primary-400/30 blur-[100px] pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-rose-500/25 blur-[100px] pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute top-1/4 right-1/3 w-64 h-64 rounded-full bg-accent-700/20 blur-[80px] pointer-events-none"
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
              Aula de Innovación Pedagógica · 2026
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: easeOut }}
              className="mt-5 text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-[-0.02em] leading-[1.05]"
            >
              Innova{" "}
              <span
                className="bg-gradient-to-r from-rose-400 via-red-500 to-rose-600 bg-clip-text text-transparent"
                style={{ filter: "drop-shadow(0 0 24px rgba(239,68,68,0.45))" }}
              >
                Bandera
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: easeOut }}
              className="mt-5 text-[15px] text-white/80 leading-relaxed max-w-xl"
            >
              Materiales, herramientas y experiencias para potenciar el aprendizaje y la
              innovación en tus clases.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: easeOut }}
              className="mt-7 flex flex-wrap gap-3"
            >
            <button
              onClick={() => setActiveTab("recursos")}
              className="group inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-accent-600 hover:bg-accent-700 text-white font-semibold text-[13px] transition-colors shadow-sm hover:shadow"
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

          </div>

          {/* Right panel — single unified card with background image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: easeOut }}
            className="relative hidden lg:block"
            aria-hidden
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative h-full rounded-2xl overflow-hidden shadow-glow ring-1 ring-white/20"
            >
              {/* Background image */}
              <img
                src="/hero-bg.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Dark overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/95 via-[#0a1628]/60 to-[#0a1628]/30" />

              {/* Content */}
              <div className="relative flex flex-col h-full min-h-[340px] p-5">
                {/* Top: Brand pill */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                    <i className="fas fa-graduation-cap text-sm text-white" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-white">Aula de Innovación Pedagógica</p>
                    <p className="text-[11px] text-white/75">I.E. Bandera del Perú · Pisco</p>
                  </div>
                  <span className="inline-flex h-6 items-center gap-1 rounded-full bg-white px-2.5 text-[10px] font-bold text-accent-700 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-600 animate-soft-pulse" />
                    Activa
                  </span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom: Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: "fa-book-open", value: recursos?.length || 0, label: "Recursos\ndisponibles" },
                    { icon: "fa-chalkboard-user", value: "23", label: "Docentes\nque comparten" },
                    { icon: "fa-layer-group", value: "10", label: "Áreas\nrepresentadas" },
                    { icon: "fa-chart-line", value: "96%", label: "Cobertura\npedagógica" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center text-center rounded-xl bg-white/[0.08] backdrop-blur-sm ring-1 ring-white/10 py-3 px-1">
                      <i className={`fas ${s.icon} text-sm text-white/70 mb-2`} />
                      <p className="text-xl font-bold text-white tabular-nums leading-none">{s.value}</p>
                      <p className="mt-1.5 text-[9px] text-white/60 uppercase tracking-wider leading-tight whitespace-pre-line">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
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
