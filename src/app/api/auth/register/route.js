import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';

const globalForPg = globalThis;
const pool =
  globalForPg.__yugyoPgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (!globalForPg.__yugyoPgPool) {
  globalForPg.__yugyoPgPool = pool;
}

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Payload pendaftaran tidak valid.' },
        { status: 400 }
      );
    }

    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = body.role === 'instructor' ? 'instructor' : 'student';
    const status = role === 'instructor' ? 'pending' : 'active';
    const specialty =
      role === 'instructor'
        ? String(body.specialty || '').trim() || null
        : null;

    if (fullName.length < 2) {
      return NextResponse.json(
        { error: 'Nama lengkap minimal 2 karakter.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Alamat email tidak valid.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Kata sandi minimal 8 karakter.' },
        { status: 400 }
      );
    }

    const dupCheck = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );

    if (dupCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    const inserted = await pool.query(
      `INSERT INTO users (full_name, email, password, role, status, specialty)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, role, status, specialty, created_at`,
      [fullName, email, passwordHash, role, status, specialty]
    );

    const user = inserted.rows[0];
    const redirectUrl =
      role === 'instructor' ? '/dashboard/instructor' : '/dashboard/student';

    const response = NextResponse.json(
      {
        success: true,
        user,
        redirectUrl,
      },
      { status: 201 }
    );

    response.cookies.set('yugyo_user', JSON.stringify(user), {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    if (err?.code === '23505') {
      return NextResponse.json(
        { error: 'Email sudah terdaftar.' },
        { status: 409 }
      );
    }

    console.error('Register route error:', err);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development'
            ? `Database error: ${err?.message || 'unknown'}`
            : 'Terjadi kesalahan pada server database saat mendaftar.',
      },
      { status: 500 }
    );
  }
}