import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers'; // Tambahkan cookies

export async function POST(request) {
  try {
    let identifier = '';
    let password = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      identifier = body.identifier || body.email || body.username || '';
      password = body.password || '';
    } else {
      const formData = await request.formData();
      identifier = formData.get('identifier') || formData.get('email') || formData.get('username') || '';
      password = formData.get('password') || '';
    }

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const userRes = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR full_name ILIKE $1;', 
      [identifier]
    );
    
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Akun tidak terdaftar di sistem Atelier' }, { status: 401 });
    }

    const user = userRes.rows[0];

    let isPasswordValid = false;
    if (user.password === password) {
      isPasswordValid = true;
    } else {
      try {
        const checkHash = await pool.query(
          `SELECT (password = crypt($1, password)) AS match FROM users WHERE id = $2;`,
          [password, user.id]
        );
        isPasswordValid = checkHash.rows[0]?.match;
      } catch (e) {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Kata sandi yang Anda masukkan salah' }, { status: 401 });
    }

    // SIMPAN DATA SESI KE COOKIE
    const cookieStore = await cookies();
    cookieStore.set('yugyo_user_id', user.id.toString(), { httpOnly: true, path: '/' });
    cookieStore.set('yugyo_user_role', user.role, { httpOnly: true, path: '/' });

    let redirectUrl = '/dashboard/student';
    if (user.role === 'admin') {
      redirectUrl = '/dashboard/admin';
    } else if (user.role === 'teacher') {
      redirectUrl = '/dashboard/teacher';
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Login berhasil',
      redirectUrl: redirectUrl,
      user: { 
        id: user.id, 
        name: user.full_name, 
        email: user.email, 
        role: user.role 
      } 
    }, { status: 200 });

  } catch (err) {
    console.error('API Login Error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server database' }, { status: 500 });
  }
}