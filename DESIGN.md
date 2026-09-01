# DESIGN.md - Sistema de Diseño INNOVA BANDERA

## Identidad

Plataforma digital oficial de la **I.E. Bandera del Perú** (Pisco, Ica, Perú) — un centro de recursos pedagógicos para docentes. Diseño **serio, institucional, moderno y accesible**, que combina confianza gubernamental con innovación educativa.

Inspiración: portales educativos oficiales + dashboards modernos (Notion, Linear, Vercel) + la energía visual de las páginas de I.E. emblemáticas del Perú.

---

## Paleta de colores

### Colores primarios
- **Primary (Azul institucional):** `#003087` — headers, botones primarios, navegación, enlaces, badges principales.
- **Primary Dark:** `#001D52` — fondos de footer, gradientes oscuros, overlays.
- **Secondary / Accent (Rojo):** `#DC2626` — CTAs destacados, badges urgentes, hover states sobre elementos primarios, llamadas a la acción críticas.
- **Accent Light:** `#FEF2F2` — fondos sutiles para resaltar elementos rojos.

### Colores semánticos (categorías)
- **Blue:** `#2563EB` — Recursos, información general.
- **Red:** `#DC2626` — Tutoriales, video, alertas.
- **Green:** `#16A34A` — Éxito, evidencias, validación.
- **Amber:** `#F59E0B` — Advertencia, edición, en progreso.
- **Cyan:** `#0891B2` — Información técnica, capacitación.
- **Purple:** `#9333EA` — Celebración, eventos especiales.
- **Pink:** `#EC4899` — Comunicación, comunidad.
- **Emerald:** `#059669` — Proyectos destacados.
- **Indigo:** `#6366F1` — Galería, multimedia, Drive.
- **Violet:** `#7C3AED` — Mixto / categorías combinadas.

### Fondos
- **Background principal:** `#FFFFFF` (light) / `#020617` (dark).
- **Surface alternado:** `#F8FAFC` (light) / `#0F172A` (dark) — secciones alternadas, cards de fondo.
- **Card:** `#FFFFFF` (light) / `#0F172A` (dark).
- **Card hover:** `#F8FAFC` (light) / `#1E293B` (dark).

### Texto
- **Heading principal:** `#0F172A` (light) / `#F8FAFC` (dark).
- **Cuerpo:** `#334155` (light) / `#E2E8F0` (dark).
- **Secundario / placeholder:** `#64748B` (light) / `#94A3B8` (dark).
- **Tertiary / metadata:** `#94A3B8` (light) / `#64748B` (dark).

### Bordes
- **Default:** `#E2E8F0` (light) / `#1E293B` (dark).
- **Subtle:** `#F1F5F9` (light) / `#1E293B` (dark).
- **Strong:** `#CBD5E1` (light) / `#334155` (dark).

### Acentos para cards / chips
- **Blue:** `bg-blue-50 text-blue-600 border-blue-100` (light) / `bg-blue-950/30 text-blue-400 border-blue-900/40` (dark).
- **Red:** `bg-red-50 text-red-600 border-red-100` / `bg-red-950/30 text-red-400 border-red-900/40`.
- **Green:** `bg-green-50 text-green-600 border-green-100` / `bg-green-950/30 text-green-400 border-green-900/40`.
- **Amber:** `bg-amber-50 text-amber-700 border-amber-200` / `bg-amber-950/20 text-amber-400 border-amber-900/40`.
- *(mismo patrón para cyan, purple, pink, emerald, indigo, violet)*

---

## Tipografía

### Familias
- **Headlines:** `Inter` (700, 800, 900) — sans-serif geométrica moderna, alta legibilidad.
- **Body:** `Inter` (400, 500, 600).
- **Labels / botones:** `Inter` (700, 800, 900) con tracking ancho `0.05em–0.1em` y mayúsculas para CTAs y badges.

