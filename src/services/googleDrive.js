const FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const CACHE_KEY = "drive_gallery_v1";
const CACHE_TTL = 60 * 60 * 1000;

export class DriveGalleryError extends Error {
  constructor(message, code = "unknown") {
    super(message);
    this.name = "DriveGalleryError";
    this.code = code;
  }
}

function isConfigured() {
  return Boolean(FOLDER_ID && API_KEY);
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!ts || !Array.isArray(data)) return null;
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // sessionStorage lleno o deshabilitado: ignorar
  }
}

export function clearDriveCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignorar
  }
}

export async function listDriveImages({ forceRefresh = false } = {}) {
  if (!isConfigured()) {
    throw new DriveGalleryError(
      "Faltan VITE_GOOGLE_API_KEY o VITE_DRIVE_FOLDER_ID en .env",
      "config"
    );
  }

  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return cached;
  }

  const q = `'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`;
  const params = new URLSearchParams({
    q,
    key: API_KEY,
    fields: "files(id,name,thumbnailLink,createdTime)",
    pageSize: "100",
    orderBy: "createdTime desc",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
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

  writeCache(data);
  return data;
}
