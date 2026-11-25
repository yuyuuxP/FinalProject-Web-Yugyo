import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import pool from '@/lib/db';
import AdminProfileClient from '@/components/admin/AdminProfileClient';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('yugyo_user_id')?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    redirect('/login');
  }

  const result = await pool.query(
    `SELECT id, full_name, email, role, status, created_at
     FROM users
     WHERE id = $1 AND LOWER(role) = 'admin'
     LIMIT 1;`,
    [userId]
  );
  const admin = result.rows[0];

  if (!admin) {
    redirect('/login');
  }

  const createdAtLabel = admin.created_at
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
        timeZone: 'UTC',
      }).format(new Date(admin.created_at))
    : 'Tidak tersedia';

  return (
    <AdminProfileClient
      initialProfile={{
        id: admin.id,
        fullName: admin.full_name || '',
        email: admin.email || '',
        status: admin.status || 'active',
        createdAtLabel,
      }}
    />
  );
}
