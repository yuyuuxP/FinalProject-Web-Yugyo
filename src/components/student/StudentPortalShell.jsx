'use client';

import { useState } from 'react';
import StudentSidebarNav from './StudentSidebarNav';
import StudentPortalHeader from './StudentPortalHeader';

export default function StudentPortalShell({
  student,
  unreadChatCount = 0,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#FAF6F0] text-[#341D17] flex">
      {/* SIDEBAR DIAM (TIDAK IKUT KE-SCROLL) */}
      <StudentSidebarNav
        student={student}
        unreadChatCount={unreadChatCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* KOLOM KANAN: HEADER + KONTEN YANG BISA DI-SCROLL */}
      <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">
        <StudentPortalHeader
          student={student}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}