'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TeacherSidebar({ teacher }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unansweredChatCount, setUnansweredChatCount] = useState(null);

  useEffect(() => {
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
  }, [pathname]);

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
  const displayRole = teacher?.specialty || 'Master Baker Atelier';
  const initials = String(displayName)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    { href: '/dashboard/teacher', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/teacher/courses', label: 'Course Management', icon: '🥐' },
    { href: '/dashboard/teacher/contents', label: 'Content Management', icon: '📖' },
    { href: '/dashboard/teacher/schedule', label: 'Schedule', icon: '🗓️' },
  ];

  const isChatActive = pathname?.startsWith('/dashboard/teacher/chat');

  return (
    <aside className="w-72 bg-[#FFFDF9] border-r border-[#341D17]/10 flex flex-col justify-between p-5 shrink-0 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-9 h-9 rounded-2xl bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-editorial font-bold text-base">
            Y
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#802924]">
              YUGYO ATELIER
            </p>
            <p className="text-sm font-extrabold text-[#341D17]">
              Instructor Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#341D17]/10 bg-[#F9E8D6]/60 p-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#802924] text-[#F9DDBB] flex items-center justify-center text-xs font-extrabold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[#341D17]">
              {displayName}
            </p>
            <p className="truncate text-xs text-[#341D17]/70">
              {displayRole}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#341D17]/45">
            INSTRUCTOR OPERATIONS
          </p>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition ${
                    active
                      ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                      : 'text-[#341D17] hover:bg-[#F9DDBB]/45'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <Link
              href="/dashboard/teacher/chats"
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold transition ${
                isChatActive
                  ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                  : 'text-[#341D17] hover:bg-[#F9DDBB]/45'
              }`}
            >
              <span className="flex items-center gap-3">
                <span>💬</span>
                <span>Chat &amp; Support</span>
              </span>
              {unansweredChatCount !== null && unansweredChatCount > 0 && (
                <span className="text-xs font-extrabold text-[#F9DDBB]">
                  {unansweredChatCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold text-[#341D17] hover:bg-[#F9DDBB]/45 transition cursor-pointer"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#341D17] text-[10px] font-extrabold text-[#F9DDBB]">
          N
        </span>
        <span>Log Out</span>
      </button>
    </aside>
  );
}