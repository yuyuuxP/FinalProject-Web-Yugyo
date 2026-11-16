import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const fullName = body.fullName?.trim();
    const username = body.username?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const role = body.role === 'teacher' ? 'teacher' : 'student';

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Nama lengkap, email, dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Kata sandi minimal terdiri dari 8 karakter.' },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;',
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email tersebut sudah terdaftar. Silakan langsung masuk.' },
        { status: 409 }
      );
    }

    const displayName = username ? `${fullName} (@${username.replace(/^@/, '')})` : fullName;

    const inserted = await pool.query(
      `INSERT INTO users (full_name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role;`,
      [displayName, email, password, role]
    );

    const newUser = inserted.rows[0];
    const redirectUrl = role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';

    const response = NextResponse.json({
      message: 'Pendaftaran berhasil',
      user: newUser,
      redirectUrl,
    });

    response.cookies.set('yugyo_user', JSON.stringify(newUser), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('Register API Error:', err);
    return NextResponse.json(
      { error: 'Gagal menyimpan data pendaftaran ke database.' },
      { status: 500 }
    );
  }
}