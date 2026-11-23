'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard/student', label: 'Dashboard', icon: '&#128202;' },
  {
    href: '/dashboard/student/catalog',
    label: 'Course Catalog',
    icon: '&#127856;',
  },
  { href: '/dashboard/student/courses', label: 'Course', icon: '&#128218;' },
  { href: '/dashboard/student/schedule', label: 'Schedule', icon: '&#128197;' },
  {
    href: '/dashboard/student/chats',
    label: 'Chat Instructor',
    icon: '&#128172;',
  },
  { href: '/dashboard/student/reviews', label: 'Ulasan', icon: '&#11088;' },
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
    <aside className="w-64 shrink-0 h-screen overflow-y-auto bg-[#FFFDF9] border-r border-[#341D17]/12 flex flex-col justify-between p-4 text-[#341D17]">
      <div className="space-y-5">
        <div className="flex items-center gap-2.5 px-1">
          <span className="w-8 h-8 rounded-lg bg-[#802924] text-[#FFFDF9] font-editorial font-bold text-sm flex items-center justify-center shrink-0">
            Y
          </span>
          <div>
            <p className="font-editorial text-sm font-bold leading-tight text-[#341D17]">
              YUGYO ATELIER
            </p>
            <p className="text-[11px] text-[#341D17]/60">Student Portal</p>
          </div>
        </div>

        <Link
          href="/dashboard/student/profile"
          onClick={onNavigate}
          aria-label={`Buka halaman profil ${displayName}`}
          className={`flex items-center gap-3 rounded-2xl border p-3 transition cursor-pointer ${
            pathname === '/dashboard/student/profile'
              ? 'bg-[#F9DDBB]/75 border-[#802924]/30'
              : 'bg-[#FAF6F0] hover:bg-[#F9DDBB]/55 border-[#341D17]/10'
          }`}
        >
          <span className="w-9 h-9 rounded-full bg-[#802924] text-[#FFFDF9] text-xs font-extrabold flex items-center justify-center overflow-hidden shrink-0">
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
            <p className="text-xs font-bold text-[#341D17] truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-[#341D17]/60 truncate">
              Student Baker Atelier
            </p>
          </div>
        </Link>

        <div className="space-y-1">
          <p className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/45">
            STUDENT OPERATIONS
          </p>
          <nav className="space-y-1 pt-1">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard/student' &&
                  pathname?.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition ${
                    active
                      ? 'bg-[#802924] text-[#FFFDF9]'
                      : 'text-[#341D17]/75 hover:bg-[#FAF6F0] hover:text-[#341D17]'
                  }`}
                >
                  <span
                    className="text-xs shrink-0"
                    dangerouslySetInnerHTML={{ __html: item.icon }}
                  />
                  <span className="truncate">{item.label}</span>
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
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-[#341D17]/75 hover:bg-[#802924]/10 hover:text-[#802924] transition cursor-pointer"
        >
          <span>&#8618;</span>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}