### Escala tipográfica
- **Display (Hero H1):** `clamp(2.25rem, 5vw, 3.75rem)` — bold/black, `leading-[1.05]`, `tracking-tight`.
- **H2 sección:** `1.875rem` (desktop), `1.5rem` (mobile) — bold.
- **H3 card / sub:** `1.125rem` a `1.25rem` — bold.
- **Body:** `1rem` (16px base, escalable a `18px` raíz html para mejor legibilidad).
- **Caption / metadata:** `0.75rem` (12px) — uppercase + tracking-widest.
- **Micro / badges:** `0.625rem` a `0.6875rem` (10-11px) — bold + uppercase.

### Pesos
- **Regular:** 400 (cuerpo).
- **Medium:** 500 (énfasis sutil).
- **Semibold:** 600 (subtítulos).
- **Bold:** 700 (headings, botones).
- **Extrabold / Black:** 800-900 (display, CTAs).

### Estilo
- Headlines con `tracking-tight` (-0.025em).
- Labels y CTAs con `tracking-wider` (0.05em) o `tracking-widest` (0.1em) + `uppercase`.
- Párrafos con `leading-relaxed` (1.625) o `leading-loose` (2).

---

## Forma y geometría

### Border radius
- **xs:** `4px` — chips pequeños, inputs compactos.
- **sm:** `8px` — botones pequeños, tags.
- **md:** `12px` — botones medianos, inputs, badges.
- **lg:** `16px` — cards pequeñas, panels.
- **xl:** `24px` — cards principales.
- **2xl:** `32px` — hero panels, contenedores destacados.
- **3xl (pill):** `9999px` — pills, badges redondeados completos, avatares.

### Sombras
- **Card sutil:** `0 4px 24px rgba(0, 48, 135, 0.08)` — cards en reposo.
- **Card hover:** `0 20px 60px rgba(0, 48, 135, 0.14)` — cards en hover.
- **Button:** `0 4px 12px rgba(0, 48, 135, 0.20)` — botones primarios.
- **Modal:** `0 25px 80px rgba(0, 0, 0, 0.25)` — modales y overlays.

### Transiciones
- **Smooth:** `all 0.35s cubic-bezier(0.4, 0, 0.2, 1)` — transiciones generales de tema.
- **Hover:** `200ms ease` — cambios de color y elevación.
- **Modal:** `250ms ease-out` — entrada/salida con scale + opacity.

---

## Componentes clave

### Botones primarios
- Fondo: `bg-gradient-to-r from-primary to-blue-700` (light) / `from-dark-accent to-blue-600` (dark).
- Texto: `text-white`, `font-bold`, `uppercase`, `tracking-wider`, `text-xs`.
- Padding: `px-5 py-3` (mediano) o `px-7 py-3.5` (grande).
- Radius: `rounded-xl` (12px).
- Hover: `from-blue-800 to-primary` (inversión) + sombra elevada.
- Active: `scale-[0.97]`.
- Icono opcional a la izquierda (`mr-2`) o derecha (`ml-2 group-hover:translate-x-1`).

### Botones outline / secundarios
- Fondo transparente + `border-2 border-{color}`.
- Texto del color del borde.
- Hover: fondo del color al 10-15%.

### Cards
- Fondo blanco / dark card.
- Borde sutil (`border border-gray-200` / `border-dark-border`).
- Padding: `p-6` o `p-4` para más compacto.
- Radius: `rounded-2xl` (16px) para cards principales.
- Sombra: `shadow-sm` en reposo, `shadow-xl` en hover.
- Hover: ligera elevación + borde más oscuro + `transition-all duration-300`.
- Icono en contenedor: `w-12 h-12 rounded-2xl` con color de fondo semántico.

### Inputs / Formularios
- Border: `border border-gray-200` (light) / `border-dark-border` (dark).
- Padding: `px-3 py-2.5` o `px-4 py-2.5`.
- Radius: `rounded-xl` (12px).
- Focus: `ring-2 ring-primary` con offset o sin offset.
- Placeholder: gris medio (`text-gray-400`).
- Icono a la izquierda opcional: `absolute left-3 top-3`.

### Badges / Chips
- `text-[8px]` a `text-[10px]` con `font-black uppercase tracking-widest`.
- Padding: `px-1.5 py-0.5` o `px-2 py-1`.
- Radius: `rounded-full` (pill) o `rounded` (4px).
- Combinación: `bg-{color}-50 text-{color}-600 border border-{color}-100`.

