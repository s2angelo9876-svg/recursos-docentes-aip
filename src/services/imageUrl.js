import { API_BASE } from "../utils/api.js";

export function storageLink(url) {
  if (typeof url !== "string" || !url.trim()) return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url.startsWith("/") && !["/", "\\"].includes(url[1]) ? url : null;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  if (/^\/storage\/v1\/object\/(public|sign)\//.test(parsed.pathname)) {
    return `${API_BASE}/api/storage/open?path=${encodeURIComponent(parsed.href)}`;
  }
  return parsed.href;
}

// Las URLs de Storage se autorizan en el servidor al abrir cada enlace.
export async function resolveImageUrl(url) {
  return storageLink(url);
}

export async function resolveImageUrls(urls) {
  return new Map(urls.map((url) => [url, storageLink(url)]));
}

export function clearImageUrlCache() {
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith("signed_img_")) sessionStorage.removeItem(key);
  }
}
