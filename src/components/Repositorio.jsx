import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, BookOpen, Bookmark, Search, SlidersHorizontal, X } from "lucide-react";
import { storageLink } from "../services/imageUrl";
import { useApp } from "../context/AppContext";
import { useModalFocus } from "../hooks/useModalFocus";
import { SkeletonFilterBar, SkeletonGrid } from "./Skeleton";

const grades = ["1.° Sec", "2.° Sec", "3.° Sec", "4.° Sec", "5.° Sec"];
const filterKeys = ["q", "area", "grado", "tipo", "favoritos"];
const pageSize = 9;
const normalize = (value) => String(value ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function ResourceDetail({ resource, close }) {
  const modal = useModalFocus(Boolean(resource), { onClose: close });
  if (!resource) return null;
  const materials = resource.contenidos?.length ? resource.contenidos : [{ titulo: resource.titulo, url: resource.url }];
  const links = materials.map((material) => ({ ...material, href: storageLink(material.url) })).filter(({ href }) => href);
  return (
    <div className="library-overlay" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={modal} role="dialog" aria-modal="true" aria-labelledby="library-detail-title" tabIndex={-1} className="library-detail">
        <button type="button" aria-label="Cerrar ficha" onClick={close} className="school-icon library-close"><X size={21} /></button>
        <p className="school-kicker">{resource.area}</p>
        <h2 id="library-detail-title">{resource.titulo}</h2>
        <p className="library-detail-meta">{[resource.tipo, ...(resource.grados || [])].join(" · ")}</p>
        <p>{resource.desc}</p>
        <h3>Materiales</h3>
        {links.length ? <ul>{links.map(({ titulo, href, tipo }, i) => (
          <li key={i}><a href={href} target="_blank" rel="noopener noreferrer"><span>{titulo}<small>{tipo === "archivo" ? "Abrir archivo" : "Abrir enlace externo"}</small></span>{tipo === "archivo" ? <ArrowDownToLine size={18} /> : <ArrowUpRight size={18} />}</a></li>
        ))}</ul> : <p>Este recurso todavía no tiene materiales disponibles.</p>}
      </div>
    </div>
  );
}

export default function Repositorio({ isAdminMode = false, onEditClick, onDeleteClick }) {
  const { recursos, favoritos, toggleFavorito, isLoading } = useApp();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const q = params.get("q") || "";
  const area = params.get("area") || "";
  const grade = params.get("grado") || "";
  const type = params.get("tipo") || "";
  const saved = params.get("favoritos") === "1";
  const count = [area, grade, type, saved].filter(Boolean).length;
  const selected = recursos.find((resource) => String(resource.id) === params.get("ficha"));
  const areas = [...new Set(recursos.map(({ area }) => area).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const types = [...new Set(recursos.map(({ tipo }) => tipo).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const query = normalize(q.trim());
  const filtered = recursos.filter((resource) =>
    (!area || resource.area === area) &&
    (!grade || resource.grados?.includes(grade)) &&
    (!type || resource.tipo === type) &&
    (!saved || favoritos.includes(resource.id)) &&
    normalize([resource.titulo, resource.area, resource.desc].join(" ")).includes(query),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number(params.get("pagina") || 1);
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, Math.min(requestedPage, pageCount)) : 1;

  function change(key, value, replace = false) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      if (filterKeys.includes(key)) next.delete("pagina");
      return next;
    }, { replace });
  }

  function reset() {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      [...filterKeys, "pagina"].forEach((key) => next.delete(key));
      return next;
    });
  }

  if (isLoading && !recursos.length) return <div aria-busy="true" className="space-y-5"><SkeletonFilterBar /><SkeletonGrid items={6} /></div>;

  return (
    <div className="library">
      <div className="library-search">
        <label><Search size={20} aria-hidden="true" /><input type="search" aria-label="Buscar recursos" placeholder="Busca por tema, título o área" value={q} onChange={(e) => change("q", e.target.value, true)} /></label>
        <button type="button" className="school-secondary library-mobile-filter" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={17} /> Filtros{count ? ` (${count})` : ""}</button>
      </div>
      <div className="library-layout">
        <aside className={showFilters ? "library-filters is-open" : "library-filters"} aria-label="Filtros de la biblioteca">
          <h2><SlidersHorizontal size={16} aria-hidden="true" /> Filtros</h2>
          {[["Área curricular", "area", area, areas], ["Grado", "grado", grade, grades], ["Formato", "tipo", type, types]].map(([label, key, value, options]) => (
            <label key={key}>{label}<select value={value} onChange={(e) => change(key, e.target.value)}><option value="">Todos</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
          ))}
          <label className="library-check"><input type="checkbox" checked={saved} onChange={(e) => change("favoritos", e.target.checked ? "1" : "")} /> Solo favoritos</label>
          {(q || count > 0) && <button type="button" className="school-text-link" onClick={reset}>Limpiar filtros</button>}
        </aside>
        <section className="library-results" aria-labelledby="library-results-title">
          <h2 id="library-results-title" className="sr-only">Resultados de la biblioteca</h2>
          <div className="library-results-heading"><p role="status">{filtered.length} {filtered.length === 1 ? "recurso" : "recursos"}</p>{(area || grade || type || saved) && <div>{[area, grade, type, saved && "Favoritos"].filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div>}</div>
          {filtered.length ? <div className="library-cards">{filtered.slice((page - 1) * pageSize, page * pageSize).map((resource) => {
            const favorite = favoritos.includes(resource.id);
            return (
              <article className="library-card" key={resource.id}>
                <div className="library-card-top"><span><BookOpen size={15} aria-hidden="true" /> {resource.area}</span><button type="button" className="school-icon" aria-label={favorite ? "Quitar de favoritos" : "Añadir a favoritos"} aria-pressed={favorite} onClick={() => toggleFavorito(resource.id)}><Bookmark size={19} fill={favorite ? "currentColor" : "none"} /></button></div>
                <h3><button type="button" onClick={() => change("ficha", resource.id)}>{resource.titulo}</button></h3>
                <p>{resource.desc}</p>
                <div className="library-card-meta"><span>{resource.tipo}</span>{resource.grados?.slice(0, 2).map((item) => <span key={item}>{item}</span>)}{resource.grados?.length > 2 && <span>+{resource.grados.length - 2}</span>}</div>
                <div className="library-card-actions"><button type="button" className="school-text-link" onClick={() => change("ficha", resource.id)}>Ver ficha <ArrowRight size={15} /></button>
                  {isAdminMode && <div>{onEditClick && <button type="button" aria-label={`Editar ${resource.titulo}`} onClick={() => onEditClick(resource)}><i className="fas fa-pen" aria-hidden="true" /></button>}{onDeleteClick && <button type="button" aria-label={`Eliminar ${resource.titulo}`} onClick={() => onDeleteClick(resource)}><i className="fas fa-trash" aria-hidden="true" /></button>}</div>}
                </div>
              </article>
            );
          })}</div> : <div className="library-empty"><BookOpen size={28} aria-hidden="true" /><h3>{saved ? "No hay favoritos para esta selección" : "No encontramos recursos"}</h3><p>Prueba con otra búsqueda o ajusta los filtros.</p>{(q || count > 0) && <button type="button" className="school-secondary" onClick={reset}>Limpiar filtros</button>}</div>}
          {pageCount > 1 && <nav aria-label="Paginación de recursos" className="library-pagination"><button type="button" className="school-secondary" disabled={page === 1} onClick={() => change("pagina", page - 1)}>Anterior</button><span>Página {page} de {pageCount}</span><button type="button" className="school-secondary" disabled={page === pageCount} onClick={() => change("pagina", page + 1)}>Siguiente</button></nav>}
        </section>
      </div>
      <ResourceDetail resource={selected} close={() => change("ficha", null, true)} />
    </div>
  );
}
