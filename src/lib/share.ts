/**
 * Helper utilities for generating social share URLs and metadata,
 * especially formatted for WhatsApp sharing and rich Open Graph previews.
 */

export function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * Returns an absolute URL for any relative or absolute path.
 */
export function getAbsoluteUrl(path: string): string {
  if (!path) return getBaseUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${cleanPath}`;
}

/**
 * Resolves an image URL into a full absolute URL for WhatsApp / Open Graph crawler.
 * If the image is null or empty, falls back to the official logo (/logo.jpeg).
 */
export function getAbsoluteImageUrl(imagePath?: string | null): string {
  if (!imagePath || imagePath.trim() === "") {
    return getAbsoluteUrl("/logo.jpeg");
  }
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return getAbsoluteUrl(imagePath);
}

/**
 * Formats a clean, attractive WhatsApp message body including title, summary, and article URL.
 * When sent to WhatsApp, WhatsApp automatically parses the URL and displays the Open Graph image thumbnail!
 */
export function formatWhatsAppMessage(options: {
  title: string;
  summary?: string | null;
  url: string;
  category?: string | null;
}): string {
  const lines: string[] = [];

  const categoryTag = options.category ? `[${options.category.toUpperCase()}] ` : "";
  lines.push(`*📢 ${categoryTag}${options.title.trim()}*`);

  if (options.summary && options.summary.trim()) {
    const cleanSummary = options.summary.trim();
    const shortSummary =
      cleanSummary.length > 200
        ? cleanSummary.substring(0, 197) + "..."
        : cleanSummary;
    lines.push(`\n"${shortSummary}"`);
  }

  lines.push(`\n👉 *Baca warta selengkapnya & lihat foto:*`);
  lines.push(options.url);
  lines.push(`\n_MH SCOUT — Pangkalan Gerakan Pramuka_`);

  return lines.join("\n");
}

/**
 * Returns a universal WhatsApp share link that works seamlessly across:
 * - WhatsApp Mobile App (Android/iOS)
 * - WhatsApp Web (Desktop)
 * - WhatsApp Desktop App
 */
export function getWhatsAppShareUrl(options: {
  title: string;
  summary?: string | null;
  url: string;
  category?: string | null;
}): string {
  const message = formatWhatsAppMessage(options);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
