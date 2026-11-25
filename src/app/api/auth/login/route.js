import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import pool from '@/lib/db';

function verifyScryptPassword(plainPassword, storedPassword) {
  const parts = String(storedPassword || '').split(':');
  if (parts.length !== 2) return false;

  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;

  try {
    const derivedKey = crypto.scryptSync(plainPassword, salt, 64);
    const storedKey = Buffer.from(keyHex, 'hex');
    if (derivedKey.length !== storedKey.length) return false;
    return crypto.timingSafeEqual(derivedKey, storedKey);
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    let identifier = '';
    let password = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      identifier = String(body.identifier || body.email || body.username || '').trim();
      password = String(body.password || '');
    } else {
      const formData = await request.formData();
      identifier = String(
        formData.get('identifier') ||
          formData.get('email') ||
          formData.get('username') ||
          ''
      ).trim();
      password = String(formData.get('password') || '');
    }

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    const userRes = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR full_name ILIKE $1 LIMIT 1;',
      [identifier]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Akun tidak terdaftar di sistem Atelier' },
        { status: 401 }
      );
    }

    const user = userRes.rows[0];
    const storedPassword = String(user.password || '');

    let isPasswordValid = false;

    if (verifyScryptPassword(password, storedPassword)) {
      isPasswordValid = true;
    } else if (storedPassword === password) {
      isPasswordValid = true;
    } else {
      try {
        const checkHash = await pool.query(
          `SELECT (password = crypt($1, password)) AS match FROM users WHERE id = $2;`,
          [password, user.id]
        );
        isPasswordValid = Boolean(checkHash.rows[0]?.match);
      } catch {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Kata sandi yang Anda masukkan salah' },
        { status: 401 }
      );
    }

    const rawRole = String(user.role || 'student').toLowerCase();
    const accountStatus = String(user.status || 'active').toLowerCase();

    if (accountStatus === 'pending') {
      return NextResponse.json(
        { error: 'Akun Anda masih menunggu persetujuan admin.' },
        { status: 403 }
      );
    }

    // Status teacher non-active selain pending dibatasi ke dashboard student.
    const effectiveRole =
      rawRole === 'teacher' && accountStatus !== 'active'
        ? 'student'
        : rawRole;

    const cookieStore = await cookies();
    cookieStore.set('yugyo_user_id', String(user.id), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    cookieStore.set('yugyo_user_role', effectiveRole, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    let redirectUrl = '/dashboard/student';
    if (effectiveRole === 'admin') {
      redirectUrl = '/dashboard/admin';
    } else if (effectiveRole === 'teacher') {
      redirectUrl = '/dashboard/teacher';
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Login berhasil',
        redirectUrl,
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: effectiveRole,
          rawRole,
          status: accountStatus,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('API Login Error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server database' },
      { status: 500 }
    );
  }
}