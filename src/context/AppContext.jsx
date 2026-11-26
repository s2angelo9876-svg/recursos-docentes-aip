import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { API_BASE } from "../utils/api.js";
import { dispatchToast } from "../components/Toast";
import { clearImageUrlCache } from "../services/imageUrl";

const AppContext = createContext();
const FETCH_TIMEOUT_MS = 8000;

export function AppContextProvider({ children }) {
  const [recursos, setRecursos] = useState([]);
  const [tutoriales, setTutoriales] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);

  // Client-specific settings kept in local browser
  const [favoritos, setFavoritos] = useState(() => {
    const local = localStorage.getItem("innova_favoritos");
    return local ? JSON.parse(local) : [];
  });

  const [darkMode, setDarkMode] = useState(() => {
    const local = localStorage.getItem("innova_dark_mode");
    return local === "true";
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const signedIn = Boolean(currentUser);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    for (const key of ["innova_token", "innova_user", "innova_db_cache"]) localStorage.removeItem(key);
    clearImageUrlCache();
    fetch(`${API_BASE}/api/auth/session`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active) setCurrentUser(data?.user ?? null); })
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); if (active) setSessionReady(true); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, []);

  const [tutorialAccess, setTutorialAccess] = useState(null);

  // Bandera para que la UI muestre skeletons durante la carga inicial
  const [isLoading, setIsLoading] = useState(true);

  // --- SYNC LOCAL CLIENT CONFIG ---
  useEffect(() => {
    localStorage.setItem("innova_favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  useEffect(() => {
    localStorage.setItem("innova_dark_mode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const [failedSections, setFailedSections] = useState([]);
  const loadSequence = useRef(0);

  const loadDatabase = useCallback(async ({ retries = 3, delayMs = 1500 } = {}) => {
    const sequence = ++loadSequence.current;
    const sections = [
      { key: "recursos", label: "recursos", set: setRecursos },
      { key: "tutoriales", label: "tutoriales", set: setTutoriales },
      { key: "noticias", label: "noticias", set: setNoticias },
      { key: "evidencias", label: "evidencias", set: setEvidencias },
      { key: "heroSlides", path: "hero-slides", label: "imágenes de portada", set: setHeroSlides },
    ];

    setIsLoading(true);
    let pending = sections.filter(({ key }) => key !== "recursos" || signedIn);
    for (let attempt = 1; attempt <= retries && pending.length; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const results = await Promise.allSettled(pending.map(async ({ key, path }) => {
        const response = await fetch(`${API_BASE}/api/${path || key}`, { signal: controller.signal });
        if (key === "recursos" && response.status === 401) {
          setCurrentUser(null);
          clearImageUrlCache();
          return [];
        }
        if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Respuesta inválida");
        return data;
      }));
      clearTimeout(timeout);
      if (sequence !== loadSequence.current) return;

      pending = pending.filter(({ set }, index) => {
        const result = results[index];
        if (result.status === "rejected") return true;
        set(result.value);
        return false;
      });

      if (pending.length && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        if (sequence !== loadSequence.current) return;
      }
    }

    setFailedSections(pending.map(({ label }) => label));
    setIsLoading(false);
  }, [signedIn]);

  useEffect(() => {
    if (sessionReady) loadDatabase();
  }, [sessionReady, loadDatabase]);

  // --- AUTHENTICATION METHODS ---
  const login = useCallback(async (usuario, contrasenia) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasenia })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        clearImageUrlCache();
        setCurrentUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Fallo al iniciar sesión." };
      }
    } catch (_err) {
      console.error("Login error:", _err);
      return { success: false, error: "Error de servidor en inicio de sesión." };
    }
  }, []);

  const register = useCallback(async (nombre, usuario, contrasenia, rol) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, usuario, contrasenia, rol })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error || "Fallo en el registro." };
      }
    } catch (_err) {
      console.error("Register error:", _err);
      return { success: false, error: "Error de servidor en el registro." };
    }
  }, []);

  const clearSession = useCallback(() => {
    loadSequence.current++;
    clearImageUrlCache();
    setRecursos([]);
    setCurrentUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/logout`, { method: "POST" });
      if (!response.ok && response.status !== 401) throw new Error("Error al cerrar sesión");
      clearSession();
      return true;
    } catch {
      dispatchToast({ tone: "error", message: "No se pudo cerrar la sesión. Vuelve a intentarlo." });
      return false;
    }
  }, [clearSession]);

  // --- AUTO-LOGOUT ON INACTIVITY (15 min) ---
  useEffect(() => {
    if (!signedIn) return;
    let timeoutId;
    let lastReset = 0;
    const INACTIVITY_MS = 15 * 60 * 1000;
    const THROTTLE_MS = 30 * 1000;

    const triggerLogout = async () => {
      if (!await logout()) return;
      dispatchToast({
        tone: "warning",
        title: "Sesión expirada",
        message: "Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo.",
        duration: 6000,
      });
    };

    const resetTimer = () => {
      const now = Date.now();
      if (now - lastReset < THROTTLE_MS) return;
      lastReset = now;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(triggerLogout, INACTIVITY_MS);
    };

    const events = ["mousedown", "keypress", "scroll", "touchstart"];
    events.forEach((event) =>
      document.addEventListener(event, resetTimer, { passive: true })
    );
    resetTimer();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => document.removeEventListener(event, resetTimer));
    };
  }, [signedIn, logout]);

  const getAuthHeaders = useCallback(() => ({ "Content-Type": "application/json" }), []);

  // Interceptor para peticiones no autorizadas
  const handleApiResponse = useCallback(async (response) => {
    if (response.status === 401) {
      clearSession();
      dispatchToast({
        tone: "warning",
        title: "Sesión expirada",
        message: "Tu sesión ha expirado. Inicia sesión de nuevo.",
        duration: 6000,
      });
      return false;
    }
    return true;
  }, [clearSession]);

  // --- CRUD ACTIONS FOR RECURSOS ---
  const addRecurso = useCallback(async (item) => {
    try {
      const response = await fetch(`${API_BASE}/api/recursos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
      if (!(await handleApiResponse(response))) return { success: false, error: "Sin autorización." };
      if (!response.ok) {
        let detail = `Error ${response.status}`;
        try { const b = await response.json(); if (b?.error) detail = b.error; } catch { /* ignore */ }
        return { success: false, error: detail };
      }
      const newItem = await response.json();
      setRecursos((prev) => [newItem, ...prev]);
      return { success: true, data: newItem };
    } catch (err) {
      console.error("Error al agregar recurso:", err);
      return { success: false, error: err?.message || "Error de red." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  const updateRecurso = useCallback(async (id, updatedItem) => {
    try {
      const response = await fetch(`${API_BASE}/api/recursos/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedItem),
      });
      if (!(await handleApiResponse(response))) return { success: false, error: "Sin autorización." };
      if (!response.ok) {
        let detail = `Error ${response.status}`;
        try { const b = await response.json(); if (b?.error) detail = b.error; } catch { /* ignore */ }
        return { success: false, error: detail };
      }
      setRecursos((prev) =>
        prev.map((item) => (String(item.id) === String(id) ? { ...updatedItem, id } : item))
      );
      return { success: true };
    } catch (err) {
      console.error("Error al editar recurso:", err);
      return { success: false, error: err?.message || "Error de red." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  const deleteRecurso = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/recursos/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (await handleApiResponse(response)) {
        if (response.ok) {
          setRecursos((prev) => prev.filter((item) => String(item.id) !== String(id)));
          setFavoritos((prev) => prev.filter((favId) => String(favId) !== String(id)));
          return { success: true };
        }
        return { success: false, error: `Error ${response.status}` };
      }
      return { success: false, error: "Sin autorización." };
    } catch (err) {
      console.error("Error al eliminar recurso:", err);
      return { success: false, error: err?.message || "Error de red." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  const toggleFavorito = useCallback((id) => {
    setFavoritos((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  }, []);

  // --- CRUD ACTIONS FOR TUTORIALES ---
  const addTutorial = useCallback(async (item) => {
    try {
      const response = await fetch(`${API_BASE}/api/tutoriales`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
      if (!(await handleApiResponse(response))) return { success: false, error: "Sin autorización." };
      if (!response.ok) {
        let detail = `Error ${response.status}`;
        try { const b = await response.json(); if (b?.error) detail = b.error; } catch { /* ignore */ }
        return { success: false, error: detail };
      }
      const newItem = await response.json();
      setTutoriales((prev) => [newItem, ...prev]);
      return { success: true, data: newItem };
    } catch (err) {
      console.error("Error al agregar tutorial:", err);
      return { success: false, error: err?.message || "Error de red." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  const updateTutorial = useCallback(async (id, updatedItem) => {
    try {
      const response = await fetch(`${API_BASE}/api/tutoriales/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedItem),
      });
      if (!(await handleApiResponse(response))) return { success: false, error: "Sin autorización." };
      if (!response.ok) {
        let detail = `Error ${response.status}`;
        try { const b = await response.json(); if (b?.error) detail = b.error; } catch { /* ignore */ }
        return { success: false, error: detail };
      }
      setTutoriales((prev) =>
        prev.map((item) => (String(item.id) === String(id) ? { ...updatedItem, id } : item))
      );
      return { success: true };
    } catch (err) {
      console.error("Error al editar tutorial:", err);
      return { success: false, error: err?.message || "Error de red." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  const deleteTutorial = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/tutoriales/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (await handleApiResponse(response)) {
        if (response.ok) {
          setTutoriales((prev) => prev.filter((item) => String(item.id) !== String(id)));
          return { success: true };
        }
        return { success: false, error: `Error ${response.status}` };
      }
      return { success: false, error: "Sin autorización." };
    } catch (err) {
      console.error("Error al eliminar tutorial:", err);
      return { success: false, error: err?.message || "Error de red." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  // --- CRUD ACTIONS FOR NOTICIAS ---
  const addNoticia = useCallback(async (item) => {
    try {
      const response = await fetch(`${API_BASE}/api/noticias`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
      if (!(await handleApiResponse(response))) return { success: false, error: "Sin autorización." };
      if (!response.ok) {
        let detail = `Error ${response.status}`;
        try { const b = await response.json(); if (b?.error) detail = b.error; } catch { /* ignore */ }
        return { success: false, error: detail };
      }
      const newItem = await response.json();
      setNoticias((prev) => [newItem, ...prev]);
      return { success: true, data: newItem };
    } catch (err) {
      console.error("Error al publicar comunicado:", err);
      return { success: false, error: err?.message || "Error de red." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  const updateNoticia = useCallback(async (id, updatedItem) => {
    try {
      const response = await fetch(`${API_BASE}/api/noticias/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedItem),
      });
      if (!(await handleApiResponse(response))) return { success: false, error: "Sin autorización." };
      if (!response.ok) {
        let detail = `Error ${response.status}`;
        try { const b = await response.json(); if (b?.error) detail = b.error; } catch { /* ignore */ }
        return { success: false, error: detail };
      }
      setNoticias((prev) =>
        prev.map((item) => (String(item.id) === String(id) ? { ...updatedItem, id } : item))
      );
      return { success: true };
    } catch (err) {
      console.error("Error al editar comunicado:", err);
      return { success: false, error: err?.message || "Error de red." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  const deleteNoticia = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/noticias/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (await handleApiResponse(response)) {
        if (response.ok) {
          setNoticias((prev) => prev.filter((item) => String(item.id) !== String(id)));
          return { success: true };
        }
        return { success: false, error: `Error ${response.status}` };
      }
      return { success: false, error: "Sin autorización." };
    } catch (err) {
      console.error("Error al eliminar comunicado:", err);
      return { success: false, error: err?.message || "Error de red." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  // --- CRUD ACTIONS FOR EVIDENCIAS ---
  const addEvidencia = useCallback(async (item) => {
    try {
      const response = await fetch(`${API_BASE}/api/evidencias`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
      if (!(await handleApiResponse(response))) {
        return { success: false, error: "Sin autorización para crear la evidencia." };
      }
      if (!response.ok) {
        let detail = `Error ${response.status}`;
        try {
          const body = await response.json();
          if (body?.error) detail = body.error;
        } catch { /* ignore */ }
        return { success: false, error: detail };
      }
      const newItem = await response.json();
      setEvidencias((prev) => [newItem, ...prev]);
      return { success: true, data: newItem };
    } catch (err) {
      console.error("Error al agregar evidencia:", err);
      return { success: false, error: err?.message || "Error de red al guardar." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  const updateEvidencia = useCallback(async (id, updatedItem) => {
    try {
      const response = await fetch(`${API_BASE}/api/evidencias/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedItem),
      });
      if (!(await handleApiResponse(response))) {
        return { success: false, error: "Sin autorización para editar la evidencia." };
      }
      if (!response.ok) {
        let detail = `Error ${response.status}`;
        try {
          const body = await response.json();
          if (body?.error) detail = body.error;
        } catch { /* ignore */ }
        return { success: false, error: detail };
      }
      setEvidencias((prev) =>
        prev.map((item) => (String(item.id) === String(id) ? { ...updatedItem, id } : item))
      );
      return { success: true };
    } catch (err) {
      console.error("Error al editar evidencia:", err);
      return { success: false, error: err?.message || "Error de red al guardar." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  const deleteEvidencia = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/evidencias/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (await handleApiResponse(response)) {
        if (response.ok) {
          setEvidencias((prev) => prev.filter((item) => String(item.id) !== String(id)));
          return { success: true };
        }
        return { success: false, error: `Error ${response.status}` };
      }
      return { success: false, error: "Sin autorización." };
    } catch (err) {
      console.error("Error al eliminar evidencia:", err);
      return { success: false, error: err?.message || "Error de red." };
    }
  }, [getAuthHeaders, handleApiResponse]);

  // --- EXPORT AND IMPORT DATABASE ---
  const importData = useCallback(async (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      const response = await fetch(`${API_BASE}/api/import`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(parsed),
      });
      if (await handleApiResponse(response)) {
        if (response.ok) {
          await loadDatabase({ force: true });
          return { success: true };
        }
      }
      return { success: false, error: "Fallo en el servidor al procesar la base de datos." };
    } catch (_err) {
      console.error("Error al importar datos:", _err);
      return { success: false, error: _err.message };
    }
  }, [loadDatabase, getAuthHeaders, handleApiResponse]);

    const value = useMemo(
    () => ({
      recursos,
      tutoriales,
      noticias,
      evidencias,
      heroSlides,
      favoritos,
      darkMode,
      setDarkMode,
      sessionReady,
      currentUser,
      login,
      register,
      logout,
      addRecurso,
      updateRecurso,
      deleteRecurso,
      toggleFavorito,
      addTutorial,
      updateTutorial,
      deleteTutorial,
      addNoticia,
      updateNoticia,
      deleteNoticia,
      addEvidencia,
      updateEvidencia,
      deleteEvidencia,
      importData,
      tutorialAccess,
      setTutorialAccess,
      isLoading,
      failedSections,
      loadDatabase,
    }),
    [
      recursos,
      tutoriales,
      noticias,
      evidencias,
      heroSlides,
      favoritos,
      darkMode,
      sessionReady,
      currentUser,
      tutorialAccess,
      isLoading,
      failedSections,
      login,
      register,
      logout,
      addRecurso,
      updateRecurso,
      deleteRecurso,
      toggleFavorito,
      addTutorial,
      updateTutorial,
      deleteTutorial,
      addNoticia,
      updateNoticia,
      deleteNoticia,
      addEvidencia,
      updateEvidencia,
      deleteEvidencia,
      importData,
      loadDatabase,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp debe usarse dentro de un AppContextProvider");
  }
  return context;
}