import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { GlobalTopLoader } from "@/components/common/GlobalTopLoader";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    siteName: "MH SCOUT — Pangkalan Gerakan Pramuka",
    images: [
      {
        url: "/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "MH SCOUT Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MH SCOUT — Sistem Manajemen Organisasi & Kegiatan Pramuka",
    description: "Sistem manajemen Pramuka modern yang mengintegrasikan website publik dan dashboard administrasi.",
    images: ["/logo.jpeg"],
  },
  icons: {
    icon: "/logo.jpeg",
    shortcut: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MH SCOUT",
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
      <body className={`${poppins.variable} ${poppins.className} min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased`}>
        <GlobalTopLoader />
        {children}
      </body>
    </html>
  );
}
