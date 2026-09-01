import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";

export default function Hero({ setActiveTab }) {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.rol === "Administrador";

  const features = [
    {
      key: "recursos",
      icon: "fas fa-book-open",
      iconBg: "bg-blue-100 text-blue-600",
      title: "Recursos Educativos",
      desc: "Acceso inmediato a guías, simuladores y materiales pedagógicos.",
      accent: "hover:border-blue-400",
    },
    {
      key: "tutoriales",
      icon: "fab fa-youtube",
      iconBg: "bg-red-100 text-red-600",
      title: "Tutoriales en Video",
      desc: "Capacitación continua con guías paso a paso en formato audiovisual.",
      accent: "hover:border-red-400",
    },
    {
      key: "evidencias",
      icon: "fas fa-camera-retro",
      iconBg: "bg-green-100 text-green-600",
      title: "Evidencias Fotográficas",
      desc: "Registro y gestión de las actividades y logros de la institución.",
      accent: "hover:border-green-400",
    },
    {
      key: "noticias",
      icon: "fas fa-bullhorn",
      iconBg: "bg-purple-100 text-purple-600",
      title: "Noticias y Comunicados",
      desc: "Canal oficial de información para la comunidad educativa.",
      accent: "hover:border-purple-400",
    },
  ];

  const stats = [
    { value: "500+", label: "Recursos" },
    { value: "12", label: "Áreas Curriculares" },
    { value: "50+", label: "Docentes Activos" },
    { value: "10", label: "Meses de Gestión" },
  ];

  return (
    <div className="space-y-12">
      {/* ── HERO ───────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#001D52] via-[#003087] to-[#0047BB] dark:from-dark-bg dark:via-[#0a0f24] dark:to-[#0f172a] text-white shadow-2xl"
      >
        {/* Patrón geométrico de fondo */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Blobs decorativos */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-600/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Decoración geométrica derecha */}
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none">
          <div className="relative w-80 h-80">
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-300 to-blue-500 shadow-2xl"
              style={{ transform: "rotate(15deg)" }}
            />
            <motion.div
              animate={{ y: [0, 10, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-12 left-0 w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-2xl"
            />
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-12 w-16 h-16 rounded-2xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md border border-white/30 shadow-xl"
              style={{ transform: "rotate(-12deg)" }}
            />
            <motion.div
              animate={{ y: [0, 6, 0], rotate: [0, -6, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-4 right-12 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-red-400 shadow-xl"
            />
          </div>
        </div>

        <div className="relative z-10 px-8 md:px-16 py-16 md:py-24 lg:max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full mb-6"
          >
            <i className="fas fa-graduation-cap text-yellow-300"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Plataforma Educativa Oficial 2026</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-[1.05]"
          >
            Repositorio Digital de
            <br />
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-red-300 bg-clip-text text-transparent">
              Recursos Pedagógicos
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-blue-100/85 text-base md:text-lg mb-8 font-medium leading-relaxed max-w-xl"
          >
            Accede a recursos, tutoriales y evidencias organizados por mes, área y nivel educativo. Diseñado para docentes innovadores.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap gap-3 mb-12"
          >
            <button
              onClick={() => setActiveTab("recursos")}
              className="bg-white hover:bg-yellow-300 text-[#003087] px-7 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl active:scale-95 group"
            >
              Explorar Recursos
              <i className="fas fa-arrow-right text-[11px] group-hover:translate-x-1 transition-transform"></i>
            </button>
            <button
              onClick={() => setActiveTab("evidencias")}
              className="bg-white/5 hover:bg-white/15 text-white border-2 border-white/30 px-7 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
            >
              <i className="fas fa-play text-[10px]"></i>
              Ver Evidencias
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className="bg-amber-500/90 hover:bg-amber-400 text-white px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <i className="fas fa-cogs"></i> Panel Admin
              </button>
            )}
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl"
          >
            {stats.map((s) => (
              <div key={s.label} className="border-l-2 border-white/30 pl-3 md:pl-4">
                <div className="text-2xl md:text-3xl font-black leading-none">{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-blue-100/70 mt-1 font-bold">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {isAdmin && (
          <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md z-20">
            <i className="fas fa-shield-alt"></i> Admin
          </div>
        )}
      </motion.section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section>
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight"
          >
            Una herramienta diseñada
            <br className="md:hidden" />
            <span className="text-gray-400"> para el docente del siglo XXI</span>
          </motion.h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
            Empoderando a los docentes con herramientas digitales integradas para una educación moderna y efectiva.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              onClick={() => setActiveTab(f.key)}
              className={`group cursor-pointer p-6 bg-white dark:bg-dark-card border-2 border-transparent rounded-2xl shadow-sm hover:shadow-xl transition-all text-left ${f.accent}`}
            >
              <div className={`w-12 h-12 rounded-2xl ${f.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <i className={`${f.icon} text-xl`}></i>
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{f.desc}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-dark-accent-text">
                Explorar <i className="fas fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform"></i>
              </span>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
