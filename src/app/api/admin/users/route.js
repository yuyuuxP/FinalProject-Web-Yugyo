import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST: Menambah pengguna baru oleh Admin
export async function POST(request) {
  try {
    const formData = await request.formData();
    const full_name = formData.get('full_name');
    const email = formData.get('email');
    const password = formData.get('password') || 'yugyo1234';
    let role = formData.get('role') || 'student';
    let status = formData.get('status') || 'active';
    const specialty = formData.get('specialty') || 'Master Patisserie';

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Nama lengkap dan email wajib diisi' }, { status: 400 });
    }

    // ATURAN BISNIS: Jika admin memilih role teacher tapi statusnya masih pending, 
    // maka role disimpan sebagai student terlebih dahulu (menunggu persetujuan admin).
    if (role === 'teacher' && status === 'pending') {
      role = 'student';
    }

    // Insert ke database dengan hashing password menggunakan pgcrypto
    await pool.query(
      `INSERT INTO users (full_name, email, password, role, status, specialty) 
       VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, $5, $6);`,
      [full_name, email, password, role, status, specialty]
    );

    return NextResponse.redirect(new URL('/dashboard/admin/users', request.url), 303);
  } catch (err) {
    console.error('API Create User Error:', err);
    return NextResponse.json({ error: 'Gagal menambah pengguna (Email mungkin sudah terdaftar)' }, { status: 500 });
  }
}