'use client';

import { useEffect, useState } from 'react';
import StudentPortalHeader from './StudentPortalHeader';
import StudentSidebarNav from './StudentSidebarNav';

const BLOCKED_LABELS = new Set([
  'yugyo',
  'yugyo atelier',
  'student',
  'student portal',
  'student portal • user profile',
  'student baker atelier',
  'portal akun siswa',
  'profil pengguna siswa',
  'lihat katalog guest',
  'dashboard',
  'course',
  'course catalog',
  'schedule',
  'chat instructor',
  'ulasan',
  'log out',
]);

function isBlockedStudentName(value) {
  const clean = String(value || '').trim();
  if (!clean) return true;
  const lower = clean.toLowerCase();
  if (BLOCKED_LABELS.has(lower)) return true;
  if (
    lower.includes('admin') ||
    lower.includes('teacher') ||
    lower.includes('instructor')
  ) {
    return true;
  }
  if (clean.length > 36) return true;
  return false;
}

function pickStudentName(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const candidates = [
    obj.full_name,
    obj.fullName,
    obj.name,
    obj.username,
    obj.user_name,
    obj.userName,
  ];
  for (const raw of candidates) {
    const clean = String(raw || '').trim();
    if (!isBlockedStudentName(clean)) return clean;
  }
  return '';
}

function detectStudentFromStorage(storage) {
  if (!storage) return '';
  try {
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i) || '';
      const raw = storage.getItem(key);
      if (!raw) continue;
      if (!isBlockedStudentName(raw)) return raw.trim();
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') continue;
        const role = String(
          parsed.role ||
            parsed.user?.role ||
            parsed.currentUser?.role ||
            parsed.data?.role ||
            ''
        ).toLowerCase();
        if (role === 'admin' || role === 'teacher' || role === 'instructor') {
          continue;
        }
        const found =
          pickStudentName(parsed) ||
          pickStudentName(parsed.user) ||
          pickStudentName(parsed.currentUser) ||
          pickStudentName(parsed.data) ||
          pickStudentName(parsed.data?.user);
        if (found) return found;
      } catch {
        // Abaikan nilai non-JSON
      }
    }
  } catch {
    // Abaikan error akses storage
  }
  return '';
}

function detectStudentFromGreetingDom() {
  if (typeof document === 'undefined') return '';
  try {
    const headings = document.querySelectorAll('main h1, main h2');
    for (const el of headings) {
      const text = String(el.textContent || '').trim();
      const match = text.match(/^Halo,\s*([^!?\n,]+)/i);
      if (match?.[1]) {
        const candidate = match[1].trim();
        if (!isBlockedStudentName(candidate)) return candidate;
      }
    }
  } catch {
    // Abaikan error DOM
  }
  return '';
}

export default function StudentPortalShell({
  children,
  student = null,
  studentName = 'Student',
  avatarUrl = '',
  unreadChatCount = 0,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientAvatar, setClientAvatar] = useState('');

  const resolvedPropName = student?.full_name || studentName;
  const propName = !isBlockedStudentName(resolvedPropName)
    ? String(resolvedPropName).trim()
    : '';
  const activeName = propName || clientName || 'Student';
  const activeAvatar = avatarUrl || clientAvatar || '';

  useEffect(() => {
    let cancelled = false;

    const resolveSync = () => {
      if (typeof window === 'undefined' || cancelled) return;
      const fromGreeting = detectStudentFromGreetingDom();
      const fromSession = detectStudentFromStorage(window.sessionStorage);
      const fromLocal = detectStudentFromStorage(window.localStorage);
      const resolved = propName || fromGreeting || fromSession || fromLocal;
      if (resolved) {
        setClientName(resolved);
      }
    };

    const t1 = setTimeout(resolveSync, 0);
    const t2 = setTimeout(resolveSync, 150);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [propName]);

  return (
    <div className="min-h-screen bg-[#F9DDBB] text-[#341D17] flex">
      <aside className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 z-30">
        <StudentSidebarNav
          studentName={activeName}
          avatarUrl={activeAvatar}
          unreadChatCount={unreadChatCount}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="relative z-10 h-full">
            <StudentSidebarNav
              studentName={activeName}
              avatarUrl={activeAvatar}
              unreadChatCount={unreadChatCount}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            onClick={() => setMobileOpen(false)}
            className="flex-1 bg-[#2A1712]/45 cursor-pointer"
          />
        </div>
      )}

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <StudentPortalHeader
          studentName={activeName}
          avatarUrl={activeAvatar}
          onToggleSidebar={() => setMobileOpen((prev) => !prev)}
        />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}