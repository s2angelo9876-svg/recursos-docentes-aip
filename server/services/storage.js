import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "recursos-uploads";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorios para el almacenamiento de archivos."
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const signatureCache = new Map();
const SIGNED_URL_TTL_SECONDS = 60;

export function getBucketName() { return bucketName; }

export async function verifyPrivateBucket() {
  const { data, error } = await supabase.storage.getBucket(bucketName);
  if (error || data?.public !== false) {
    throw new Error("Configura un bucket privado de Supabase antes de iniciar.");
  }
}

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

export async function getSignedUrl(filePath) {
  const cached = signatureCache.get(filePath);
  if (cached && cached.expiresAt > Date.now() + 10000) return cached.url;

  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;

  if (signatureCache.size >= 1024) signatureCache.delete(signatureCache.keys().next().value);
  signatureCache.set(filePath, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000 });
  return data.signedUrl;
}
