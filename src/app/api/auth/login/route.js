// =====================================================================
// YUGYO - Authentication API Route (PostgreSQL Role-Based Redirect)
// File: src/app/api/auth/login/route.js
// =====================================================================

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const identifier = body.identifier?.trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/username dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email (case-insensitive) atau full_name di PostgreSQL
    const result = await pool.query(
      `SELECT id, full_name, email, password, role
       FROM users
       WHERE LOWER(email) = LOWER($1) OR LOWER(full_name) = LOWER($1)
       LIMIT 1;`,
      [identifier]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Akun tidak ditemukan dalam database.' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verifikasi kata sandi
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Kata sandi yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    const normalizedRole = (user.role || '').toLowerCase();
    let redirectUrl = '/dashboard/student';

    if (normalizedRole === 'admin') {
      redirectUrl = '/dashboard/admin';
    } else if (normalizedRole === 'teacher' || normalizedRole === 'instructor') {
      redirectUrl = '/dashboard/teacher';
    }

    const response = NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: normalizedRole,
      },
      redirectUrl,
    });

    // Simpan sesi ringan di cookie agar halaman dashboard bisa mengenali user yang login
    response.cookies.set(
      'yugyo_user',
      JSON.stringify({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: normalizedRole,
      }),
      {
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 hari
      }
    );

    return response;
  } catch (err) {
    console.error('Login API Error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan koneksi ke database.' },
      { status: 500 }
    );
  }
}