'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBars } from 'react-icons/fa6';

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

function getPageSubtitle(pathname) {
  if (!pathname || pathname === '/dashboard/student') return 'Dashboard';
  if (pathname.startsWith('/dashboard/student/catalog')) return 'Course Catalog';
  if (pathname.startsWith('/dashboard/student/courses')) return 'Course';
  if (pathname.startsWith('/dashboard/student/schedule')) return 'Schedule';
  if (pathname.startsWith('/dashboard/student/chats')) return 'Chat Instructor';
  if (pathname.startsWith('/dashboard/student/reviews')) return 'Ulasan';
  if (pathname.startsWith('/dashboard/student/profile')) return 'User Profile';
  return 'Student Baker Atelier';
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

  const pageSubtitle = getPageSubtitle(pathname);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#341D17]/10 px-4 sm:px-8 flex items-center justify-between gap-3 text-[#341D17]">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Buka atau tutup navigasi"
            className="lg:hidden w-9 h-9 rounded-xl bg-[#F9DDBB]/60 hover:bg-[#F9DDBB] border border-[#341D17]/15 flex items-center justify-center text-sm font-bold text-[#341D17] transition cursor-pointer shrink-0"
          >
            <FaBars className="w-4 h-4" />
          </button>
        ) : null}

        <Link
          href="/dashboard/student"
          className="lg:hidden flex items-center gap-2.5 min-w-0"
        >
          <span className="w-8 h-8 rounded-xl bg-[#802924] text-[#F9DDBB] font-editorial font-bold text-sm flex items-center justify-center shrink-0">
            Y
          </span>
        </Link>

        <div className="min-w-0">
          <h2 className="font-editorial text-base sm:text-lg text-[#341D17] leading-none truncate">
            YUGYO Student
          </h2>
          <p className="text-[11px] text-[#341D17]/65 mt-0.5 truncate">
            {pageSubtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <Link
          href="/dashboard/student/profile"
          aria-label={`Profil ${displayName}`}
          className="flex items-center gap-2.5 rounded-full hover:bg-[#F9DDBB]/40 p-1 pr-3 transition cursor-pointer"
        >
          <span className="w-9 h-9 rounded-full bg-[#802924] text-[#F9DDBB] text-xs font-extrabold flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
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
            <p className="text-xs font-extrabold text-[#341D17] truncate max-w-[140px]">
              {displayName}
            </p>
            <p className="text-[10px] text-[#341D17]/65 truncate max-w-[140px]">
              Student Baker Atelier
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}