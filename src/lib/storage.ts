import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface UploadResult {
  url: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/avif"];
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/bmp": ".bmp",
  "image/avif": ".avif",
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function resolveImageMimeType(type?: string, fileName?: string): string | null {
  const normalized = (type || "").toLowerCase().trim();
  if (normalized === "image/jpeg" || normalized === "image/jpg" || normalized === "image/pjpeg" || normalized === "image/jfif") {
    return "image/jpeg";
  }
  if (normalized === "image/png" || normalized === "image/x-png") {
    return "image/png";
  }
  if (normalized === "image/webp") {
    return "image/webp";
  }
  if (normalized === "image/gif") {
    return "image/gif";
  }
  if (normalized === "image/bmp" || normalized === "image/x-ms-bmp") {
    return "image/bmp";
  }
  if (normalized === "image/avif") {
    return "image/avif";
  }

  if (fileName) {
    const ext = path.extname(fileName).toLowerCase().split("?")[0];
    if (ext === ".jpg" || ext === ".jpeg" || ext === ".jfif") return "image/jpeg";
    if (ext === ".png") return "image/png";
    if (ext === ".webp") return "image/webp";
    if (ext === ".gif") return "image/gif";
    if (ext === ".bmp") return "image/bmp";
    if (ext === ".avif") return "image/avif";
  }

  return null;
}

export function validateImage(file: { type: string; size: number; name?: string }): { valid: boolean; error?: string } {
  const resolvedMime = resolveImageMimeType(file.type, file.name);
  if (!resolvedMime) {
    return {
      valid: false,
      error: "Format berkas tidak didukung. Harap unggah gambar format JPG, PNG, WEBP, atau GIF.",
    };
  }

  if (file.name) {
    const rawExt = path.extname(file.name).toLowerCase();
    const dangerousExts = [
      ".html", ".htm", ".svg", ".php", ".phtml", ".shtml", ".js", 
      ".jsx", ".ts", ".tsx", ".sh", ".bash", ".exe", ".cmd", ".bat", ".vbs"
    ];
    if (dangerousExts.includes(rawExt)) {
      return {
        valid: false,
        error: "Ekstensi file berisiko tidak diizinkan untuk diunggah.",
      };
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "Ukuran file terlalu besar. Maksimum ukuran adalah 10 MB.",
    };
  }

  return { valid: true };
}

// Helper untuk memeriksa apakah kredensial Neon Object Storage aktif
export function isNeonStorageConfigured(): boolean {
  return (
    process.env.IMAGE_STORAGE_PROVIDER === "neon" &&
    Boolean(process.env.AWS_ENDPOINT_URL_S3) &&
    Boolean(process.env.AWS_ACCESS_KEY_ID) &&
    Boolean(process.env.AWS_SECRET_ACCESS_KEY)
  );
}

function hmac(key: Buffer | string, data: string | Buffer): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function sha256(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

// Upload langsung ke S3 / Neon Object Storage tanpa external SDK
async function uploadToNeonS3Native(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, "");
  const region = process.env.AWS_REGION || "ap-southeast-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
  const bucket = process.env.NEON_STORAGE_BUCKET || "uploads";

  const urlObj = new URL(`${endpoint}/${bucket}/${key}`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);

  const payloadHash = sha256(buffer);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${urlObj.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest =
    `PUT\n` +
    urlObj.pathname + `\n` +
    `\n` +
    canonicalHeaders + `\n` +
    signedHeaders + `\n` +
    payloadHash;

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign =
    `${algorithm}\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    sha256(canonicalRequest);

  const signingKey = getSigningKey(secretAccessKey, dateStamp, region, "s3");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const authorizationHeader =
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(urlObj.toString(), {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "host": urlObj.host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      "Authorization": authorizationHeader,
    },
    body: new Uint8Array(buffer),
    signal: AbortSignal.timeout(4000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Neon S3 upload failed (${response.status}): ${errorText}`);
  }

  return urlObj.toString();
}

