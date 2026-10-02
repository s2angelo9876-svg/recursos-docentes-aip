import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "recursos-uploads";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorios para el almacenamiento de archivos."
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ──────────────────────────────────────────────────────────────────────
// Cache en memoria de signed URLs
// Reduce el costo de regenerar la firma a cada request. La entrada
// expira `expiresIn` segundos después de creada, pero la evictamos
// del cache 1 minuto antes para no servir URLs a punto de expirar.
// ──────────────────────────────────────────────────────────────────────
const signedUrlCache = new Map(); // path -> { url, expiresAt }

const SIGNED_URL_TTL_SECONDS = 600; // 10 min
const CACHE_EVICT_BUFFER_MS = 60_000; // 1 min de margen

function cacheKey(filePath) {
  return filePath.replace(/^\/+/, "");
}

function getCachedSignedUrl(filePath) {
  const key = cacheKey(filePath);
  const cached = signedUrlCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt - CACHE_EVICT_BUFFER_MS < Date.now()) {
    signedUrlCache.delete(key);
    return null;
  }
  return cached.url;
}

function setCachedSignedUrl(filePath, url) {
  signedUrlCache.set(cacheKey(filePath), {
    url,
    expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
  });
}

export function isStorageEnabled() {
  return true;
}

export function getBucketName() {
  return bucketName;
}

// ──────────────────────────────────────────────────────────────────────
// Watermark sutil: "I.E. Bandera del Perú · AIP" en diagonal, opacidad
// baja para que sea visible pero no invasivo. Se aplica solo a imágenes
// raster (jpeg/png/webp). Videos y PDFs se suben sin tocar.
// ──────────────────────────────────────────────────────────────────────
const WATERMARK_TEXT = "I.E. Bandera del Perú · AIP";
const WATERMARKABLE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

async function applyWatermark(buffer, mimetype) {
  if (!WATERMARKABLE_MIMES.has(mimetype)) {
    return { buffer, mimetype, watermarked: false };
  }
  try {
    const meta = await sharp(buffer).metadata();
    const w = meta.width || 1200;
    const h = meta.height || 800;
    // Calculamos tamaño del texto en función del ancho
    const fontSize = Math.max(18, Math.round(w / 35));
    const textWidthEstimate = WATERMARK_TEXT.length * fontSize * 0.55;
    // Espaciado diagonal: una marca cada ~200px de alto
    const rows = Math.ceil(h / 220) + 1;
    const cols = Math.ceil(w / (textWidthEstimate + 80)) + 1;

    const texts = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * (textWidthEstimate + 80) - textWidthEstimate / 2;
        const y = r * 220 + fontSize;
        texts.push(
          `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="white" fill-opacity="0.32" stroke="black" stroke-opacity="0.18" stroke-width="1" transform="rotate(-28 ${x} ${y})">${WATERMARK_TEXT}</text>`
        );
      }
    }

    const svgOverlay = Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${texts.join("")}</svg>`
    );

    const watermarked = await sharp(buffer)
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .toBuffer();

    return { buffer: watermarked, mimetype, watermarked: true };
  } catch (err) {
    // Si falla el watermark, subimos la imagen original (no rompemos el upload)
    console.warn(`[WATERMARK] No se pudo aplicar watermark a ${mimetype}: ${err.message}`);
    return { buffer, mimetype, watermarked: false };
  }
}

// ──────────────────────────────────────────────────────────────────────
// Upload
// ──────────────────────────────────────────────────────────────────────
export async function uploadFile(fileBuffer, filename, mimetype) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filename, fileBuffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Error al subir archivo a Supabase: ${error.message}`);
  }

  return {
    url: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${data.path}`,
    path: data.path,
    filename: data.path,
    storage: "supabase",
  };
}

export async function uploadImageWithWatermark(fileBuffer, filename, mimetype) {
  const { buffer: wmBuffer, mimetype: wmMime, watermarked } =
    await applyWatermark(fileBuffer, mimetype);

  const result = await uploadFile(wmBuffer, filename, wmMime);

  return { ...result, watermarked };
}

// ──────────────────────────────────────────────────────────────────────
// Signed URLs
// ──────────────────────────────────────────────────────────────────────
export async function getSignedUrl(filePath, expiresIn = SIGNED_URL_TTL_SECONDS) {
  const cached = getCachedSignedUrl(filePath);
  if (cached) return cached;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`No se pudo generar la URL firmada: ${error.message}`);
  }

  setCachedSignedUrl(filePath, data.signedUrl);
  return data.signedUrl;
}

// Devuelve la URL firmada, o si falla, la URL pública como fallback.
// Esto permite mantener compatibilidad con imágenes que ya estaban
// guardadas antes de pasar el bucket a privado.
export async function getSignedUrlSafe(filePath) {
  try {
    return await getSignedUrl(filePath);
  } catch {
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cacheKey(filePath)}`;
  }
}

export async function getSignedUrls(filePaths) {
  return Promise.all(filePaths.map((p) => getSignedUrlSafe(p)));
}

// ──────────────────────────────────────────────────────────────────────
// Delete
// ──────────────────────────────────────────────────────────────────────
export async function deleteFile(fileUrl) {
  if (!fileUrl) return;
  // Acepta tanto URL pública como signed URL o path relativo
  const url = fileUrl;
  if (!url.includes("/storage/") && !url.includes(supabaseUrl)) {
    return;
  }
  let pathSegments;
  try {
    pathSegments = new URL(url, "http://x").pathname.split("/");
  } catch {
    return;
  }
  const bucketIndex = pathSegments.findIndex((s) => s === bucketName);
  const filePath = bucketIndex >= 0 ? pathSegments.slice(bucketIndex + 1).join("/") : null;

  if (filePath) {
    // Invalidamos el cache de signed URL para este path
    signedUrlCache.delete(cacheKey(filePath));
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);
    if (error) {
      console.warn(`No se pudo eliminar archivo de Supabase: ${error.message}`);
    }
  }
}
