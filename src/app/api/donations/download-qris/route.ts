import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getDonationAccounts, getAllDonationAccountsAdmin } from "@/lib/donations";
import { downloadFromNeonS3Native } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let urlParam = searchParams.get("url")?.trim();
    const idParam = searchParams.get("id")?.trim();
    let filename = searchParams.get("filename")?.trim() || "QRIS-PRAMUKA-MH-SCOUT.png";

    // Bersihkan karakter terlarang dari nama berkas untuk keamanan header HTTP
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!filename.toLowerCase().endsWith(".png") && !filename.toLowerCase().endsWith(".jpg") && !filename.toLowerCase().endsWith(".jpeg") && !filename.toLowerCase().endsWith(".webp")) {
      filename += ".png";
    }

    // Jika tidak ada URL langsung, cari dari daftar rekening donasi
    if (!urlParam) {
      const accounts = await getAllDonationAccountsAdmin().catch(() => []);
      if (idParam) {
        const found = accounts.find((a) => a.id === idParam && a.qrImageUrl);
        if (found?.qrImageUrl) urlParam = found.qrImageUrl;
      }
      if (!urlParam) {
        const qrisAcc = accounts.find((a) => a.qrImageUrl);
        if (qrisAcc?.qrImageUrl) urlParam = qrisAcc.qrImageUrl;
      }
    }

    if (!urlParam) {
      return NextResponse.json(
        { error: "Berkas barcode QRIS belum tersedia atau belum diunggah." },
        { status: 404 }
      );
    }

    let buffer: Buffer | null = null;
    let contentType = "image/png";

    // Kasus 1: Berkas lokal di folder public/uploads
    if (urlParam.startsWith("/uploads/") || urlParam.startsWith("uploads/")) {
      const cleanPath = urlParam.replace(/^\/?uploads\//, "");
      const localFilePath = path.join(process.cwd(), "public", "uploads", cleanPath);
      try {
        buffer = await fs.readFile(localFilePath);
        const ext = path.extname(cleanPath).toLowerCase();
        if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".webp") contentType = "image/webp";
      } catch {
        // berkas lokal tidak ditemukan
      }
    }

    // Kasus 2: URL eksternal (Neon S3 atau HTTP/HTTPS)
    if (!buffer && urlParam.startsWith("http")) {
      // Coba periksa apakah berkas tersimpan di cache lokal public/uploads
      try {
        const urlObj = new URL(urlParam);
        const baseName = path.basename(urlObj.pathname);
        const localCached = path.join(process.cwd(), "public", "uploads", baseName);
        try {
          buffer = await fs.readFile(localCached);
          const ext = path.extname(baseName).toLowerCase();
          if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
          else if (ext === ".webp") contentType = "image/webp";
        } catch {
          // Tidak ada di cache lokal, unduh dari URL remote
        }
      } catch {
        // format URL tidak valid
      }

      // Jika belum ada di buffer, fetch dari URL remote
      if (!buffer) {
        try {
          const res = await fetch(urlParam, {
            signal: AbortSignal.timeout(10000),
          });
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            buffer = Buffer.from(arrayBuf);
            const serverType = res.headers.get("content-type");
            if (serverType && serverType.startsWith("image/")) {
              contentType = serverType;
            }

            // Simpan cache lokal di public/uploads untuk percepatan unduhan selanjutnya
            try {
              const urlObj = new URL(urlParam);
              const baseName = path.basename(urlObj.pathname);
              const uploadDir = path.join(process.cwd(), "public", "uploads");
              await fs.mkdir(uploadDir, { recursive: true });
              await fs.writeFile(path.join(uploadDir, baseName), buffer);
            } catch {
              // Abaikan jika penulisan cache gagal
            }
          }
        } catch (fetchErr: any) {
          console.error("Gagal mengunduh gambar QRIS dari remote URL:", fetchErr?.message || fetchErr);
        }

        // Jika fetch biasa gagal (misal butuh otentikasi AWS S3), coba pakai downloadFromNeonS3Native
        if (!buffer && urlParam.includes(".neon.tech")) {
          try {
            const s3Res = await downloadFromNeonS3Native(urlParam);
            if (s3Res) {
              buffer = s3Res.buffer;
              if (s3Res.contentType) contentType = s3Res.contentType;

              try {
                const urlObj = new URL(urlParam);
                const baseName = path.basename(urlObj.pathname);
                const uploadDir = path.join(process.cwd(), "public", "uploads");
                await fs.mkdir(uploadDir, { recursive: true });
                await fs.writeFile(path.join(uploadDir, baseName), buffer);
              } catch {
                // Abaikan
              }
            }
          } catch (s3Err) {
            console.error("downloadFromNeonS3Native failed:", s3Err);
          }
        }
      }
    }

    // Kasus 3: Jika berkas adalah Data URL base64
    if (!buffer && urlParam.startsWith("data:image/")) {
      try {
        const matches = urlParam.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          contentType = matches[1];
          buffer = Buffer.from(matches[2], "base64");
        }
      } catch {
        // Gagal mem-parse data URL
      }
    }

    if (!buffer) {
      return NextResponse.json(
        { error: "Gagal mengambil berkas barcode QRIS. Pastikan file valid." },
        { status: 502 }
      );
    }

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: any) {
    console.error("Download QRIS error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses unduhan berkas QRIS." },
      { status: 500 }
    );
  }
}