async function deleteFromNeonS3Native(urlOrKey: string): Promise<boolean> {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, "");
  const region = process.env.AWS_REGION || "ap-southeast-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
  const bucket = process.env.NEON_STORAGE_BUCKET || "uploads";

  let key = urlOrKey;
  if (urlOrKey.includes(`/${bucket}/`)) {
    key = urlOrKey.split(`/${bucket}/`)[1];
  } else if (urlOrKey.startsWith("http")) {
    key = path.basename(urlOrKey);
  }

  const urlObj = new URL(`${endpoint}/${bucket}/${key}`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);
  const payloadHash = sha256("");

  const canonicalHeaders =
    `host:${urlObj.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest =
    `DELETE\n` +
    urlObj.pathname + `\n` +
    `\n` +
    canonicalHeaders + `\n` +
    signedHeaders + `\n` +
    payloadHash;

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign =
    `${algorithm}\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    sha256(canonicalRequest);

  const signingKey = getSigningKey(secretAccessKey, dateStamp, region, "s3");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const authorizationHeader =
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(urlObj.toString(), {
    method: "DELETE",
    headers: {
      "host": urlObj.host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      "Authorization": authorizationHeader,
    },
    signal: AbortSignal.timeout(4000),
  });

  return response.ok;
}

export async function downloadFromNeonS3Native(urlOrKey: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!isNeonStorageConfigured()) return null;
  try {
    const endpoint = process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, "");
    const region = process.env.AWS_REGION || "ap-southeast-1";
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
    const bucket = process.env.NEON_STORAGE_BUCKET || "uploads";

    let key = urlOrKey;
    if (urlOrKey.includes(`/${bucket}/`)) {
      key = urlOrKey.split(`/${bucket}/`)[1];
    } else if (urlOrKey.startsWith("http")) {
      key = path.basename(new URL(urlOrKey).pathname);
    }

    const urlObj = new URL(`${endpoint}/${bucket}/${key}`);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.substring(0, 8);
    const payloadHash = sha256("");

    const canonicalHeaders =
      `host:${urlObj.host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest =
      `GET\n` +
      urlObj.pathname + `\n` +
      `\n` +
      canonicalHeaders + `\n` +
      signedHeaders + `\n` +
      payloadHash;

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign =
      `${algorithm}\n` +
      `${amzDate}\n` +
      `${credentialScope}\n` +
      sha256(canonicalRequest);

    const signingKey = getSigningKey(secretAccessKey, dateStamp, region, "s3");
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

    const authorizationHeader =
      `${algorithm} Credential=${accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(urlObj.toString(), {
      method: "GET",
      headers: {
        "host": urlObj.host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        "Authorization": authorizationHeader,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") || "image/png",
    };
  } catch (err) {
    console.warn("downloadFromNeonS3Native error:", err);
    return null;
  }
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const validation = validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Validasi gambar gagal.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate nama unik untuk berkas dengan ekstensi aman berbasis MIME type
  const resolvedMime = resolveImageMimeType(file.type, file.name) || "image/jpeg";
  const safeExt = MIME_TO_EXT[resolvedMime] || ".jpg";
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExt}`;

  // 1. Simpan selalu salinan lokal fisik di public/uploads agar unduhan instan dan andal
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    const localFilePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(localFilePath, buffer);
  } catch (err) {
    console.warn("Local storage write warning:", err);
  }

  // 2. Opsi Utama: Neon S3 Object Storage (Native, Zero Dependency)
  if (isNeonStorageConfigured()) {
    try {
      const publicUrl = await uploadToNeonS3Native(buffer, `uploads/${uniqueName}`, resolvedMime);
      return {
        url: publicUrl,
        fileName: uniqueName,
        originalName: file.name,
        mimeType: resolvedMime,
        size: file.size,
      };
    } catch (err: any) {
      console.error("Neon S3 upload failed, falling back to local storage:", err);
    }
  }

  // 3. Opsi Fallback: Penyimpanan Lokal Fisik
  const url = `/uploads/${uniqueName}`;

  return {
    url,
    fileName: uniqueName,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteImage(urlOrFileName: string): Promise<boolean> {
  if (!urlOrFileName) return false;

  // Jika URL mengarah ke Neon S3 Object Storage
  const isS3Url =
    urlOrFileName.startsWith("http://") ||
    urlOrFileName.startsWith("https://") ||
    urlOrFileName.includes("neon.tech");

  if (isNeonStorageConfigured() && isS3Url) {
    try {
      return await deleteFromNeonS3Native(urlOrFileName);
    } catch (err) {
      console.error("Neon S3 delete failed:", err);
    }
  }

  // Fallback penghapusan berkas lokal
  try {
    const fileName = path.basename(urlOrFileName);
    const filePath = path.join(process.cwd(), "public", "uploads", fileName);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getImageUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "/images/placeholder.svg";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return pathOrUrl;
}
