'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaChartPie,
  FaCakeCandles,
  FaBookOpen,
  FaCalendarDays,
  FaComments,
  FaStar,
  FaRightFromBracket,
} from 'react-icons/fa6';

const NAV_ITEMS = [
  { href: '/dashboard/student', label: 'Dashboard', Icon: FaChartPie },
  {
    href: '/dashboard/student/catalog',
    label: 'Course Catalog',
    Icon: FaCakeCandles,
  },
  { href: '/dashboard/student/courses', label: 'Course', Icon: FaBookOpen },
  {
    href: '/dashboard/student/schedule',
    label: 'Schedule',
    Icon: FaCalendarDays,
  },
  {
    href: '/dashboard/student/chats',
    label: 'Chat Instructor',
    Icon: FaComments,
  },
  { href: '/dashboard/student/reviews', label: 'Ulasan', Icon: FaStar },
];

function getInitials(name) {
  const clean = String(name || 'ST').trim();
  if (!clean) return 'ST';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function StudentSidebarNav({
  studentName = 'Student',
  avatarUrl = '',
  unreadChatCount = 0,
  onNavigate,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const displayName = String(studentName || 'Student').trim() || 'Student';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // Abaikan error storage
    }
    router.push('/login');
  };

  return (
    <aside className="w-64 h-full overflow-y-auto bg-[#FFFDF9] border-r border-[#341D17]/15 flex flex-col justify-between p-5 shrink-0 text-[#341D17]">
      <div className="space-y-5">
        <Link
          href="/dashboard/student"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <span className="w-9 h-9 rounded-xl overflow-hidden bg-[#802924] border border-[#341D17]/15 flex items-center justify-center shadow-xs shrink-0">
            <img
              src="/yugyo.png"
              alt="Maskot Chef YUGYO"
              className="w-full h-full object-cover object-center"
            />
          </span>
          <div>
            <p className="font-editorial text-base font-bold leading-none text-[#341D17]">
              YUGYO
            </p>
            <p className="text-[9px] font-extrabold tracking-[0.2em] uppercase text-[#802924] mt-0.5">
              STUDENT PORTAL
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/student/profile"
          onClick={onNavigate}
          aria-label={`Buka halaman profil ${displayName}`}
          className={`flex items-center justify-between gap-2 rounded-2xl border p-3 transition cursor-pointer ${
            pathname === '/dashboard/student/profile'
              ? 'bg-[#F9DDBB]/75 border-[#802924]/30'
              : 'bg-[#F9DDBB]/45 hover:bg-[#F9DDBB]/65 border-[#341D17]/10'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-full bg-[#802924] text-[#F9DDBB] text-xs font-extrabold flex items-center justify-center overflow-hidden shrink-0">
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
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#341D17] leading-tight truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-[#341D17]/70 truncate">
                Student Baker Atelier
              </p>
            </div>
          </div>
          <span
            className="w-2 h-2 rounded-full bg-[#82882B] shrink-0"
            title="Online"
          />
        </Link>

        <div className="space-y-1">
          <p className="px-3 text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#341D17]/45 mb-2">
            STUDENT OPERATIONS
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const NavIcon = item.Icon;
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard/student' &&
                  pathname?.startsWith(`${item.href}/`));
              const showUnread =
                item.href === '/dashboard/student/chats' &&
                Number(unreadChatCount) > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    active
                      ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                      : 'text-[#341D17]/80 hover:bg-[#F9DDBB]/55 hover:text-[#341D17]'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <NavIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {showUnread && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        active
                          ? 'bg-[#F9DDBB] text-[#802924]'
                          : 'bg-[#802924] text-[#F9DDBB]'
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

      <div className="pt-4 border-t border-[#341D17]/10">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-[#802924] hover:bg-[#802924]/10 transition cursor-pointer"
        >
          <FaRightFromBracket className="w-3.5 h-3.5 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}