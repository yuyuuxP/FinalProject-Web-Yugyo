import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function getCurrentSessionAccount() {
  const cookieStore = await cookies();
  const rawUserId = cookieStore.get('yugyo_user_id')?.value;
  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  const result = await pool.query(
    `SELECT id, full_name, email, role, status, specialty
     FROM users
     WHERE id = $1
     LIMIT 1;`,
    [userId]
  );

  return result.rows[0] || null;
}

function lockedTeacherResponse(status) {
  const isPending = String(status || '').trim().toLowerCase() === 'pending';
  return NextResponse.json(
    {
      success: false,
      code: isPending ? 'TEACHER_PENDING' : 'TEACHER_INACTIVE',
      message: isPending
        ? 'Akun instruktur masih menunggu persetujuan admin. Fitur akan terbuka setelah akun disetujui.'
        : 'Akun instruktur belum aktif.',
    },
    { status: 403 }
  );
}

export async function requireActiveTeacher() {
  const account = await getCurrentSessionAccount();

  if (!account) {
    return {
      account: null,
      response: NextResponse.json(
        { success: false, message: 'Sesi instruktur tidak ditemukan.' },
        { status: 401 }
      ),
    };
  }

  if (String(account.role || '').trim().toLowerCase() !== 'teacher') {
    return {
      account,
      response: NextResponse.json(
        { success: false, message: 'Akses ini hanya tersedia untuk instruktur.' },
        { status: 403 }
      ),
    };
  }

  if (String(account.status || '').trim().toLowerCase() !== 'active') {
    return { account, response: lockedTeacherResponse(account.status) };
  }

  return { account, response: null };
}

export async function requireActiveTeacherOrAdmin() {
  const account = await getCurrentSessionAccount();

  if (!account) {
    return {
      account: null,
      response: NextResponse.json(
        { success: false, message: 'Sesi pengguna tidak ditemukan.' },
        { status: 401 }
      ),
    };
  }

  const role = String(account.role || '').trim().toLowerCase();
  if (role === 'admin') {
    return { account, response: null };
  }

  if (role !== 'teacher') {
    return {
      account,
      response: NextResponse.json(
        { success: false, message: 'Akses ini hanya tersedia untuk admin atau instruktur.' },
        { status: 403 }
      ),
    };
  }

  if (String(account.status || '').trim().toLowerCase() !== 'active') {
    return { account, response: lockedTeacherResponse(account.status) };
  }

  return { account, response: null };
}

export async function rejectPendingTeacherAction() {
  const account = await getCurrentSessionAccount();

  if (
    String(account?.role || '').trim().toLowerCase() === 'teacher' &&
    String(account?.status || '').trim().toLowerCase() !== 'active'
  ) {
    return lockedTeacherResponse(account.status);
  }

  return null;
}
