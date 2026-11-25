'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBars } from 'react-icons/fa6';

function getInitials(name) {
  const clean = String(name || 'TC').trim();
  if (!clean) return 'TC';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function getPageSubtitle(pathname) {
  if (!pathname || pathname === '/dashboard/teacher') return 'Dashboard';
  if (pathname.startsWith('/dashboard/teacher/courses')) return 'Course Management';
  if (pathname.startsWith('/dashboard/teacher/contents')) return 'Content Management';
  if (pathname.startsWith('/dashboard/teacher/schedule')) return 'Schedule';
  if (pathname.startsWith('/dashboard/teacher/chat')) return 'Chat & Support';
  if (pathname.startsWith('/dashboard/teacher/profile')) return 'User Profile';
  return 'Instructor Portal';
}

export default function TeacherPortalHeader({
  teacher,
  teacherName,
  avatarUrl = '',
  onToggleSidebar,
}) {
  const pathname = usePathname();
  const resolvedName =
    teacher?.full_name || teacher?.name || teacherName || 'Instructor';
  const displayName = String(resolvedName).trim() || 'Instructor';
  const displayRole = teacher?.specialty || 'Master Baker Atelier';
  const pageSubtitle = getPageSubtitle(pathname);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#341D17]/10 px-4 sm:px-8 flex items-center justify-between gap-3 text-[#341D17]">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Buka atau tutup navigasi"
            className="lg:hidden w-9 h-9 rounded-xl bg-[#F9DDBB]/60 hover:bg-[#F9DDBB] border border-[#341D17]/15 flex items-center justify-center text-sm font-bold text-[#341D17] transition cursor-pointer shrink-0"
          >
            <FaBars className="w-4 h-4" />
          </button>
        )}

        <Link
          href="/dashboard/teacher"
          className="lg:hidden flex items-center gap-2.5 min-w-0"
        >
          <span className="w-8 h-8 rounded-xl bg-[#802924] text-[#F9DDBB] font-editorial font-bold text-sm flex items-center justify-center shrink-0">
            Y
          </span>
        </Link>

        <div className="min-w-0">
          <h2 className="font-editorial font-bold text-base sm:text-lg text-[#341D17] leading-none truncate">
            YUGYO Instructor
          </h2>
          <p className="text-[11px] text-[#341D17]/65 mt-0.5 truncate">
            {pageSubtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <Link
          href="/dashboard/teacher/profile"
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
              {displayRole}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}