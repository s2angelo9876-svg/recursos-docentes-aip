import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useApp } from "../context/AppContext";

const links = [
  ["/", "Inicio"], ["/recursos", "Biblioteca"], ["/tutoriales", "Tutoriales"],
  ["/evidencias", "Evidencias"], ["/noticias", "Comunicados"],
];

export default function Header() {
  const { currentUser, logout, darkMode, setDarkMode } = useApp();
  const [open, setOpen] = useState(false);
  const menu = currentUser?.rol === "Administrador" ? [...links, ["/admin", "Gestión"]] : links;
  const themeLabel = darkMode ? "Activar tema claro" : "Activar tema oscuro";

  return (
    <header className="school-header">
      <div className="school-nav">
        <Link to="/" className="school-brand" onClick={() => setOpen(false)}>
          <img src="/escudo-bandera.webp" alt="" width="30" height="40" />
          <span>Innova Bandera<small>I.E. Bandera del Perú · Pisco</small></span>
        </Link>
        <nav id="school-navigation" aria-label="Navegación principal" className={open ? "school-links is-open" : "school-links"}>
          {menu.map(([path, label]) => <NavLink key={path} to={path} end={path === "/"} onClick={() => setOpen(false)}>{label}</NavLink>)}
          <button className="school-mobile-theme" type="button" onClick={() => setDarkMode(!darkMode)}>{themeLabel}</button>
        </nav>
        <div className="school-controls">
          <button className="school-icon" type="button" aria-label="Buscar en el portal" onClick={() => window.dispatchEvent(new CustomEvent("innova:command"))}><Search size={18} /></button>
          <button className="school-icon school-theme-control" type="button" aria-label={themeLabel} onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
          {currentUser
            ? <button className="school-account" onClick={logout} type="button">Salir</button>
            : <Link className="school-account" to="/login" onClick={() => setOpen(false)}>Acceder <ArrowUpRight size={14} /></Link>}
          <button className="school-icon school-menu" type="button" aria-label={open ? "Cerrar navegación" : "Abrir navegación"} aria-expanded={open} aria-controls="school-navigation" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
    </header>
  );
}
