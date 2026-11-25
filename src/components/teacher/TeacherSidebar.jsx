'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FaChartPie,
  FaBreadSlice,
  FaBookOpen,
  FaCalendarDays,
  FaComments,
  FaLock,
  FaRightFromBracket,
} from 'react-icons/fa6';

export default function TeacherSidebar({ teacher }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unansweredChatCount, setUnansweredChatCount] = useState(null);
  const isPending = String(teacher?.status || '').trim().toLowerCase() === 'pending';

  useEffect(() => {
    if (isPending) {
      return undefined;
    }

    let active = true;

    const syncUnansweredChats = async () => {
      try {
        const res = await fetch('/api/chat', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!active || !Array.isArray(data?.threads)) return;

        const pending = data.threads.filter(
          (t) => t.review_status !== 'answered'
        ).length;
        setUnansweredChatCount(pending);
      } catch {
        // abaikan gangguan jaringan sementara
      }
    };

    syncUnansweredChats();
    const timer = setInterval(syncUnansweredChats, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isPending, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // lanjut redirect
    }
    router.push('/login');
    router.refresh();
  };

  const displayName = teacher?.full_name || teacher?.name || 'Ayu';
  const displayRole = isPending
    ? 'Menunggu persetujuan'
    : teacher?.specialty || 'Master Baker Atelier';
  const initials = String(displayName)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    {
      href: '/dashboard/teacher',
      label: 'Dashboard',
      Icon: FaChartPie,
    },
    {
      href: '/dashboard/teacher/courses',
      label: 'Course Management',
      Icon: FaBreadSlice,
    },
    {
      href: '/dashboard/teacher/contents',
      label: 'Content Management',
      Icon: FaBookOpen,
    },
    {
      href: '/dashboard/teacher/schedule',
      label: 'Schedule',
      Icon: FaCalendarDays,
    },
  ];

  const isChatActive = pathname?.startsWith('/dashboard/teacher/chat');

  return (
    <aside className="w-64 h-full overflow-y-auto bg-[#FFFDF9] border-r border-[#341D17]/15 flex flex-col justify-between p-5 shrink-0 text-[#341D17]">
      <div>
        {/* BRAND */}
        <Link href="/dashboard/teacher" className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-editorial font-bold text-base shadow-xs shrink-0">
            Y
          </div>
          <div>
            <span className="font-editorial font-bold text-base text-[#341D17] block leading-none">
              YUGYO
            </span>
            <span className="text-[9px] font-extrabold tracking-[0.2em] uppercase text-[#802924]">
              INSTRUCTOR PORTAL
            </span>
          </div>
        </Link>

        {/* PROFILE CARD */}
        <div className="bg-[#F9DDBB]/45 border border-[#341D17]/10 rounded-2xl p-3 mb-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center text-xs font-extrabold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-[#341D17] leading-tight">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-[#341D17]/70">
                {displayRole}
              </p>
            </div>
          </div>
          {isPending ? (
            <FaLock className="h-3 w-3 shrink-0 text-amber-700" title="Akun menunggu persetujuan" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#82882B] shrink-0" title="Online" />
          )}
        </div>

        {/* NAVIGATION */}
        <div>
          <p className="px-3 text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#341D17]/45 mb-2">
            INSTRUCTOR OPERATIONS
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const NavIcon = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    active
                      ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                      : 'text-[#341D17]/80 hover:bg-[#F9DDBB]/55 hover:text-[#341D17]'
                  }`}
                >
                  <NavIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {isPending && (
                    <FaLock
                      className="ml-auto h-3 w-3 shrink-0 text-amber-700"
                      aria-label="Terkunci"
                    />
                  )}
                </Link>
              );
            })}

            <Link
              href="/dashboard/teacher/chats"
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                isChatActive
                  ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                  : 'text-[#341D17]/80 hover:bg-[#F9DDBB]/55 hover:text-[#341D17]'
              }`}
            >
              <span className="flex items-center gap-3">
                <FaComments className="w-3.5 h-3.5 shrink-0" />
                <span>Chat &amp; Support</span>
              </span>
              {isPending ? (
                <FaLock
                  className="h-3 w-3 shrink-0 text-amber-700"
                  aria-label="Terkunci"
                />
              ) : unansweredChatCount !== null && unansweredChatCount > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    isChatActive
                      ? 'bg-[#F9DDBB] text-[#802924]'
                      : 'bg-[#802924] text-[#F9DDBB]'
                  }`}
                >
                  {unansweredChatCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </div>

      {/* LOGOUT */}
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