'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ATELIER_MENU = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: '⊞' },
  { label: 'Course Management', href: '/dashboard/admin/courses', icon: '🎓' },
  { label: 'Category Management', href: '/dashboard/admin/categories', icon: '🗂️' },
  { label: 'Users Management', href: '/dashboard/admin/users', icon: '👥' },
  { label: 'Schedule', href: '/dashboard/admin/schedule', icon: '📅' },
  { label: 'Reports Management', href: '/dashboard/admin/reports', icon: '📊' },
];

const SYSTEM_MENU = [
  { label: 'Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
];

// 1. SidebarContent dipindah ke luar komponen utama AdminShell
function SidebarContent({ onClose }) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col justify-between bg-[#FFFDF9] border-r border-[#341D17]/15 text-[#341D17] p-5">
      <div>
        <div className="flex items-center justify-between mb-5">
          <Link href="/dashboard/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-editorial font-bold text-base shadow-xs">
              Y
            </div>
            <div>
              <span className="font-editorial font-bold text-base text-[#341D17] block leading-none">
                YUGYO
              </span>
              <span className="text-[9px] font-extrabold tracking-[0.2em] uppercase text-[#802924]">
                ACADEMY ATELIER
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Menu"
              className="lg:hidden w-8 h-8 rounded-lg hover:bg-[#F9DDBB]/60 flex items-center justify-center text-[#341D17] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="bg-[#F9DDBB]/45 border border-[#341D17]/10 rounded-2xl p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center text-xs font-bold shrink-0">
              👤
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#341D17] leading-tight">Admin Yugyo</p>
              <p className="text-[10px] text-[#341D17]/70">Head Atelier Director</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#82882B]" title="Online" />
        </div>

        <div className="space-y-5">
          <div>
            <p className="px-3 text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#341D17]/45 mb-2">
              ATELIER OPERATIONS
            </p>
            <nav className="space-y-1">
              {ATELIER_MENU.map((item) => {
                const isActive =
                  item.href === '/dashboard/admin'
                    ? pathname === '/dashboard/admin'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                        : 'text-[#341D17]/80 hover:bg-[#F9DDBB]/55 hover:text-[#341D17]'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="px-3 text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#341D17]/45 mb-2">
              SYSTEM
            </p>
            <nav className="space-y-1">
              {SYSTEM_MENU.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                        : 'text-[#341D17]/80 hover:bg-[#F9DDBB]/55 hover:text-[#341D17]'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#341D17]/10">
        <Link
          href="/login"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-[#802924] hover:bg-[#802924]/10 transition"
        >
          <span>🚪</span>
          <span>Log Out</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9DDBB] text-[#341D17] flex">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 z-30">
        <SidebarContent />
      </aside>

      {/* DRAWER MOBILE */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-[#341D17]/45 backdrop-blur-xs"
          />
          <aside className="relative w-72 max-w-[82vw] h-full z-10 shadow-2xl">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#341D17]/10 px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka Navigasi"
              className="lg:hidden w-9 h-9 rounded-xl bg-[#F9DDBB]/60 hover:bg-[#F9DDBB] border border-[#341D17]/15 flex items-center justify-center text-[#341D17] cursor-pointer transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h2 className="font-editorial font-bold text-base sm:text-lg text-[#341D17] leading-none">
                YUGYO Admin
              </h2>
              <p className="text-[11px] text-[#341D17]/65 mt-0.5">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 bg-[#F9DDBB] hover:bg-[#f3ce9b] text-[#802924] px-4 py-2 rounded-2xl text-xs font-bold transition shadow-2xs"
            >
              <span>👁️</span>
              <span>Lihat Katalog Guest</span>
            </Link>

            <button
              type="button"
              aria-label="Notifikasi"
              className="relative w-9 h-9 rounded-full bg-[#F9DDBB]/45 hover:bg-[#F9DDBB] flex items-center justify-center text-[#341D17] transition cursor-pointer"
            >
              <span>🔔</span>
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#802924]" />
            </button>

            <Link
              href="/dashboard/admin/profile"
              className="w-9 h-9 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center text-xs font-bold shadow-xs"
            >
              👤
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}