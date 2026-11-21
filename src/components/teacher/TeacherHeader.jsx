'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TeacherHeader({
  teacher,
  onOpenMobileMenu,
}) {
  const pathname = usePathname();

  const displayName = teacher?.full_name || teacher?.name || 'Ayu';
  const displayRole = teacher?.specialty || 'Master Baker Atelier';
  const initials = String(displayName)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AY';

  const isProfileActive = pathname?.startsWith('/dashboard/teacher/profile');

  return (
    <header className="sticky top-0 z-30 border-b border-[#341D17]/10 bg-[#FFFDF9]/95 backdrop-blur-xs px-3 sm:px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {typeof onOpenMobileMenu === 'function' && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] text-sm font-bold text-[#341D17] hover:bg-[#F9DDBB]/45 transition cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              ☰
            </button>
          )}

          <Link
            href="/dashboard/teacher"
            className="flex items-center gap-2.5 min-w-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#802924] font-editorial text-base font-bold text-[#F9DDBB]">
              Y
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-editorial text-sm sm:text-base font-bold text-[#341D17] truncate">
                  Yugyo
                </span>
                <span className="rounded-md bg-[#F9DDBB] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                  ATELIER
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#341D17]/60 truncate">
                INSTRUCTOR PORTAL
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/45 px-3.5 py-1.5 text-xs font-bold text-[#341D17] transition"
          >
            <span>Lihat Katalog Guest</span>
          </Link>

          <Link
            href="/dashboard/teacher/profile"
            title={`Profil ${displayName}`}
            className={`group flex items-center gap-2.5 rounded-full border py-1 pl-1 pr-2.5 sm:pr-3 transition ${
              isProfileActive
                ? 'border-[#802924] bg-[#F9DDBB]/60'
                : 'border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/40'
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#802924] text-xs font-extrabold text-[#F9DDBB] group-hover:bg-[#661F1B] transition">
              {initials}
            </span>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-extrabold text-[#341D17] truncate max-w-[140px]">
                {displayName}
              </p>
              <p className="text-[10px] text-[#341D17]/65 truncate max-w-[140px]">
                {displayRole}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}