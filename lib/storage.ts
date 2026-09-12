import { createClient } from "@supabase/supabase-js";

const DEFAULT_BUCKET = "menu-images";

export function getSupabaseStorageClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Extracts the file path within the Supabase bucket from a full public URL.
 * e.g. https://xyz.supabase.co/storage/v1/object/public/menu-images/items/user_123.jpg -> items/user_123.jpg
 */
export function extractStoragePath(imageUrl: string, bucket = DEFAULT_BUCKET): string | null {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(imageUrl.substring(idx + marker.length));
  }
  // If it's already a relative path inside the bucket
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://") && !imageUrl.startsWith("data:")) {
    return imageUrl;
  }
  return null;
}

/**
 * Deletes a file from Supabase Storage bucket given its full URL or relative path.
 */
export async function deleteStorageFile(imageUrlOrPath: string, bucket = DEFAULT_BUCKET): Promise<boolean> {
  try {
    if (!imageUrlOrPath) return false;
    const supabase = getSupabaseStorageClient();
    if (!supabase) {
      console.warn("deleteStorageFile: Supabase credentials not configured, skipping storage delete.");
      return false;
    }

    const path = extractStoragePath(imageUrlOrPath, bucket);
    if (!path) {
      // Not a Supabase storage URL (e.g. external link or data URL)
      return false;
    }

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`deleteStorageFile: Failed to delete "${path}" from bucket "${bucket}":`, error.message);
      return false;
    }

    console.log(`[Storage] Successfully deleted file "${path}" from bucket "${bucket}"`);
    return true;
  } catch (err) {
    console.error("deleteStorageFile unexpected error:", err);
    return false;
  }
}
