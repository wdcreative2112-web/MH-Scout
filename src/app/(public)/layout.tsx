import React from "react";
import { PublicNavbar } from "@/components/public/Navbar";
import { PublicFooter } from "@/components/public/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden bg-[#f7faf8]">
      {/* Subtle organic ambient glowing meshes with breathing animations */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none z-0 overflow-hidden opacity-70">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[350px] bg-teal-300/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-48 left-1/3 w-80 h-80 bg-amber-300/10 rounded-full blur-3xl animate-float-gentle" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <PublicNavbar />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}
