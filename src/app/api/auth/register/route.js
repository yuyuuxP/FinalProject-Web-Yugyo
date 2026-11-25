import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import {
  deleteInstructorPortfolio,
  saveInstructorPortfolio,
} from '@/lib/instructorPortfolioStorage';
import { validateInstructorPortfolioFile } from '@/lib/instructorPortfolioValidation';

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export async function POST(request) {
  let savedPortfolioFile = null;

  try {
    const contentType = (request.headers.get('content-type') || '').toLowerCase();
    let body;
    let portfolioFile = null;

    if (contentType.includes('multipart/form-data')) {
      let formData;
      try {
        formData = await request.formData();
      } catch {
        return NextResponse.json(
          { error: 'Payload pendaftaran tidak valid.' },
          { status: 400 }
        );
      }

      body = {};
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          body[key] = value;
        }
      }

      const upload = formData.get('portfolioFile');
      if (
        upload &&
        typeof upload === 'object' &&
        typeof upload.arrayBuffer === 'function' &&
        upload.name
      ) {
        portfolioFile = upload;
      }
    } else {
      body = await request.json().catch(() => null);
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Payload pendaftaran tidak valid.' },
        { status: 400 }
      );
    }

    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const rawRole = String(body.role || 'student').trim().toLowerCase();

    const isTeacherRequest = rawRole === 'instructor' || rawRole === 'teacher';
    const role = isTeacherRequest ? 'teacher' : 'student';
    const status = 'pending';
    const specialty = isTeacherRequest
      ? String(body.specialty || '').trim() || null
      : null;
    const portfolioUrl = isTeacherRequest
      ? String(body.portfolioUrl || '').trim()
      : '';

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

    if (portfolioUrl) {
      try {
        const parsedUrl = new URL(portfolioUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Unsupported URL protocol.');
        }
      } catch {
        return NextResponse.json(
          { error: 'URL portofolio harus berupa tautan HTTP atau HTTPS yang valid.' },
          { status: 400 }
        );
      }
    }

    if (portfolioFile && !isTeacherRequest) {
      return NextResponse.json(
        { error: 'Upload CV atau portofolio hanya tersedia untuk pendaftaran instruktur.' },
        { status: 400 }
      );
    }

    const portfolioFileError =
      portfolioFile && validateInstructorPortfolioFile(portfolioFile);
    if (portfolioFileError) {
      return NextResponse.json(
        { error: portfolioFileError },
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

    let inserted;
    if (isTeacherRequest) {
      await pool.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
          ADD COLUMN IF NOT EXISTS portfolio_file_path TEXT,
          ADD COLUMN IF NOT EXISTS portfolio_file_name TEXT;
      `);

      if (portfolioFile) {
        try {
          savedPortfolioFile = await saveInstructorPortfolio(portfolioFile);
        } catch (storageError) {
          console.error('Failed to store instructor portfolio:', storageError);
          return NextResponse.json(
            { error: 'Gagal menyimpan file CV atau portofolio.' },
            { status: 500 }
          );
        }
      }

      inserted = await pool.query(
        `INSERT INTO users (
          full_name, email, password, role, status, specialty,
          portfolio_url, portfolio_file_path, portfolio_file_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, full_name, email, role, status, specialty, created_at`,
        [
          fullName,
          email,
          passwordHash,
          role,
          status,
          specialty,
          portfolioUrl || null,
          savedPortfolioFile?.filePath || null,
          savedPortfolioFile?.fileName || null,
        ]
      );
    } else {
      inserted = await pool.query(
        `INSERT INTO users (full_name, email, password, role, status, specialty)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, full_name, email, role, status, specialty, created_at`,
        [fullName, email, passwordHash, role, status, specialty]
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Akun telah terdaftar!',
        user: inserted.rows[0],
      },
      { status: 201 }
    );
  } catch (err) {
    if (savedPortfolioFile?.filePath) {
      try {
        await deleteInstructorPortfolio(savedPortfolioFile.filePath);
      } catch (cleanupError) {
        console.error('Failed to remove orphaned instructor portfolio:', cleanupError);
      }
    }

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