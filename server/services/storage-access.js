export function storagePath(input, origin, bucket, allowRelative = true) {
  if (typeof input !== "string" || input.length > 1200) return null;
  let object = input.trim();
  if (/^https?:\/\//i.test(object)) {
    try {
      const url = new URL(object);
      if (url.origin !== origin) return null;
      const match = /^\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/.exec(url.pathname);
      if (!match || decodeURIComponent(match[1]) !== bucket) return null;
      object = decodeURIComponent(match[2]);
    } catch {
      return null;
    }
  } else if (allowRelative) {
    object = object.replace(/^\//, "");
    if (object.startsWith(bucket + "/")) object = object.slice(bucket.length + 1);
  } else {
    return null;
  }

  if (/[\\?#]/.test(object) || [...object].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
      object.split("/").some((part) => !part || part === "." || part === "..")) return null;
  return object;
}

export function visibleStoragePaths({ hero, evidence, resources }, origin, bucket) {
  return new Set([
    ...hero.map((item) => item.imagenUrl),
    ...evidence.flatMap((item) => [item.url, ...(Array.isArray(item.imagenes) ? item.imagenes.map((image) => image?.url) : [])]),
    ...resources.flatMap((item) => [item.url, ...(Array.isArray(item.contenidos) ? item.contenidos.map((file) => file?.url) : [])]),
  ].map((url) => storagePath(url, origin, bucket, false)).filter(Boolean));
}
