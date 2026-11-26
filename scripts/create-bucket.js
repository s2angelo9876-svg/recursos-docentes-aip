import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET = "recursos-uploads" } = process.env;
const { storage } = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const { data: buckets, error } = await storage.listBuckets();
if (error) throw error;
const bucket = buckets.find(({ id }) => id === SUPABASE_STORAGE_BUCKET);
if (bucket?.public !== false) {
  const options = { public: false };
  const result = bucket
    ? await storage.updateBucket(SUPABASE_STORAGE_BUCKET, options)
    : await storage.createBucket(SUPABASE_STORAGE_BUCKET, options);
  if (result.error) throw result.error;
}
console.log("Bucket privado disponible.");
