'use client';

import Link from 'next/link';

function getInitials(name) {
  const parts = String(name || 'Siswa')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'S';
  return parts
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function StudentPortalHeader({ student, onOpenMobileMenu }) {
  const studentName = student?.full_name || 'Siswa Atelier';
  const studentRoleLabel = student?.specialty || 'Student Baker Atelier';

  return (
    <header className="sticky top-0 z-30 border-b border-[#341D17]/10 bg-[#FFFDF9]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* SISI KIRI: TOMBOL HAMBURGER (MOBILE) + LOGO YUGYO ATELIER */}
        <div className="flex items-center gap-3 min-w-0">
          {typeof onOpenMobileMenu === 'function' && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="Buka navigasi"
              className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] text-sm font-bold text-[#341D17] hover:bg-[#F9DDBB]/50 transition cursor-pointer"
            >
              ☰
            </button>
          )}

          <Link
            href="/dashboard/student"
            className="flex items-center gap-3 min-w-0"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#802924] font-editorial text-base font-bold text-[#F9DDBB] shadow-2xs">
              Y
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-editorial text-lg sm:text-xl font-bold text-[#341D17] leading-none">
                  Yugyo
                </span>
                <span className="rounded-md bg-[#F9DDBB] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#802924]">
                  ATELIER
                </span>
              </div>
              <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#341D17]/60 leading-none">
                STUDENT PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* SISI KANAN: LIHAT KATALOG GUEST + PILL PROFIL SISWA */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="rounded-full border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] px-4 py-2 text-xs font-bold text-[#341D17] transition whitespace-nowrap"
          >
            Lihat Katalog Guest
          </Link>

          <div className="flex items-center gap-2.5 rounded-full border border-[#341D17]/12 bg-[#FFFDF9] py-1 pl-1.5 pr-3.5 shadow-2xs">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#802924] text-[11px] font-extrabold text-[#FFFDF9]">
              {getInitials(studentName)}
            </span>

            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-bold text-[#341D17]">
                {studentName}
              </p>
              <p className="text-[10px] text-[#341D17]/65">
                {studentRoleLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}