### Cards de galería / recursos
- Imagen / thumbnail superior: `aspect-video`, `object-cover`, radio consistente.
- Badges en overlay (esquina superior): colores semánticos según categoría.
- Título + descripción + botón CTA.
- Hover: scale 1.05 en la imagen, sombra elevada en card.

### Modales / Dialogs
- Backdrop: `fixed inset-0 bg-black/85 backdrop-blur-sm`.
- Contenido: `bg-white rounded-2xl shadow-2xl`.
- Animación: scale + opacity con `framer-motion`.
- Botón cerrar: circular con `bg-white/10 hover:bg-red-500/80`.
- Header flotante con `bg-gradient-to-b from-black/70`.

### Hero / Landing
- Fondo: `bg-gradient-to-br from-[#001D52] via-[#003087] to-[#0047BB]` (light) / `from-dark-bg via-[#0a0f24] to-[#0f172a]` (dark).
- Patrón SVG sutil de cuadrícula en `opacity-10`.
- Blobs decorativos con `blur-[120px]` y colores primary/accent.
- Decoración geométrica animada a la derecha (cubos, esferas flotantes con `framer-motion`).
- Badge glassmorphism superior: `bg-white/10 backdrop-blur-md border border-white/20`.
- Título grande con `bg-clip-text` y gradiente.
- Stats bar inferior con separadores `border-l-2 border-white/30`.

### Footer
- Fondo: `bg-[#001D52]` (dark blue) o `bg-black` (modo oscuro).
- Texto blanco con jerarquía: blanco puro para títulos, `text-blue-100/70` para cuerpo.
- 4 columnas: Logo+desc, Navegación, Recursos, Contacto.
- Iconos sociales circulares: `w-7 h-7 rounded-full bg-white/10 hover:bg-{color}`.
- Bottom bar con copyright y redes.

### Navegación header
- Sticky: `sticky top-0 z-50`.
- Fondo: `bg-white/80 backdrop-blur-xl` (glassmorphism).
- Logo: imagen + nombre + subtítulo pequeño.
- Nav: contenedor `bg-gray-100` con pills activas con gradiente `from-primary to-blue-700`.
- Avatar usuario: gradiente con iniciales, badge de rol.

---

## Iconografía
- **Librería:** Font Awesome 6 (`@fortawesome/fontawesome-free`).
- **Tamaños:**
  - `text-xs` (12px) — inline, badges.
  - `text-sm` (14px) — iconos de botones pequeños.
  - `text-base` (16px) — iconos de cards.
  - `text-xl` (20px) — iconos destacados en cards.
  - `text-2xl` (24px) — iconos hero.
- **Estilo:** `fas fa-*` (sólido), `far fa-*` (regular), `fab fa-*` (brands).

### Iconos específicos por sección
- Inicio: `fas fa-rocket`
- Recursos: `fas fa-book`, `fas fa-laptop-code`
- Evidencias: `fas fa-images`, `fas fa-camera-retro`
- Tutoriales: `fab fa-youtube`
- Noticias: `fas fa-bullhorn`
- Admin: `fas fa-cogs`, `fas fa-user-cog`, `fas fa-shield-alt`
- Login: `fas fa-sign-in-alt`
- Galería: `fas fa-images`, `fab fa-google-drive`
- Video: `fas fa-play`, `fas fa-video`
- Imágenes: `fas fa-image`

---

## Principios de diseño

1. **Institucional pero moderno** — combinar confianza con innovación.
2. **Mucho espacio en blanco** — dejar respirar el contenido, no saturar.
3. **Jerarquía visual clara** — títulos grandes, contenido secundario más pequeño.
4. **Uso moderado de mayúsculas + tracking** — solo en CTAs, badges, navegación.
5. **Sombras sutiles** — no exageradas, `shadow-sm` por defecto, `shadow-xl` en hover.
6. **Bordes redondeados consistentes** — 12-16px en cards, 8-12px en botones.
7. **Alto contraste** — accesibilidad WCAG AA mínimo.
8. **Responsive mobile-first** — grid 1/2/3/4 columnas según breakpoint.
9. **Modo oscuro soportado** — fondos `#020617` / `#0F172A` / `#1E293B`.
10. **Animaciones sutiles** — `framer-motion` con `duration: 0.2-0.5s` y `ease-out`.
11. **Estados claros** — loading (spinner), error (rojo con icono), success (verde), empty state con icono + CTA.
12. **Badges con propósito** — categoría, mes, estado, tipo. Solo cuando aportan info real.

