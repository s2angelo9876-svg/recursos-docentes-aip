import { Link, useSearchParams } from "react-router-dom";
import { useModalFocus } from "../hooks/useModalFocus";
import { csvCell } from "../../shared/csv";
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useApp } from "../context/AppContext";
import { API_BASE } from "../utils/api.js";
import Repositorio from "./Repositorio";
import Tutoriales from "./Tutoriales";
import Noticias from "./Noticias";
import AdminModal from "./AdminModal";
import ConfirmModal from "./ConfirmModal";
import HeroSlidesManager from "./HeroSlidesManager";

const AuditoriaPanel = lazy(() => import("./AuditoriaPanel"));

const SECTIONS = [
  ["resumen", "Resumen", "fa-chart-simple"],
  ["recursos", "Recursos", "fa-book-open"],
  ["tutoriales", "Tutoriales", "fa-circle-play"],
  ["noticias", "Comunicados", "fa-bullhorn"],
  ["usuarios", "Usuarios", "fa-users"],
  ["hero", "Portada", "fa-image"],
  ["auditoria", "Auditoría", "fa-shield-halved"],
];

export default function AdminPanel() {
  const {
    recursos,
    tutoriales,
    noticias,
    importData,
    currentUser,
    register,
    deleteRecurso,
    deleteTutorial,
  } = useApp();

  const [params] = useSearchParams();
  const [activeSubTab, activeLabel] = SECTIONS.find(([key]) => key === params.get("seccion")) || SECTIONS[0];
  const [confirmation, setConfirmation] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState("recursos");
  const [importStatus, setImportStatus] = useState("");

  // User Management State
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formNombre, setFormNombre] = useState("");
  const [formUsuario, setFormUsuario] = useState("");
  const [formContrasenia, setFormContrasenia] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);
  const excelInputRef = useRef(null);

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        headers: {
          "Content-Type": "application/json",

        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (_err) {
      console.error("Error al obtener usuarios:", _err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (activeSubTab === "usuarios") {
      fetchUsuarios();
    }
  }, [activeSubTab, fetchUsuarios]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formNombre || !formUsuario || !formContrasenia) {
      setUserError("Todos los campos son obligatorios.");
      return;
    }
    if (formContrasenia.length < 12) {
      setUserError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }
    try {
      setCreatingUser(true);
      setUserError("");
      setUserSuccess("");
      // El rol se define fijamente en "Docente" a petición del usuario
      const res = await register(formNombre, formUsuario, formContrasenia, "Docente");
      if (res.success) {
        setUserSuccess(`Usuario docente "${formUsuario}" creado con éxito.`);
        setFormNombre("");
        setFormUsuario("");
        setFormContrasenia("");
        fetchUsuarios();
      } else {
        setUserError(res.error || "No se pudo crear el usuario.");
      }
    } catch {
      setUserError("Error de conexión al crear usuario.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    try {
      setImportingExcel(true);
      setUserError("");
      setUserSuccess("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/docentes/bulk-upload`, {
        method: "POST",
        headers: {

        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        let msg = `Carga masiva finalizada. Creados: ${data.insertedCount}`;
        if (data.duplicateCount > 0) {
          msg += `, Omitidos por duplicado: ${data.duplicateCount}`;
        }
        if (data.invalidCount > 0) {
          msg += `, Omitidos por error: ${data.invalidCount}`;
        }
        setUserSuccess(msg);
        fetchUsuarios();
      } else {
        setUserError(data.error || "Ocurrió un error al procesar el archivo Excel.");
      }
    } catch (_err) {
      setUserError("Error de conexión al cargar el archivo Excel.");
      console.error(_err);
    } finally {
      setImportingExcel(false);
    }
  };

  const handleDeleteUser = async (userId, userUsername) => {
    if (userUsername === currentUser?.usuario) {
      setUserError("No puedes eliminar tu propia cuenta.");
      return;
    }
    try {
      setUserError("");
      setUserSuccess("");
      const response = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",

        }
      });
      if (response.ok) {
        setUserSuccess(`Usuario "${userUsername}" eliminado con éxito.`);
        fetchUsuarios();
      } else {
        const data = await response.json();
        setUserError(data.error || "Error al eliminar usuario.");
      }
    } catch {
      setUserError("Error de conexión al eliminar usuario.");
    }
  };

  const [editingPasswordUser, setEditingPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const closePassword = () => {
    setEditingPasswordUser(null);
    setNewPassword("");
    setPassError("");
    setPassSuccess("");
    setShowPass(false);
    setShowNewPass(false);
  };
  const passwordDialog = useModalFocus(Boolean(editingPasswordUser), {
    onClose: savingPass ? undefined : closePassword,
    initialFocus: "[data-password-field]",
  });

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setPassError("La nueva contraseña no puede estar vacía.");
      return;
    }
    if (newPassword.length < 12) {
      setPassError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }
    try {
      setSavingPass(true);
      setPassError("");
      setPassSuccess("");
      const response = await fetch(`${API_BASE}/api/auth/users/${editingPasswordUser.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",

        },
        body: JSON.stringify({ contrasenia: newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setPassSuccess(`Contraseña cambiada con éxito para "${editingPasswordUser.usuario}".`);
        setNewPassword("");
        setTimeout(() => {
          setEditingPasswordUser(null);
          setPassSuccess("");
        }, 1500);
      } else {
        setPassError(data.error || "No se pudo actualizar la contraseña.");
      }
    } catch {
      setPassError("Error al intentar cambiar la contraseña.");
    } finally {
      setSavingPass(false);
    }
  };

  const generateServerBackup = async () => {
    try {
      setImportStatus("Preparando respaldo…");
      const response = await fetch(`${API_BASE}/api/admin/backup`, { method: "POST" });
      if (!response.ok) throw new Error("No se pudo descargar el respaldo.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `innova-bandera-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setImportStatus("Respaldo descargado.");
    } catch (error) {
      setImportStatus(error.message);
    }

  };

  const isInvitado = currentUser?.rol === "Invitado";

  if (isInvitado) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl shadow-lg text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto text-lg">
          <i className="fas fa-lock"></i>
        </div>
        <h3 className="font-bold text-base text-gray-950 dark:text-white uppercase">Acceso Restringido</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
          Los usuarios invitados solo pueden visualizar contenido.
        </p>
      </div>
    );
  }

  const handleOpenAdd = (type) => {
    setModalType(type);
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleImportFile = (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setConfirmation({
      title: "¿Restaurar el catálogo?",
      label: `“${file.name}” reemplazará los recursos, tutoriales, comunicados y evidencias del catálogo.`,
      confirmText: "Restaurar",
      action: async () => {
        try {
          const result = await importData(await file.text());
          setImportStatus(result.success ? "Catálogo restaurado." : result.error);
        } catch {
          setImportStatus("No se pudo leer el archivo seleccionado.");
        }
      },
    });
  };

  function downloadCsv(name, headers, rows) {
    const content = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `innova-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const exportResourcesToCSV = () => downloadCsv(
    "recursos", ["ID", "Título", "Área", "Grados", "Tipo", "Descripción", "URL"],
    recursos.map((r) => [r.id, r.titulo, r.area, r.grados?.join(", "), r.tipo, r.desc, r.url]),
  );

  const exportTutorialesToCSV = () => downloadCsv(
    "tutoriales", ["ID", "Título", "Área", "Descripción", "URL", "Audiencia"],
    tutoriales.map((p) => [p.id, p.titulo, p.area, p.desc, p.url, p.audiencia || "ambos"]),
  );

  return (
    <div className="admin-workspace">
      <aside className="admin-sidebar">
        <p>Gestión del portal</p>
        <nav aria-label="Secciones de administración">
          {SECTIONS.map(([key, label, icon]) => (
            <Link key={key} to={{ search: key === "resumen" ? "" : `?seccion=${key}` }} aria-current={key === activeSubTab ? "page" : undefined}>
              <i className={`fas ${icon}`} aria-hidden="true" /> {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="admin-content">
        <header className="admin-heading">
          <div>
            <p className="school-kicker">Administración</p>
            <h1>{activeSubTab === "resumen" ? "Panel de administración" : activeLabel}</h1>
          </div>
          {activeSubTab === "resumen" && <div className="admin-backup">
            <button type="button" className="school-secondary" onClick={generateServerBackup}>Descargar respaldo</button>
            <label className="school-secondary">Restaurar catálogo<input className="sr-only" type="file" accept=".json" aria-label="Importar respaldo del catálogo" onChange={handleImportFile} /></label>
          </div>}
        </header>
        {importStatus && <p className="admin-message" role="status">{importStatus}</p>}
        {activeSubTab === "resumen" && (
          <>
            <div className="admin-metrics">
              {[
                ["recursos", "Recursos", recursos.length],
                ["tutoriales", "Tutoriales", tutoriales.length],
                ["noticias", "Comunicados", noticias.length],
              ].map(([key, label, total]) => <Link key={key} to={{ search: `?seccion=${key}` }}><span>{label}</span><strong>{total}</strong><i className="fas fa-arrow-right" aria-hidden="true" /></Link>)}
            </div>
            <section className="admin-tools">
              <div><h2>Publicar contenido</h2><button type="button" onClick={() => handleOpenAdd("recursos")}>Nuevo recurso <i className="fas fa-plus" aria-hidden="true" /></button><button type="button" onClick={() => handleOpenAdd("tutoriales")}>Nuevo tutorial <i className="fas fa-plus" aria-hidden="true" /></button><button type="button" onClick={() => handleOpenAdd("noticias")}>Nuevo comunicado <i className="fas fa-plus" aria-hidden="true" /></button></div>
              <div><h2>Exportar catálogo</h2><button type="button" onClick={exportResourcesToCSV}>Recursos en CSV <i className="fas fa-download" aria-hidden="true" /></button><button type="button" onClick={exportTutorialesToCSV}>Tutoriales en CSV <i className="fas fa-download" aria-hidden="true" /></button></div>
            </section>
          </>
        )}
      {/* Adding buttons */}
      {["recursos", "tutoriales", "noticias"].includes(activeSubTab) && (
        <div className="flex justify-end">
          <button
            onClick={() => handleOpenAdd(activeSubTab)}
            className="school-button"
          >
            <i className="fas fa-plus text-[11px]" />
            {({ recursos: "Nuevo recurso", tutoriales: "Nuevo tutorial", noticias: "Nuevo comunicado" })[activeSubTab]}
          </button>
        </div>
      )}

      {/* Render Lists with Admin controls */}
      <div>
        {activeSubTab === "recursos" && (
          <Repositorio
            isAdminMode={true}
            onEditClick={(item) => handleOpenEdit("recursos", item)}
            onDeleteClick={(item) => setConfirmation({ label: item.titulo, action: () => deleteRecurso(item.id) })}
          />
        )}
        {activeSubTab === "tutoriales" && (
          <Tutoriales
            isAdminMode={true}
            onEditClick={(item) => handleOpenEdit("tutoriales", item)}
            onDeleteClick={(item) => setConfirmation({ label: item.titulo, action: () => deleteTutorial(item.id) })}
          />
        )}
        {activeSubTab === "noticias" && (
          <Noticias
            isAdminMode={true}
            onEditClick={(item) => handleOpenEdit("noticias", item)}
          />
        )}
        {activeSubTab === "hero" && <HeroSlidesManager />}
        {activeSubTab === "auditoria" && (
          <Suspense fallback={<p role="status" className="p-4 text-ink-subtle">Cargando auditoría…</p>}>
            <AuditoriaPanel />
          </Suspense>
        )}
        {activeSubTab === "usuarios" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Form Column */}
            <div className="school-content-card min-w-0 h-fit p-5">
              <h2 className="school-card-title mb-4">Registrar docente</h2>

              {userError && (
                <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                  <i className="fas fa-exclamation-circle flex-shrink-0"></i>
                  <span>{userError}</span>
                </div>
              )}

              {userSuccess && (
                <div role="status" className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-250 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <i className="fas fa-check-circle flex-shrink-0"></i>
                  <span>{userSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="teacher-name" className="text-[13px] font-semibold text-ink-subtle">
                    Nombre completo
                  </label>
                  <input
                    id="teacher-name"
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    className="school-field"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="teacher-username" className="text-[13px] font-semibold text-ink-subtle">
                    Usuario
                  </label>
                  <input
                    id="teacher-username"
                    type="text"
                    required
                    placeholder="Ej. jperez"
                    className="school-field"
                    value={formUsuario}
                    onChange={(e) => setFormUsuario(e.target.value.toLowerCase().trim())}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="teacher-password" className="text-[13px] font-semibold text-ink-subtle">
                    Contraseña inicial
                  </label>
                  <div className="relative">
                    <input
                      id="teacher-password"
                      type={showPass ? "text" : "password"}
                      required
                      placeholder="Mínimo 12 caracteres"
                      className="school-field school-field-with-action"
                      autoComplete="new-password"
                      minLength={12}
                      value={formContrasenia}
                      onChange={(e) => setFormContrasenia(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={showPass ? "Ocultar contraseña inicial" : "Mostrar contraseña inicial"}
                      onClick={() => setShowPass(!showPass)}
                      className="school-icon absolute right-0 top-0"
                    >
                      <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingUser}
                  className="school-button w-full disabled:opacity-50"
                >
                  {creatingUser ? (
                    <><i className="fas fa-spinner fa-spin"></i> Registrando...</>
                  ) : (
                    <><i className="fas fa-plus-circle" aria-hidden="true" /> Registrar docente</>
                  )}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-150 dark:border-dark-border"></div>
                  <span className="flex-shrink mx-3 text-[12px] text-ink-subtle">o</span>
                  <div className="flex-grow border-t border-gray-150 dark:border-dark-border"></div>
                </div>

                <input
                  type="file"
                  ref={excelInputRef}
                  onChange={handleExcelUpload}
                  accept=".xlsx, .csv"
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={importingExcel}
                  onClick={() => excelInputRef.current?.click()}
                  className="school-secondary w-full"
                >
                  {importingExcel ? (
                    <><i className="fas fa-spinner fa-spin text-primary dark:text-dark-accent"></i> Procesando...</>
                  ) : (
                    <><i className="fas fa-file-excel text-emerald-600"></i> Importar desde Excel</>
                  )}
                </button>
              </form>
            </div>

            {/* List Column */}
            <div className="school-content-card min-w-0 lg:col-span-2 p-5">
              <h2 className="school-card-title mb-4">Usuarios registrados</h2>

              {loadingUsers ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  <i className="fas fa-spinner fa-spin mr-2"></i> Cargando usuarios...
                </div>
              ) : usuarios.length > 0 ? (
                <div role="region" aria-label="Lista de usuarios" tabIndex={0} className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-150 dark:border-dark-border text-[10px] font-black uppercase text-ink-subtle tracking-wider">
                        <th className="pb-3 pl-2">Nombre</th>
                        <th className="pb-3">Usuario</th>
                        <th className="pb-3">Rol</th>
                        <th className="pb-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-border text-xs">
                      {usuarios.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-border/20 transition-colors">
                          <td className="py-3 pl-2 font-bold text-gray-800 dark:text-gray-200">
                            {user.nombre}
                          </td>
                          <td className="py-3 font-semibold text-gray-500 dark:text-gray-400">
                            {user.usuario}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${user.rol === "Administrador"
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                                : user.rol === "Docente"
                                  ? "bg-primary-50 text-primary-700 dark:bg-dark-elev dark:text-primary-100"
                                  : "bg-surface-sunk text-ink dark:bg-dark-elev dark:text-white"
                              }`}>
                              {user.rol}
                            </span>
                          </td>
                          <td className="py-3 text-center flex items-center justify-center gap-1.5">
                            {user.rol !== "Administrador" && (
                              <button
                                onClick={() => setEditingPasswordUser(user)}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors cursor-pointer"
                                title="Cambiar Contraseña"
                              >
                                <i className="fas fa-key text-[10px]"></i>
                              </button>
                            )}
                            {user.usuario !== currentUser?.usuario ? (
                              <button
                                onClick={() => setConfirmation({ label: user.usuario, action: () => handleDeleteUser(user.id, user.usuario) })}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar usuario"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            ) : (
                              <span className="text-[10px] text-ink-subtle font-semibold italic">
                                Fijo
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  No hay usuarios registrados.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para ver datos y editar contraseña */}
      {editingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div ref={passwordDialog} role="dialog" aria-modal="true" aria-label="Editar contraseña" tabIndex={-1} className="bg-white dark:bg-dark-card border border-gray-250 dark:border-dark-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
            {/* Top decorative bar */}
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>

            <div className="p-6 relative">
              <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                <i className="fas fa-user-cog text-amber-500"></i>
                Detalles del Usuario y Contraseña
              </h3>

              {passError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                  <i className="fas fa-exclamation-circle flex-shrink-0"></i>
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-250 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <i className="fas fa-check-circle flex-shrink-0"></i>
                  <span>{passSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Info Fields (Read Only) */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-dark-border/30 p-3.5 rounded-xl border border-gray-150 dark:border-dark-border">
                  <div>
                    <span className="text-[9px] font-black uppercase text-ink-subtle block">Nombre Completo</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate block">{editingPasswordUser.nombre}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-ink-subtle block">Usuario</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate block">@{editingPasswordUser.usuario}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] font-black uppercase text-ink-subtle block">Rol</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">{editingPasswordUser.rol}</span>
                  </div>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 border-t border-gray-150 dark:border-dark-border">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-ink-subtle tracking-wider">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        required
                        data-password-field
                        placeholder="Cambiar a una nueva (mínimo 12 caracteres)"
                        className="w-full pl-3.5 pr-10 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl text-xs text-gray-800 dark:text-gray-100 placeholder-gray-450 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-accent transition-all"
                        aria-label="Nueva contraseña"
                        autoComplete="new-password"
                        minLength={12}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={showNewPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-ink-subtle hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                      >
                        <i className={`fas ${showNewPass ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closePassword}
                      disabled={savingPass}
                      className="flex-1 py-2 bg-gray-50 dark:bg-dark-border border border-gray-250 dark:border-dark-border text-gray-500 dark:text-gray-400 rounded-xl text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-dark-hover transition-all cursor-pointer animate-none"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={savingPass}
                      className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {savingPass ? (
                        <><i className="fas fa-spinner fa-spin"></i> Guardando...</>
                      ) : (
                        <><i className="fas fa-save"></i> Guardar</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>

      <ConfirmModal
        open={Boolean(confirmation)}
        title={confirmation?.title ?? "¿Eliminar este elemento?"}
        message={confirmation?.label}
        confirmText={confirmation?.confirmText ?? "Eliminar"}
        loading={confirming}
        onClose={() => setConfirmation(null)}
        onConfirm={async () => {
          setConfirming(true);
          try { await confirmation.action(); }
          finally {
            setConfirming(false);
            setConfirmation(null);
          }
        }}
      />

      {/* Render Unified Modal for CMS actions (replaces duplicate modals) */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        editingItem={editingItem}
      />
    </div>
  );
}
