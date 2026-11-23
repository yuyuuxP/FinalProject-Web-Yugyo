'use client';

import Link from 'next/link';

function getInitials(name) {
  const clean = String(name || 'ST').trim();
  if (!clean) return 'ST';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function StudentPortalHeader({
  studentName = 'Student',
  avatarUrl = '',
  onToggleSidebar,
}) {
  const displayName = String(studentName || 'Student').trim() || 'Student';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-[#FFFDF9]/95 backdrop-blur-xs border-b border-[#341D17]/12 px-4 sm:px-6 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {typeof onToggleSidebar === 'function' && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Buka atau tutup menu navigasi"
            className="lg:hidden w-9 h-9 rounded-xl bg-[#FAF6F0] hover:bg-[#F9DDBB]/70 border border-[#341D17]/12 flex items-center justify-center text-[#341D17] text-sm font-bold shrink-0 transition cursor-pointer"
          >
            &#9776;
          </button>
        )}

        <Link
          href="/dashboard/student"
          className="flex items-center gap-2.5 min-w-0"
        >
          <span className="w-8 h-8 rounded-lg bg-[#802924] text-[#FFFDF9] font-editorial font-bold text-sm flex items-center justify-center shrink-0">
            Y
          </span>
          <div className="min-w-0">
            <p className="font-editorial text-sm sm:text-base font-bold leading-tight text-[#802924] truncate">
              Yugyo{' '}
              <span className="rounded bg-[#F9DDBB] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#802924] align-middle">
                ATELIER
              </span>
            </p>
            <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55 truncate">
              STUDENT PORTAL &bull; USER PROFILE
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href="/"
          className="hidden md:inline-flex items-center rounded-xl bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 border border-[#341D17]/12 px-3 py-1.5 text-xs font-bold text-[#341D17] transition"
        >
          Lihat Katalog Guest
        </Link>

        <Link
          href="/dashboard/student/reviews"
          aria-label="Notifikasi & Laporan"
          className="relative w-9 h-9 rounded-full hover:bg-[#FAF6F0] flex items-center justify-center text-[#341D17]/75 transition"
        >
          <span className="text-base">&#128276;</span>
          <span className="w-2 h-2 rounded-full bg-[#802924] absolute top-2 right-2" />
        </Link>

        <Link
          href="/dashboard/student/profile"
          aria-label={`Buka profil ${displayName}`}
          className="inline-flex items-center gap-2.5 rounded-full bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 border border-[#341D17]/12 pl-1.5 pr-3 py-1 transition cursor-pointer shrink-0"
        >
          <span className="w-7 h-7 rounded-full bg-[#802924] text-[#FFFDF9] text-xs font-extrabold flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(displayName)
            )}
          </span>
          <span className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-[#341D17] truncate max-w-28">
              {displayName}
            </span>
            <span className="text-[10px] text-[#341D17]/60 truncate">
              Student Baker Atelier
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}