const {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const r2Client = require("./r2Client");

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, ""); // strip trailing slash

/**
 * Build a permanent public URL for an object key.
 * Requires the bucket to have public access enabled in the R2 dashboard.
 */
function getPublicUrl(key) {
  if (!PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL is not set in environment variables.");
  }
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Generate a unique object key preserving the original file extension.
 * Format: uploads/<uuid>.<ext>
 * You can customise the prefix per route (e.g. "avatars/", "docs/").
 */
function buildKey(originalName, prefix = "uploads") {
  const ext = path.extname(originalName).toLowerCase();
  return `${prefix}/${uuidv4()}${ext}`;
}

/**
 * Upload a single file buffer to R2.
 * Returns the permanent public URL.
 */
async function uploadFile(file, prefix = "uploads") {
  const key = buildKey(file.originalname, prefix);

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentLength: file.size,
    // CacheControl: "public, max-age=31536000, immutable", // optional — great for static assets
    // Metadata: { originalName: file.originalname },       // optional custom metadata
  });

  await r2Client.send(command);

  return {
    key,
    url: getPublicUrl(key),
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  };
}

/**
 * Delete a file from R2 by its key.
 */
async function deleteFile(key) {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await r2Client.send(command);
  return { deleted: key };
}

/**
 * Check if a file exists in R2.
 */
async function fileExists(key) {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

/**
 * List files in the bucket (optional prefix filter).
 */
async function listFiles(prefix = "") {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    MaxKeys: 100,
  });
  const response = await r2Client.send(command);
  return (response.Contents || []).map((obj) => ({
    key: obj.Key,
    url: getPublicUrl(obj.Key),
    size: obj.Size,
    lastModified: obj.LastModified,
  }));
}

/**
 * Generate a temporary presigned URL (for private buckets / time-limited access).
 * Not needed if your bucket is fully public, but useful to have.
 */
async function getPresignedUrl(key, expiresInSeconds = 3600) {
  const command = new HeadObjectCommand({ Bucket: BUCKET, Key: key });
  const url = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
  return url;
}

module.exports = {
  uploadFile,
  deleteFile,
  fileExists,
  listFiles,
  getPublicUrl,
  getPresignedUrl,
};