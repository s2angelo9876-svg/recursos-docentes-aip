const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const CACHE_PREFIX = "drive_gallery_";
const CACHE_TTL = 60 * 60 * 1000;

export class DriveGalleryError extends Error {
  constructor(message, code = "unknown") {
    super(message);
    this.name = "DriveGalleryError";
    this.code = code;
  }
}

function isConfigured() {
  return Boolean(API_KEY);
}

export function extractDriveFolderId(input) {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

function readCache(folderId) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + folderId);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!ts || !Array.isArray(data)) return null;
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(folderId, data) {
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + folderId,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // sessionStorage lleno o deshabilitado
  }
}

export function clearDriveCache(folderId) {
  try {
    if (folderId) sessionStorage.removeItem(CACHE_PREFIX + folderId);
    else {
      const keys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => sessionStorage.removeItem(k));
    }
  } catch {
    // ignorar
  }
}

export async function listDriveImages({ folderId: input, forceRefresh = false } = {}) {
  if (!isConfigured()) {
    throw new DriveGalleryError(
      "Falta VITE_GOOGLE_API_KEY en .env",
      "config"
    );
  }

  const folderId = extractDriveFolderId(input);
  if (!folderId) {
    throw new DriveGalleryError(
      "URL o ID de carpeta de Google Drive no válido",
      "invalid_url"
    );
  }

  if (!forceRefresh) {
    const cached = readCache(folderId);
    if (cached) return cached;
  }

  const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
  const params = new URLSearchParams({
    q,
    key: API_KEY,
    fields: "files(id,name,thumbnailLink,createdTime)",
    pageSize: "100",
    orderBy: "createdTime desc",
  });

  let res;
  try {
    res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
  } catch {
    throw new DriveGalleryError("Sin conexión con Google Drive", "network");
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) detail = body.error.message;
    } catch {
      // cuerpo no era JSON
    }
    const code =
      res.status === 403 ? "quota"
      : res.status === 404 ? "not_found"
      : res.status === 401 ? "unauthorized"
      : "http";
    throw new DriveGalleryError(detail, code);
  }

  const json = await res.json();
  const files = Array.isArray(json.files) ? json.files : [];

  const data = files.map((f) => ({
    id: f.id,
    name: f.name,
    url: `https://lh3.googleusercontent.com/d/${f.id}=w2000`,
    thumb: f.thumbnailLink,
    created: f.createdTime,
  }));

  writeCache(folderId, data);
  return data;
}
