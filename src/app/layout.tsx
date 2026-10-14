import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MH SCOUT — Sistem Manajemen Organisasi & Kegiatan Pramuka",
  description:
    "Aplikasi terpadu manajemen organisasi Pramuka: administrasi anggota, regu, pembina, absensi latihan mingguan, SKU/SKK, surat, keuangan, dan publikasi berita.",
  keywords: ["Pramuka", "Gerakan Pramuka", "MH SCOUT", "Sistem Manajemen Pramuka", "Absensi Pramuka", "Keuangan Gudep"],
  authors: [{ name: "MH SCOUT Team" }],
  openGraph: {
    title: "MH SCOUT — Sistem Manajemen Organisasi & Kegiatan Pramuka",
    description: "Sistem manajemen Pramuka modern yang mengintegrasikan website publik dan dashboard administrasi.",
    type: "website",
    locale: "id_ID",
    siteName: "MH SCOUT",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#184231",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
