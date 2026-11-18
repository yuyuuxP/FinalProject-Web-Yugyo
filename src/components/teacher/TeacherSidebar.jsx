'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TeacherSidebar({ teacher }) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard/teacher', icon: '📊' },
    { name: 'Course Management', href: '/dashboard/teacher/courses', icon: '🥐' },
    { name: 'Content Management', href: '/dashboard/teacher/contents', icon: '📖' },
    { name: 'Schedule', href: '/dashboard/teacher/schedule', icon: '📅' },
    { name: 'Chat & Support', href: '/dashboard/teacher/chats', icon: '💬', badge: '2' },
  ];

  // Ambil inisial nama untuk avatar (contoh: "Antoine Dupont" -> "AD")
  const getInitials = (name) => {
    if (!name) return 'CD';
    const parts = name.replace('Chef ', '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const fullName = teacher?.full_name || 'Chef Pengajar';
  const initials = getInitials(fullName);

  return (
    <aside className="w-full md:w-72 bg-[#FFFDF9] border-r border-[#341D17]/10 flex flex-col justify-between p-5 shrink-0">
      <div className="space-y-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-2xl bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-editorial font-bold text-sm shadow-sm">
            Y
          </div>
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#802924] leading-none">
              YUGYO ATELIER
            </p>
            <p className="text-xs font-bold text-[#341D17]">Instructor Portal</p>
          </div>
        </div>

        {/* Profile Card Ringkas di Sidebar (Dinamis dari Database) */}
        <div className="bg-[#F9DDBB]/30 border border-[#341D17]/10 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#341D17] truncate">{fullName}</p>
            <p className="text-[10px] text-[#802924] font-medium">Master Baker Atelier</p>
          </div>
        </div>

        {/* MENU NAVIGASI */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/40 px-3 mb-2">
            INSTRUCTOR OPERATIONS
          </p>

          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                    : 'text-[#341D17] hover:bg-[#F9DDBB]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-[#802924] text-[#F9DDBB] text-[10px] flex items-center justify-center font-extrabold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

      </div>

      {/* Footer Sidebar / Logout */}
      <div className="pt-6 border-t border-[#341D17]/10 mt-6">
        <Link
          href="/login"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-[#802924] hover:bg-[#802924]/10 transition"
        >
          <span>🚪</span>
          <span>Log Out</span>
        </Link>
      </div>
    </aside>
  );
}