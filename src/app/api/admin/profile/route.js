import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('yugyo_user_id')?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  const result = await pool.query(
    `SELECT id
     FROM users
     WHERE id = $1 AND LOWER(role) = 'admin'
     LIMIT 1;`,
    [userId]
  );

  return result.rows[0] || null;
}

export async function PATCH(request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Sesi admin tidak ditemukan.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const fullName = String(body?.fullName || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();

    if (fullName.length < 2 || fullName.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Nama harus terdiri dari 2 sampai 100 karakter.' },
        { status: 400 }
      );
    }

    if (
      email.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { success: false, message: 'Masukkan alamat email yang valid.' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2
       WHERE id = $3
       RETURNING id, full_name, email, role, status;`,
      [fullName, email, admin.id]
    );

    return NextResponse.json({
      success: true,
      profile: result.rows[0],
    });
  } catch (error) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { success: false, message: 'Email tersebut sudah digunakan akun lain.' },
        { status: 409 }
      );
    }

    console.error('PATCH /api/admin/profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan profil admin.' },
      { status: 500 }
    );
  }
}