---

## Modo oscuro (dark mode)

### Backgrounds
- Página principal: `#020617` (`dark-bg`).
- Cards: `#0F172A` (`dark-card`).
- Borders: `#1E293B` (`dark-border`).
- Inputs / hover: `#1E293B` (`dark-hover`).

### Texto
- Headings: `#F8FAFC` (casi blanco).
- Body: `#E2E8F0`.
- Secundario: `#94A3B8`.
- Tertiary: `#64748B`.

### Acentos (mantener saturación, ajustar luminosidad)
- Primary → `#3B82F6` (`dark-accent`).
- Primary text → `#60A5FA` (`dark-accent-text`).
- Red → `#F87171` (más claro para contraste).
- Green → `#4ADE80`.
- Amber → `#FBBF24`.

---

## Breakpoints y responsive

- **sm:** `640px` — tablets pequeñas.
- **md:** `768px` — tablets, layouts horizontales.
- **lg:** `1024px` — desktop estándar.
- **xl:** `1280px` — desktop amplio.

### Patrones de grid
- Cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- Features: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- Filtros: `flex-col md:flex-row` (búsqueda + selects + botón).
- Containers: `max-w-7xl mx-auto px-4 sm:px-6`.

---

## Animaciones (framer-motion)

- **Page transitions:** fade + slide vertical `y: 15px`, `duration: 0.25s`.
- **Cards in grid:** scale `0.95 → 1`, `duration: 0.4s`, con stagger `delay: i * 0.08s`.
- **Hero elements:** fade + slide con stagger.
- **Modals:** scale `0.96 → 1` + opacity, `duration: 0.25s`, ease `easeOut`.
- **Hover effects:** `transition-all duration-300` o `200ms`.
- **Floating decoration (hero):** `animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}` con `repeat: Infinity`.

---

## Estados de UI

### Loading
- Spinner circular con `animate-spin` y bordes `border-t-{color}`.
- Texto "Cargando..." o "Guardando..." en uppercase + tracking.
- En cards: skeleton con `animate-pulse`.

### Error
- Banner rojo: `bg-red-50 border-red-200 text-red-700` con icono `fa-exclamation-triangle`.
- En formularios: mensaje específico + icono.

### Empty state
- Icono grande en gris claro (`text-gray-300`).
- Título bold uppercase.
- Descripción corta + CTA opcional.

### Success
- Banner verde con `fa-check-circle`.
- Toast o mensaje inline.

---

## Checklist de revisión

Antes de aprobar cualquier screen:

- [ ] Usa solo colores de la paleta definida.
- [ ] Tipografía Inter, con jerarquía clara.
- [ ] Border radius consistente (12-16px en cards, 8-12px en botones).
- [ ] Sombras sutiles (no exageradas).
- [ ] Modo oscuro soportado en todos los elementos.
- [ ] Responsive en mobile, tablet, desktop.
- [ ] Iconos Font Awesome semánticamente correctos.
- [ ] Espaciado consistente (Tailwind spacing scale).
- [ ] Animaciones suaves (200-400ms).
- [ ] Accesibilidad: contraste, focus states, aria labels.
- [ ] Estados: loading, error, empty, success manejados.

---

## Convenciones Tailwind

- Usar `bg-{color}-50 text-{color}-600` para chips/badges.
- Usar `bg-gradient-to-r from-X to-Y` para botones primarios.
- Usar `dark:` prefix para modo oscuro.
- Usar `backdrop-blur-{xl|2xl}` para glassmorphism.
- Usar `aspect-video` para thumbnails de video/imagen.
- Usar `text-[10px] font-black uppercase tracking-widest` para micro-labels.

---

## Resumen de identidad en una frase

> **"Una plataforma educativa seria, moderna y confiable, con la calidez institucional del Perú y la eficiencia visual de las mejores herramientas digitales del mundo."**
