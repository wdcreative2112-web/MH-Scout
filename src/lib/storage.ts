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

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateImage(file: { type: string; size: number }): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Format file tidak didukung. Gunakan format JPG, PNG, WEBP, atau GIF.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "Ukuran file terlalu besar. Maksimum ukuran adalah 5 MB.",
    };
  }

  return { valid: true };
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const validation = validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Validasi gambar gagal.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate safe unique filename
  const ext = path.extname(file.name) || ".jpg";
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

  // Default provider: Local filesystem storage in public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch {
    // directory already exists or created
  }

  const filePath = path.join(uploadDir, uniqueName);
  await fs.writeFile(filePath, buffer);

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
