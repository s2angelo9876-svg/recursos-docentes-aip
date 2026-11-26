import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Images, PlayCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { storageLink } from "../services/imageUrl";
import { fechaComunicado, formatFechaComunicado } from "../utils/comunicados";

const sections = [
  { path: "/recursos", title: "Biblioteca pedagógica", description: "Encuentra recursos por área, grado o formato.", icon: BookOpen },
  { path: "/tutoriales", title: "Tutoriales TIC", description: "Aprende a utilizar herramientas digitales paso a paso.", icon: PlayCircle },
  { path: "/evidencias", title: "Evidencias del aula", description: "Explora actividades y proyectos del AIP.", icon: Images },
];

export default function Hero() {
  const { heroSlides, noticias, currentUser } = useApp();
  const [index, setIndex] = useState(0);
  const active = heroSlides[index] ? index : 0;
  const image = storageLink(heroSlides[active]?.imagenUrl);
  const latest = [...noticias].sort((a, b) => fechaComunicado(b) - fechaComunicado(a)).slice(0, 3);
  return (
    <div className="school-home">
      <section className="school-hero">
        <div className="school-hero-copy">
          <p className="school-kicker">Aula de Innovación Pedagógica</p>
          <h1>Ideas para<br className="hidden sm:block" /> <em>cada clase.</em></h1>
          <p>Materiales, tutoriales y proyectos del Aula de Innovación Pedagógica de la I.E. Bandera del Perú.</p>
          <div className="school-hero-actions">
            <Link to="/recursos" className="school-button">{currentUser ? "Explorar biblioteca" : "Acceder a la biblioteca"}<ArrowRight size={17} /></Link>
            <Link to="/tutoriales" className="school-text-link">Ver tutoriales</Link>
          </div>
          {!currentUser && <p className="school-note">Inicia sesión para consultar los materiales de la biblioteca.</p>}
        </div>
        <div className="school-hero-media">
          <figure className="school-hero-visual">
            <img src={image || "/portada-1280.webp"} srcSet={image ? undefined : "/portada-640.webp 640w, /portada-1280.webp 1280w"} sizes="(min-width: 900px) 630px, 96vw" alt={image ? "Imagen destacada del portal" : "Estudiantes trabajando en el aula de innovación"} fetchPriority="high" width="1600" height="900" />
            <figcaption>I.E. Emblemática Bandera del Perú · Pisco, Ica</figcaption>
          </figure>
          {heroSlides.length > 1 && <div className="school-slides" role="group" aria-label="Imágenes destacadas">{heroSlides.map((slide, i) => <button key={slide.id} type="button" aria-pressed={active === i} aria-label={`Mostrar imagen ${i + 1}`} onClick={() => setIndex(i)} />)}</div>}
        </div>
      </section>
      <section className="school-discover" aria-label="Explora el portal">
        {sections.map(({ path, title, description, icon: Icon }) => (
          <Link to={path} key={path} className="school-destination">
            <Icon size={22} aria-hidden="true" />
            <span><strong>{title}</strong><small>{description}</small></span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        ))}
      </section>
      {latest.length > 0 && (
        <section className="school-updates" aria-labelledby="school-news-heading">
          <div className="school-section-heading"><h2 id="school-news-heading">Comunicados recientes</h2><Link to="/noticias" className="school-text-link">Ver comunicados <ArrowRight size={16} /></Link></div>
          <div className="school-update-list">{latest.map((item) => <article key={item.id}><small>{formatFechaComunicado(item.fecha, "short")}</small><h3>{item.titulo}</h3><p>{item.desc}</p></article>)}</div>
        </section>
      )}
    </div>
  );
}
