import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { API_BASE } from "../utils/api.js";
import { dispatchToast } from "../components/Toast";

const AppContext = createContext();
const CACHE_KEY = "innova_db_cache";
const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
  } catch {
    /* quota o no storage disponible: ignoramos */
  }
}

export function AppContextProvider({ children }) {
  const [recursos, setRecursos] = useState([]);
  const [tutoriales, setTutoriales] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [evidencias, setEvidencias] = useState([]);

  // Client-specific settings kept in local browser
  const [favoritos, setFavoritos] = useState(() => {
    const local = localStorage.getItem("innova_favoritos");
    return local ? JSON.parse(local) : [];
  });

  const [darkMode, setDarkMode] = useState(() => {
    const local = localStorage.getItem("innova_dark_mode");
    return local === "true";
  });

  // --- SESSION AUTH STATES ---
  const [token, setToken] = useState(() => {
    return localStorage.getItem("innova_token") || null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const local = localStorage.getItem("innova_user");
    return local ? JSON.parse(local) : null;
  });

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

  // --- FETCH CENTRAL DATABASE FROM EXPRESS API (con cache, timeout, reintentos) ---
  const loadDatabase = useCallback(async ({ retries = 3, delayMs = 1500, force = false } = {}) => {
    if (!force) {
      const cached = readCache();
      if (cached) {
        setRecursos(cached.recursos || []);
        setTutoriales(cached.tutoriales || []);
        setNoticias(cached.noticias || []);
        setEvidencias(cached.evidencias || []);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    for (let attempt = 1; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const [resRec, resTut, resNot, resEvi] = await Promise.all([
          fetch(`${API_BASE}/api/recursos`, { signal: controller.signal }),
          fetch(`${API_BASE}/api/tutoriales`, { signal: controller.signal }),
          fetch(`${API_BASE}/api/noticias`, { signal: controller.signal }),
          fetch(`${API_BASE}/api/evidencias`, { signal: controller.signal }),
        ]);
        clearTimeout(timeoutId);

        if (resRec.status === 503 || resTut.status === 503 || resNot.status === 503 || resEvi.status === 503) {
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, delayMs * attempt));
            continue;
          }
          setIsLoading(false);
          return;
        }

        const [rec, tut, not, evi] = await Promise.all([
          resRec.ok ? resRec.json() : [],
          resTut.ok ? resTut.json() : [],
          resNot.ok ? resNot.json() : [],
          resEvi.ok ? resEvi.json() : [],
        ]);

        setRecursos(rec);
        setTutoriales(tut);
        setNoticias(not);
        setEvidencias(evi);
        writeCache({ recursos: rec, tutoriales: tut, noticias: not, evidencias: evi });
        setIsLoading(false);
        return;
      } catch {
        clearTimeout(timeoutId);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delayMs * attempt));
        }
      }
    }
    setIsLoading(false);
  }, []);

  // Cargar la base de datos al montar o al cambiar el token de autenticación.
  // En re-logins usa la cache si está vigente (< 5 min) para evitar 4 fetches innecesarios.
  const lastLoadedTokenRef = useRef(undefined);
  useEffect(() => {
    if (lastLoadedTokenRef.current === token) return;
    lastLoadedTokenRef.current = token;
    loadDatabase();
  }, [token, loadDatabase]);


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
        localStorage.setItem("innova_token", data.token);
        localStorage.setItem("innova_user", JSON.stringify(data.user));

        setToken(data.token);
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem("innova_token");
    localStorage.removeItem("innova_user");
    setToken(null);
    setCurrentUser(null);
  }, []);

  // --- AUTO-LOGOUT ON INACTIVITY (15 min) ---
  useEffect(() => {
    if (!token) return;
    let timeoutId;
    let lastReset = 0;
    const INACTIVITY_MS = 15 * 60 * 1000;
    const THROTTLE_MS = 30 * 1000;

    const triggerLogout = () => {
      logout();
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
  }, [token, logout]);

  // Helper auth headers
  const getAuthHeaders = useCallback(() => {
    const activeToken = token || localStorage.getItem("innova_token");
    return {
      "Content-Type": "application/json",
      ...(activeToken ? { "Authorization": `Bearer ${activeToken}` } : {})
    };
  }, [token]);

  // Interceptor para peticiones no autorizadas
  const handleApiResponse = useCallback(async (response) => {
    if (response.status === 401 || response.status === 403) {
      logout();
      dispatchToast({
        tone: "warning",
        title: "Sesión expirada",
        message: "Tu sesión ha expirado o no tienes permisos para esta acción. Por favor, inicia sesión de nuevo.",
        duration: 6000,
      });
      return false;
    }
    return true;
  }, [logout]);

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
  const exportData = useCallback(() => {
    const data = { recursos, tutoriales, noticias, evidencias };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `InnovaBandera_Respaldo_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [recursos, tutoriales, noticias, evidencias]);

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
      favoritos,
      darkMode,
      setDarkMode,
      token,
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
      exportData,
      importData,
      tutorialAccess,
      setTutorialAccess,
      isLoading,
      loadDatabase,
    }),
    [
      recursos,
      tutoriales,
      noticias,
      evidencias,
      favoritos,
      darkMode,
      token,
      currentUser,
      tutorialAccess,
      isLoading,
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
      exportData,
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