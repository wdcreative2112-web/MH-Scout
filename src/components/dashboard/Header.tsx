"use client";

import React, { useState } from "react";
import { UserSession } from "@/types";
import { logoutAction } from "@/actions/auth";
import { DashboardSidebar } from "./Sidebar";
import { Menu, X, LogOut, Bell, Shield, User } from "lucide-react";

interface HeaderProps {
  session: UserSession;
}

export function DashboardHeader({ session }: HeaderProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Mobile drawer toggle */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
              Sistem Manajemen Pramuka
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Gugus Depan PramukaOne
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {session.role}
              </span>
            </div>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-right">
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">{session.name}</p>
              <p className="text-[11px] text-slate-500 leading-tight">{session.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-scout-800 text-white font-bold text-xs flex items-center justify-center">
              {session.name.charAt(0)}
            </div>
          </div>

          <form action={logoutAction} className="inline-block">
            <button
              type="submit"
              title="Logout"
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <DashboardSidebar session={session} onCloseMobile={() => setMobileDrawerOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
