import { NextResponse } from 'next/server';
import pool from '@/lib/db';

async function getTableColumns(tableName) {
  const res = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1;`,
    [tableName]
  );
  return new Set((res.rows || []).map((r) => r.column_name));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const fullName = String(body.full_name || body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const rawRole = String(body.role || 'teacher').trim().toLowerCase();
    const role = rawRole === 'student' ? 'student' : 'teacher';
    const rawStatus = String(body.status || 'active').trim().toLowerCase();
    const status = rawStatus === 'pending' ? 'pending' : 'active';
    const categoryIdRaw = body.category_id ?? body.specialty_id ?? '';
    const specialtyName = String(body.specialty || '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const categoryCols = await getTableColumns('categories');
    const courseCols = await getTableColumns('courses');
    const userCols = await getTableColumns('users');

    let selectedCategory = null;
    if (role === 'teacher') {
      if (
        categoryIdRaw !== '' &&
        categoryIdRaw !== null &&
        categoryIdRaw !== undefined
      ) {
        const catId = Number(categoryIdRaw);
        if (Number.isInteger(catId) && catId > 0) {
          const catCheck = await pool.query(
            `SELECT id, name FROM categories WHERE id = $1 LIMIT 1;`,
            [catId]
          );
          selectedCategory = catCheck.rows[0] || null;
        }
      } else if (specialtyName) {
        const catByName = await pool.query(
          `SELECT id, name
           FROM categories
           WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
           LIMIT 1;`,
          [specialtyName]
        );
        selectedCategory = catByName.rows[0] || null;
      }

      if (selectedCategory) {
        const teacherLinkCols = [
          'lead_instructor_id',
          'instructor_id',
          'teacher_id',
          'user_id',
        ].filter((col) => categoryCols.has(col));

        let alreadyHasTeacher = false;

        if (teacherLinkCols.length > 0) {
          const selectCols = teacherLinkCols.join(', ');
          const rowRes = await pool.query(
            `SELECT ${selectCols} FROM categories WHERE id = $1 LIMIT 1;`,
            [selectedCategory.id]
          );
          const row = rowRes.rows[0] || {};
          alreadyHasTeacher = teacherLinkCols.some(
            (col) =>
              row[col] !== null && row[col] !== undefined && row[col] !== ''
          );
        }

        if (
          !alreadyHasTeacher &&
          courseCols.has('category_id') &&
          courseCols.has('instructor_id')
        ) {
          const cRes = await pool.query(
            `SELECT 1
             FROM courses
             WHERE category_id = $1
               AND instructor_id IS NOT NULL
             LIMIT 1;`,
            [selectedCategory.id]
          );
          if (cRes.rows.length > 0) {
            alreadyHasTeacher = true;
          }
        }

        if (!alreadyHasTeacher && userCols.has('specialty')) {
          const uRes = await pool.query(
            `SELECT 1
             FROM users
             WHERE LOWER(COALESCE(role, '')) IN ('teacher', 'instructor', 'guru')
               AND COALESCE(LOWER(status), 'active') <> 'pending'
               AND LOWER(TRIM(specialty)) = LOWER(TRIM($1))
             LIMIT 1;`,
            [selectedCategory.name]
          );
          if (uRes.rows.length > 0) {
            alreadyHasTeacher = true;
          }
        }

        if (alreadyHasTeacher) {
          return NextResponse.json(
            {
              success: false,
              message: `Kategori "${selectedCategory.name}" sudah memiliki guru yang bertanggung jawab.`,
            },
            { status: 409 }
          );
        }
      }
    }

    const insertCols = [];
    const insertVals = [];

    if (userCols.has('full_name')) {
      insertCols.push('full_name');
      insertVals.push(fullName || email.split('@')[0]);
    }
    if (userCols.has('email')) {
      insertCols.push('email');
      insertVals.push(email);
    }
    if (userCols.has('password')) {
      insertCols.push('password');
      insertVals.push(password);
    } else if (userCols.has('password_hash')) {
      insertCols.push('password_hash');
      insertVals.push(password);
    }
    if (userCols.has('role')) {
      insertCols.push('role');
      insertVals.push(role);
    }
    if (userCols.has('status')) {
      insertCols.push('status');
      insertVals.push(status);
    }
    const finalSpecialty =
      role === 'teacher' ? selectedCategory?.name || specialtyName || null : null;
    if (userCols.has('specialty') && finalSpecialty) {
      insertCols.push('specialty');
      insertVals.push(finalSpecialty);
    }

    const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(', ');
    const createdRes = await pool.query(
      `INSERT INTO users (${insertCols.join(', ')})
       VALUES (${placeholders})
       RETURNING id, full_name, email, role, status;`,
      insertVals
    );

    const createdUser = createdRes.rows[0];

    if (role === 'teacher' && status !== 'pending' && selectedCategory && createdUser?.id) {
      const teacherLinkCols = [
        'lead_instructor_id',
        'instructor_id',
        'teacher_id',
        'user_id',
      ].filter((col) => categoryCols.has(col));

      if (teacherLinkCols.length > 0) {
        const setClause = teacherLinkCols
          .map((col, idx) => `${col} = $${idx + 1}`)
          .join(', ');
        await pool.query(
          `UPDATE categories
           SET ${setClause}
           WHERE id = $${teacherLinkCols.length + 1};`,
          [...teacherLinkCols.map(() => createdUser.id), selectedCategory.id]
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: createdUser,
        message: 'Pengguna baru berhasil didaftarkan.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal mendaftarkan pengguna baru.' },
      { status: 500 }
    );
  }
}