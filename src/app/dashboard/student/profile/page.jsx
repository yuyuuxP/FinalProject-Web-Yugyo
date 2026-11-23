import { cookies } from 'next/headers';
import StudentProfileClient from '@/components/student/StudentProfileClient';

export const dynamic = 'force-dynamic';

function extractUserFromCookies(cookieStore) {
  try {
    const all = cookieStore.getAll();
    for (const item of all) {
      const val = String(item?.value || '').trim();
      if (!val) continue;
      try {
        const decoded = decodeURIComponent(val);
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === 'object') {
          const u = parsed.user || parsed;
          const name = String(
            u.username || u.full_name || u.fullName || u.name || ''
          ).trim();
          const email = String(u.email || '').trim();
          if (name || email) {
            return {
              fullName: name || 'Student',
              email: email || 'student@yugyo-atelier.id',
              role: String(u.role || 'student'),
              studentCode: u.student_code || u.studentCode || '#YG-88219',
            };
          }
        }
      } catch {
        // Abaikan cookie non-JSON
      }
    }
  } catch {
    // Abaikan error cookie
  }
  return null;
}

export default async function StudentProfilePage() {
  const cookieStore = await cookies();
  const initialProfile = extractUserFromCookies(cookieStore);
  return <StudentProfileClient initialProfile={initialProfile} />;
}