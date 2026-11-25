import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { deleteInstructorPortfolio } from '@/lib/instructorPortfolioStorage';

async function getTableColumns(tableName) {
  const res = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1;`,
    [tableName]
  );
  return new Set((res.rows || []).map((r) => String(r.column_name).toLowerCase()));
}

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { success: false, message: 'ID pengguna tidak valid.' },
        { status: 400 }
      );
    }

    const existingRes = await pool.query(
      `SELECT * FROM users WHERE id = $1 LIMIT 1;`,
      [numericId]
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const existingUser = existingRes.rows[0];
    if (String(existingUser?.role || '').trim().toLowerCase() === 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Akun admin hanya boleh diedit melalui halaman Profile.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const userCols = await getTableColumns('users');

    const updates = [];
    const values = [];

    const nextUsername =
      body.username !== undefined
        ? String(body.username).trim()
        : body.full_name !== undefined
          ? String(body.full_name).trim()
          : body.name !== undefined
            ? String(body.name).trim()
            : undefined;

    if (nextUsername !== undefined && nextUsername.length > 0) {
      if (userCols.has('username')) {
        updates.push(`username = $${values.length + 1}`);
        values.push(nextUsername);
      }
      if (userCols.has('full_name')) {
        updates.push(`full_name = $${values.length + 1}`);
        values.push(nextUsername);
      } else if (userCols.has('name')) {
        updates.push(`name = $${values.length + 1}`);
        values.push(nextUsername);
      }
    }

    if (body.email !== undefined && userCols.has('email')) {
      const nextEmail = String(body.email).trim();
      if (nextEmail.length > 0) {
        updates.push(`email = $${values.length + 1}`);
        values.push(nextEmail);
      }
    }

    if (body.password !== undefined && String(body.password).trim().length > 0) {
      const rawPass = String(body.password).trim();
      const hashed = hashPassword(rawPass);
      if (userCols.has('password_hash')) {
        updates.push(`password_hash = $${values.length + 1}`);
        values.push(hashed);
      }
      if (userCols.has('password')) {
        updates.push(`password = $${values.length + 1}`);
        values.push(hashed);
      }
    }

    if (body.role !== undefined && userCols.has('role')) {
      const nextRole = String(body.role).trim().toLowerCase();
      if (nextRole === 'admin') {
        return NextResponse.json(
          {
            success: false,
            message: 'Tidak dapat mengubah peran pengguna menjadi admin.',
          },
          { status: 400 }
        );
      }
      updates.push(`role = $${values.length + 1}`);
      values.push(nextRole);
    }

    if (body.status !== undefined && userCols.has('status')) {
      const nextStatus = String(body.status).trim().toLowerCase();
      updates.push(`status = $${values.length + 1}`);
      values.push(nextStatus === 'pending' ? 'pending' : 'active');
    }

    if (body.specialty !== undefined && userCols.has('specialty')) {
      updates.push(`specialty = $${values.length + 1}`);
      values.push(String(body.specialty).trim() || null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: true, user: existingUser },
        { status: 200 }
      );
    }

    values.push(numericId);
    const updatedRes = await pool.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, email, role;`,
      values
    );

    return NextResponse.json(
      { success: true, user: updatedRes.rows[0] },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui pengguna.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { success: false, message: 'ID pengguna tidak valid.' },
        { status: 400 }
      );
    }

    const userCols = await getTableColumns('users');
    const portfolioFileExpr = userCols.has('portfolio_file_path')
      ? 'portfolio_file_path'
      : 'NULL::text AS portfolio_file_path';
    const existingRes = await pool.query(
      `SELECT id, role, ${portfolioFileExpr}
       FROM users
       WHERE id = $1
       LIMIT 1;`,
      [numericId]
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (String(existingRes.rows[0]?.role || '').trim().toLowerCase() === 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Akun admin tidak dapat dihapus dari Users Management.',
        },
        { status: 403 }
      );
    }

    await pool.query(`DELETE FROM users WHERE id = $1;`, [numericId]);

    let cleanupFailed = false;
    if (existingRes.rows[0].portfolio_file_path) {
      try {
        await deleteInstructorPortfolio(
          existingRes.rows[0].portfolio_file_path
        );
      } catch (cleanupError) {
        cleanupFailed = true;
        console.error('Failed to remove deleted instructor portfolio:', cleanupError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: cleanupFailed
          ? 'Pengguna berhasil dihapus, tetapi file CV atau portofolio gagal dibersihkan.'
          : 'Pengguna berhasil dihapus.',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus pengguna.' },
      { status: 500 }
    );
  }
}