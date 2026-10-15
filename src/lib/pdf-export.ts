/**
 * Client-Side PDF Generation & Export Utility
 * 
 * Generates genuine binary PDF files (.pdf) directly in the browser
 * and triggers immediate device download (saving to Downloads folder).
 * Uses isolated off-screen DOM cloning to avoid modal/overlay background bleeding,
 * high-resolution canvas scaling (scale: 2 = 300 DPI) for crisp vector-like text,
 * and precise A4 standard paper margins.
 */

export interface ExportPdfOptions {
  filename?: string;
  marginMm?: number | [number, number, number, number];
  orientation?: "portrait" | "landscape";
  format?: "a4" | "letter";
  scale?: number;
}

let html2pdfLoaderPromise: Promise<any> | null = null;

/**
 * Clean string for safe filesystem filename
 */
export function sanitizeFileName(name: string, fallback = "Dokumen-Pramuka"): string {
  if (!name) return fallback;
  const clean = name
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return clean || fallback;
}

/**
 * Asynchronously load html2pdf bundle from local public/vendor first, then redundant CDNs
 */
export async function loadHtml2Pdf(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("PDF generation can only run in the browser");
  }

  // Already available in window
  if ((window as any).html2pdf) {
    return (window as any).html2pdf;
  }

  if (html2pdfLoaderPromise) {
    return html2pdfLoaderPromise;
  }

  // Priority 1: Local bundle in public/vendor/ (instant, offline-capable, no CSP blocks)
  // Fallbacks: Trusted public CDN mirrors
  const scriptSources = [
    "/vendor/html2pdf.bundle.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
    "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js",
    "https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js",
  ];

  html2pdfLoaderPromise = (async () => {
    for (const url of scriptSources) {
      try {
        await new Promise<void>((resolve, reject) => {
          // Check if script tag already exists
          const existingScript = document.querySelector(`script[src="${url}"]`);
          if (existingScript) {
            if ((window as any).html2pdf) return resolve();
            existingScript.addEventListener("load", () => resolve());
            existingScript.addEventListener("error", () => reject(new Error("Script error")));
            return;
          }

          const script = document.createElement("script");
          script.src = url;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load: ${url}`));
          document.head.appendChild(script);
        });

        if ((window as any).html2pdf) {
          return (window as any).html2pdf;
        }
      } catch (err) {
        console.warn(`[PDF Export] Source failed (${url}), trying next source...`, err);
      }
    }

    throw new Error("Tidak dapat memuat pustaka PDF renderer. Periksa koneksi internet.");
  })();

  return html2pdfLoaderPromise;
}

/**
 * Generate and download a genuine PDF file from a DOM element or element ID
 * Uses an isolated DOM container to guarantee 100% clean white background
 * without any modal backdrops, screen UI, or leaked page elements.
 */
export async function downloadElementAsPdf(
  target: HTMLElement | string,
  options: ExportPdfOptions = {}
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const sourceElement: HTMLElement | null =
    typeof target === "string" ? document.getElementById(target) : target;

  if (!sourceElement) {
    console.error(`[PDF Export] Target element not found:`, target);
    throw new Error("Elemen dokumen untuk dicetak tidak ditemukan.");
  }

  const rawFilename = options.filename || "Dokumen-Pramuka";
  const cleanName = sanitizeFileName(rawFilename);
  const finalFilename = cleanName.toLowerCase().endsWith(".pdf")
    ? cleanName
    : `${cleanName}.pdf`;

  const isLandscape = options.orientation === "landscape";

  // Create an isolated container outside of any modals, backdrops, or page layouts
  const isolationContainer = document.createElement("div");
  isolationContainer.id = "pdf-isolation-container";
  isolationContainer.style.position = "fixed";
  isolationContainer.style.left = "0";
  isolationContainer.style.top = "0";
  isolationContainer.style.width = isLandscape ? "297mm" : "210mm";
  isolationContainer.style.zIndex = "-999999";
  isolationContainer.style.backgroundColor = "#ffffff";
  isolationContainer.style.opacity = "1";
  isolationContainer.style.pointerEvents = "none";
  isolationContainer.style.overflow = "visible";

  // Clone source element into the isolated container
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.id = "pdf-isolated-sheet";
  clone.style.width = "100%";
  clone.style.maxWidth = "none";
  clone.style.minHeight = isLandscape ? "210mm" : "297mm";
  clone.style.margin = "0";
  clone.style.padding = "8mm 12mm";
  clone.style.boxShadow = "none";
  clone.style.border = "none";
  clone.style.borderRadius = "0";
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#0f172a";

  // Hide any elements marked print:hidden or no-print inside the clone
  clone.querySelectorAll(".print\\:hidden, .no-print, button, input, select").forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  isolationContainer.appendChild(clone);
  document.body.appendChild(isolationContainer);

  try {
    // Ensure all images are fully loaded and decoded before rendering
    const images = Array.from(clone.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
              return resolve();
            }
            img.crossOrigin = "anonymous";
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 800); // 800ms safety timeout
          })
      )
    );

    const html2pdf = await loadHtml2Pdf();

    const margin =
      options.marginMm !== undefined
        ? options.marginMm
        : [0, 0, 0, 0]; // Padding is cleanly handled inside the clone

    const opt = {
      margin: margin,
      filename: finalFilename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: options.scale || 2, // 2x for sharp 300DPI text
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: isLandscape ? 1122 : 794, // Standard 96 DPI pixel width for A4
      },
      jsPDF: {
        unit: "mm",
        format: options.format || "a4",
        orientation: options.orientation || "portrait",
        compress: true,
      },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
        before: ".html2pdf__page-break",
      },
    };

    // Execute generation and trigger direct browser file download
    await html2pdf().set(opt).from(clone).save();

    return true;
  } catch (error) {
    console.error("[PDF Export Error]:", error);
    throw error;
  } finally {
    // Clean up isolated DOM container
    if (isolationContainer && isolationContainer.parentNode) {
      isolationContainer.parentNode.removeChild(isolationContainer);
    }
  }
}
