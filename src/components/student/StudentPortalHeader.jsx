'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function getInitials(name) {
  const clean = String(name || 'ST').trim();
  if (!clean) return 'ST';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function readStoredStudentName(fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw =
      window.sessionStorage.getItem('yugyo_auth_user') ||
      window.localStorage.getItem('yugyo_auth_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      const u = parsed?.user || parsed;
      const name = String(
        u?.full_name || u?.fullName || u?.username || u?.name || ''
      ).trim();
      if (name && name.toLowerCase() !== 'student') return name;
    }
  } catch {
    // Abaikan error storage
  }
  return fallback;
}

export default function StudentPortalHeader({
  studentName = 'Student',
  avatarUrl = '',
  onToggleSidebar,
}) {
  const pathname = usePathname();
  const initialName = String(studentName || 'Student').trim() || 'Student';
  const [displayName, setDisplayName] = useState(initialName);

  useEffect(() => {
    const resolved = readStoredStudentName(initialName);
    const id = window.setTimeout(() => {
      setDisplayName(resolved);
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialName]);

  const isProfilePage = pathname === '/dashboard/student/profile';
  const subLabel = isProfilePage
    ? 'STUDENT PORTAL • USER PROFILE'
    : 'STUDENT BAKER ATELIER';

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FFFDF9]/95 backdrop-blur-xs border-b border-[#341D17]/12 px-4 sm:px-6 flex items-center justify-between gap-3 text-[#341D17]">
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleSidebar ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Buka atau tutup navigasi"
            className="lg:hidden w-9 h-9 rounded-xl bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 border border-[#341D17]/12 flex items-center justify-center text-sm font-bold text-[#341D17] transition cursor-pointer shrink-0"
          >
            &#9776;
          </button>
        ) : null}

        <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
          <span className="w-8 h-8 rounded-lg bg-[#802924] text-[#FFFDF9] font-editorial font-bold text-sm flex items-center justify-center shrink-0">
            Y
          </span>
          <div className="min-w-0">
            <p className="font-editorial text-sm font-bold leading-tight text-[#341D17] group-hover:text-[#802924] transition truncate">
              Yugyo{' '}
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                ATELIER
              </span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#341D17]/55 truncate">
              {subLabel}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <span
          aria-hidden="true"
          className="hidden sm:inline-flex w-8 h-8 rounded-full bg-[#FAF6F0] border border-[#341D17]/10 items-center justify-center text-xs text-[#802924]"
        >
          &#128276;
        </span>

        <Link
          href="/dashboard/student/profile"
          aria-label={`Profil ${displayName}`}
          className="flex items-center gap-2 rounded-full hover:bg-[#FAF6F0] p-1 pr-2.5 transition cursor-pointer"
        >
          <span className="w-8 h-8 rounded-full bg-[#802924] text-[#FFFDF9] text-xs font-extrabold flex items-center justify-center overflow-hidden shrink-0">
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
          <div className="hidden md:block text-left leading-tight">
            <p className="text-xs font-bold text-[#341D17] truncate max-w-[120px]">
              {displayName}
            </p>
            <p className="text-[10px] text-[#341D17]/55 truncate">
              Student Baker Atelier
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}