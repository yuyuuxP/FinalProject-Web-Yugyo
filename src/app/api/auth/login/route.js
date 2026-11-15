// =====================================================================
// YUGYO - API Login Route (PostgreSQL & Role Check)
// File: src/app/api/auth/login/route.js
// =====================================================================

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db'; // Sesuaikan jalur import file koneksi database kamu di folder lib

export async function POST(request) {
  try {
    const { emailOrUsername, password } = await request.json();

    // Validasi input kosong
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { success: false, message: 'Email/Username dan password wajib diisi!' },
        { status: 400 }
      );
    }

    // Cari user di database berdasarkan email atau nama pengguna (full_name / email)
    const query = `
      SELECT id, full_name, email, password_hash, role, status 
      FROM users 
      WHERE email = $1 OR full_name = $1
      LIMIT 1;
    `;
    
    const result = await pool.query(query, [emailOrUsername]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Akun tidak ditemukan!' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Cek status akun (misal: pengajar pending admin)
    if (user.status === 'pending') {
      return NextResponse.json(
        { success: false, message: 'Akun Anda masih menunggu verifikasi dari Admin.' },
        { status: 403 }
      );
    }

    // Verifikasi password menggunakan bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Password salah!' },
        { status: 401 }
      );
    }

    // Jika berhasil, kirim role user ke frontend untuk proses redirect dinamis
    return NextResponse.json(
      {
        success: true,
        message: 'Login berhasil!',
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role, // 'admin', 'student', atau 'instructor'
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server database.' },
      { status: 500 }
    );
  }
}