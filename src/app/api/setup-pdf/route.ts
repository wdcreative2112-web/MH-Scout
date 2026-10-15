import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const vendorDir = path.join(process.cwd(), "public", "vendor");
    if (!fs.existsSync(vendorDir)) {
      fs.mkdirSync(vendorDir, { recursive: true });
    }

    const targetFile = path.join(vendorDir, "html2pdf.bundle.min.js");
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 100000) {
      return NextResponse.json({
        success: true,
        message: "Already exists",
        size: fs.statSync(targetFile).size,
      });
    }

    const cdnUrl =
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    const res = await fetch(cdnUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch from CDN: ${res.statusText}`);
    }

    const content = await res.text();
    fs.writeFileSync(targetFile, content, "utf8");

    return NextResponse.json({
      success: true,
      size: content.length,
      path: targetFile,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
