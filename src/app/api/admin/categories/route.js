import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '@/lib/db';

const ICON_UPLOAD_DIR = path.join(
  process.cwd(),
  'public',
  'pictures',
  'categories'
);

function sanitizeIconName(rawName) {
  const base = path.basename(String(rawName || 'category.png'));
  const ext = path.extname(base).toLowerCase() || '.png';
  const stem =
    base
      .slice(0, base.length - path.extname(base).length)
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'kategori_icon';
  return `${Date.now()}_${stem}${ext}`;
}

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
    const formData = await request.formData();
    const name = String(formData.get('name') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const instructorIdRaw = formData.get('instructor_id');
    const instructorId = Number(instructorIdRaw);
    const iconFile = formData.get('icon');

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Nama kategori wajib diisi.' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(instructorId) || instructorId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Silakan pilih guru yang bertanggung jawab atas kategori ini.',
        },
        { status: 400 }
      );
    }

    const userCols = await getTableColumns('users');
    const statusSelect = userCols.has('status') ? ', status' : '';

    const teacherCheck = await pool.query(
      `SELECT id, full_name${statusSelect}
       FROM users
       WHERE id = $1
         AND LOWER(COALESCE(role, '')) IN ('teacher', 'instructor', 'guru')
       LIMIT 1;`,
      [instructorId]
    );

    if (teacherCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Guru yang dipilih tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (
      String(teacherCheck.rows[0]?.status || '').toLowerCase() === 'pending'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Guru dengan status pending belum dapat ditunjuk sebagai penanggung jawab kategori.',
        },
        { status: 400 }
      );
    }

    const categoryCols = await getTableColumns('categories');
    const courseCols = await getTableColumns('courses');

    const teacherLinkCols = [
      'lead_instructor_id',
      'instructor_id',
      'teacher_id',
      'user_id',
    ].filter((col) => categoryCols.has(col));

    let alreadyAssignedCategory = null;
    if (teacherLinkCols.length > 0) {
      const whereClause = teacherLinkCols
        .map((col) => `${col} = $1`)
        .join(' OR ');
      const assignRes = await pool.query(
        `SELECT id, name
         FROM categories
         WHERE ${whereClause}
         LIMIT 1;`,
        [instructorId]
      );
      if (assignRes.rows.length > 0) {
        alreadyAssignedCategory = assignRes.rows[0].name;
      }
    } else if (
      courseCols.has('category_id') &&
      courseCols.has('instructor_id')
    ) {
      const relRes = await pool.query(
        `SELECT cat.name
         FROM courses c
         INNER JOIN categories cat ON cat.id = c.category_id
         WHERE c.instructor_id = $1
         LIMIT 1;`,
        [instructorId]
      );
      if (relRes.rows.length > 0) {
        alreadyAssignedCategory = relRes.rows[0].name;
      }
    }

    if (alreadyAssignedCategory) {
      return NextResponse.json(
        {
          success: false,
          message: `Guru tersebut sudah bertanggung jawab pada kategori "${alreadyAssignedCategory}".`,
        },
        { status: 409 }
      );
    }

    let iconUrl = null;
    if (
      iconFile &&
      typeof iconFile === 'object' &&
      typeof iconFile.arrayBuffer === 'function' &&
      iconFile.size > 0
    ) {
      await fs.mkdir(ICON_UPLOAD_DIR, { recursive: true });
      const fileName = sanitizeIconName(iconFile.name);
      const targetPath = path.join(ICON_UPLOAD_DIR, fileName);
      const buffer = Buffer.from(await iconFile.arrayBuffer());
      await fs.writeFile(targetPath, buffer);
      iconUrl = `/pictures/categories/${fileName}`;
    }

    const insertCols = [];
    const insertVals = [];

    if (categoryCols.has('name')) {
      insertCols.push('name');
      insertVals.push(name);
    }
    if (categoryCols.has('description')) {
      insertCols.push('description');
      insertVals.push(description);
    }
    for (const imgCol of [
      'image_url',
      'icon_url',
      'thumbnail_url',
      'photo_url',
    ]) {
      if (categoryCols.has(imgCol)) {
        insertCols.push(imgCol);
        insertVals.push(iconUrl);
      }
    }
    for (const tCol of teacherLinkCols) {
      insertCols.push(tCol);
      insertVals.push(instructorId);
    }

    const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(', ');
    const ins = await pool.query(
      `INSERT INTO categories (${insertCols.join(', ')})
       VALUES (${placeholders})
       RETURNING *;`,
      insertVals
    );

    return NextResponse.json(
      {
        success: true,
        category: ins.rows[0],
        message: 'Kategori baru berhasil disimpan.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating category:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan kategori baru.' },
      { status: 500 }
    );
  }
}