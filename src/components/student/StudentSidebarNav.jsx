'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

const STUDENT_MENU_ITEMS = [
  {
    href: '/dashboard/student',
    label: 'Dashboard',
    icon: '📊',
  },
  {
    href: '/dashboard/student/courses',
    label: 'Course',
    icon: '📖',
  },
  {
    href: '/dashboard/student/schedule',
    label: 'Schedule',
    icon: '📅',
  },
  {
    href: '/dashboard/student/chats',
    label: 'Chat Instructor',
    icon: '💬',
    showBadge: true,
  },
  {
    href: '/dashboard/student/reviews',
    label: 'Ulasan',
    icon: '⭐',
  },
];

function subscribePathname(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function getClientPathname() {
  if (typeof window === 'undefined') return '/dashboard/student';
  return window.location.pathname || '/dashboard/student';
}

function getServerPathname() {
  return '/dashboard/student';
}

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

export default function StudentSidebarNav({
  student,
  unreadChatCount = 0,
  mobileOpen = false,
  onCloseMobile,
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const currentPath = useSyncExternalStore(
    subscribePathname,
    getClientPathname,
    getServerPathname
  );

  const studentName = student?.full_name || 'Siswa Atelier';
  const studentRoleLabel = student?.specialty || 'Student Baker Atelier';

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Abaikan error jaringan saat logout
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const renderNavContent = () => (
    <div
      suppressHydrationWarning
      className="flex h-full w-64 flex-col justify-between border-r border-[#341D17]/12 bg-[#FFFDF9] text-[#341D17]"
    >
      <div className="p-4 sm:p-5 space-y-5 overflow-y-auto">
        {/* LOGO & BRAND */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/dashboard/student"
            onClick={() => onCloseMobile?.()}
            className="flex items-center gap-3 min-w-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#802924] font-editorial text-sm font-bold text-[#FFFDF9]">
              Y
            </span>
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#802924] leading-tight">
                YUGYO ATELIER
              </span>
              <span className="block text-sm font-bold text-[#341D17] leading-tight truncate">
                Student Portal
              </span>
            </div>
          </Link>

          {typeof onCloseMobile === 'function' && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup navigasi"
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] text-xs font-bold text-[#341D17] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* KARTU PROFIL SISWA */}
        <div className="rounded-2xl border border-[#341D17]/10 bg-[#F9DDBB]/45 p-3.5 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#802924] text-xs font-extrabold text-[#FFFDF9]">
            {getInitials(studentName)}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#341D17] truncate">
              {studentName}
            </p>
            <p className="text-[11px] text-[#341D17]/65 truncate">
              {studentRoleLabel}
            </p>
          </div>
        </div>

        {/* LABEL GRUP & 5 MENU UTAMA (TANPA USER PROFILE) */}
        <div className="space-y-2">
          <p className="px-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#341D17]/50">
            STUDENT OPERATIONS
          </p>

          <nav aria-label="Menu Siswa" className="space-y-1">
            {STUDENT_MENU_ITEMS.map((item) => {
              const active =
                item.href === '/dashboard/student'
                  ? currentPath === '/dashboard/student'
                  : currentPath === item.href ||
                    currentPath?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onCloseMobile?.()}
                  className={`flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    active
                      ? 'bg-[#802924] text-[#FFFDF9] shadow-2xs'
                      : 'text-[#341D17]/80 hover:bg-[#FAF6F0] hover:text-[#341D17]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </span>

                  {item.showBadge && unreadChatCount > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        active
                          ? 'bg-[#FFFDF9]/20 text-[#FFFDF9]'
                          : 'bg-[#F9DDBB] text-[#802924]'
                      }`}
                    >
                      {unreadChatCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* LOG OUT DI BAGIAN BAWAH */}
      <div className="border-t border-[#341D17]/10 p-4 bg-[#FFFDF9]">
        <button
          type="button"
          disabled={loggingOut}
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#341D17]/85 hover:bg-[#FAF6F0] hover:text-[#802924] transition cursor-pointer disabled:opacity-50"
        >
          <span className="text-sm">↪</span>
          <span>{loggingOut ? 'Logging out...' : 'Log Out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div suppressHydrationWarning className="h-full shrink-0">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            onClick={() => onCloseMobile?.()}
            className="fixed inset-0 bg-black/35"
          />
          <div className="relative z-50 h-full">{renderNavContent()}</div>
        </div>
      )}

      <aside className="hidden lg:block h-full shrink-0">{renderNavContent()}</aside>
    </div>
  );
}