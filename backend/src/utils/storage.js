const supabase = require("../config/supabase");

const BUCKET = process.env.SUPABASE_BUCKET || "uploads";

/**
 * Upload a file buffer to Supabase Storage.
 * @returns {{ path: string, publicUrl: string }}
 */
async function uploadFile(buffer, remotePath, mimeType) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(remotePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  return { path: data.path };
}

/**
 * Generate a short-lived signed URL so the user can download the file.
 * Valid for 60 seconds — enough for a single download click.
 */
async function getSignedUrl(remotePath, expiresInSeconds = 60, downloadFilename = null) {
  const options = downloadFilename ? { download: downloadFilename } : {};
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(remotePath, expiresInSeconds, options);

  if (error) throw new Error(`Supabase signed URL failed: ${error.message}`);
  return data.signedUrl;
}

/**
 * Delete a file from Supabase Storage.
 */
async function deleteFile(remotePath) {
  const { error } = await supabase.storage.from(BUCKET).remove([remotePath]);
  if (error) console.error("Supabase delete error:", error.message);
}

module.exports = { uploadFile, getSignedUrl, deleteFile };
