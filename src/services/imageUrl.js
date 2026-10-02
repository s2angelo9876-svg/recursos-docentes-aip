import { API_BASE } from "../utils/api.js";

const CACHE_PREFIX = "signed_img_";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min en sessionStorage

// Detecta si una URL apunta a Supabase Storage público.
// Patrones: https://xxx.supabase.co/storage/v1/object/public/<bucket>/<path>
//           https://xxx.supabase.co/storage/v1/object/sign/<bucket>/<path>?token=...
//           /storage/v1/object/public/<bucket>/<path>  (relativa, no debería ocurrir)
const SUPABASE_STORAGE_RE = /\/storage\/v1\/object\/(?:public|sign)\/([^?]+)/;

function isSupabaseStorageUrl(url) {
  return typeof url === "string" && SUPABASE_STORAGE_RE.test(url);
}

function extractStoragePath(url) {
  const m = url.match(SUPABASE_STORAGE_RE);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

function readCache(path) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + path);
    if (!raw) return null;
    const { ts, url } = JSON.parse(raw);
    if (!ts || Date.now() - ts > CACHE_TTL_MS) return null;
    return url;
  } catch {
    return null;
  }
}

function writeCache(path, url) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + path, JSON.stringify({ ts: Date.now(), url }));
  } catch {
    // sessionStorage lleno o deshabilitado: ignorar
  }
}

// Inflight requests compartidos: si dos componentes piden la misma URL
// al mismo tiempo, se hace un solo fetch.
const inflight = new Map();

async function fetchSignedUrl(path) {
  const cached = readCache(path);
  if (cached) return cached;

  if (inflight.has(path)) return inflight.get(path);

  const promise = (async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/storage/sign?path=${encodeURIComponent(path)}`
      );
      if (!res.ok) throw new Error("No se pudo firmar la URL");
      const data = await res.json();
      writeCache(path, data.url);
      return data.url;
    } finally {
      inflight.delete(path);
    }
  })();
  inflight.set(path, promise);
  return promise;
}

// Resuelve una URL de imagen. Si es de Supabase Storage, devuelve una
// versión firmada (cacheada). Si es externa, la devuelve tal cual.
export async function resolveImageUrl(url) {
  if (!url) return "";
  if (!isSupabaseStorageUrl(url)) return url;
  const path = extractStoragePath(url);
  if (!path) return url;
  try {
    return await fetchSignedUrl(path);
  } catch {
    return url; // fallback a la URL original si falla
  }
}

// Batch: varias URLs en un solo request. Devuelve un Map<originalUrl, signedUrl>.
export async function resolveImageUrls(urls) {
  const result = new Map();
  const pendingPaths = new Map(); // path -> originalUrl

  // 1) Separar las que no son de Storage y cachear las que ya están en sessionStorage
  const toFetch = [];
  for (const url of urls) {
    if (!url) {
      result.set(url, "");
      continue;
    }
    if (!isSupabaseStorageUrl(url)) {
      result.set(url, url);
      continue;
    }
    const path = extractStoragePath(url);
    const cached = readCache(path);
    if (cached) {
      result.set(url, cached);
    } else {
      toFetch.push(path);
      pendingPaths.set(path, url);
    }
  }

  if (toFetch.length === 0) return result;

  try {
    const res = await fetch(`${API_BASE}/api/storage/sign-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: toFetch }),
    });
    if (!res.ok) throw new Error("Batch sign failed");
    const data = await res.json();
    for (const [path, signedUrl] of Object.entries(data.urls || {})) {
      writeCache(path, signedUrl);
      const original = pendingPaths.get(path);
      if (original) result.set(original, signedUrl);
    }
  } catch {
    // Fallback: URLs originales
    for (const [path, original] of pendingPaths.entries()) {
      result.set(original, pendingPaths.has(path) ? original : original);
    }
  }
  return result;
}

// Limpia el cache de URLs firmadas. Útil después de logout.
export function clearImageUrlCache() {
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
