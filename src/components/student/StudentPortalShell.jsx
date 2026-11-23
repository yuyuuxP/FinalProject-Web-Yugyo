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
    obj.username,
    obj.user_name,
    obj.userName,
    obj.full_name,
    obj.fullName,
    obj.name,
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
  studentName = 'Student',
  avatarUrl = '',
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientAvatar, setClientAvatar] = useState('');

  const propName = !isBlockedStudentName(studentName)
    ? String(studentName).trim()
    : '';
  const activeName = clientName || propName || 'Student';
  const activeAvatar = clientAvatar || avatarUrl || '';

  useEffect(() => {
    let cancelled = false;

    const resolveAsync = () => {
      if (typeof window === 'undefined' || cancelled) return;
      const fromLocal = detectStudentFromStorage(window.localStorage);
      const fromSession = detectStudentFromStorage(window.sessionStorage);
      const fromGreeting = detectStudentFromGreetingDom();
      const resolved = fromLocal || fromSession || fromGreeting;
      if (resolved) {
        setClientName(resolved);
      }
    };

    const t1 = setTimeout(resolveAsync, 0);
    const t2 = setTimeout(resolveAsync, 150);

    Promise.all(
      ['/api/auth/session', '/api/auth/me', '/api/session'].map((url) =>
        fetch(url, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json().catch(() => null) : null))
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      for (const data of results) {
        if (!data || typeof data !== 'object') continue;
        const found =
          pickStudentName(data) ||
          pickStudentName(data.user) ||
          pickStudentName(data.session?.user) ||
          pickStudentName(data.data?.user);
        if (found) {
          setClientName(found);
          const foundAvatar = String(
            data.avatarUrl ||
              data.user?.avatar_url ||
              data.user?.avatarUrl ||
              data.session?.user?.avatar_url ||
              ''
          ).trim();
          if (foundAvatar) setClientAvatar(foundAvatar);
          return;
        }
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#FAF6F0] text-[#341D17] flex">
      <div className="hidden lg:block lg:h-screen lg:sticky lg:top-0 shrink-0">
        <StudentSidebarNav
          studentName={activeName}
          avatarUrl={activeAvatar}
        />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="relative z-10 h-screen">
            <StudentSidebarNav
              studentName={activeName}
              avatarUrl={activeAvatar}
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

      <div className="flex-1 min-w-0 flex flex-col lg:h-screen lg:overflow-hidden">
        <StudentPortalHeader
          studentName={activeName}
          avatarUrl={activeAvatar}
          onToggleSidebar={() => setMobileOpen((prev) => !prev)}
        />
        <main className="flex-1 min-w-0 lg:overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}