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
  return new Set((res.rows || []).map((r) => String(r.column_name).toLowerCase()));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const cols = await getTableColumns('reviews');

    if (cols.size === 0) {
      return NextResponse.json(
        { success: true, stored: false, message: 'Ulasan dicatat di sesi aktif.' },
        { status: 200 }
      );
    }

    const insertCols = [];
    const insertVals = [];

    if (body.courseId !== undefined && cols.has('course_id')) {
      const numCourseId = Number(body.courseId);
      if (Number.isInteger(numCourseId) && numCourseId > 0) {
        insertCols.push('course_id');
        insertVals.push(numCourseId);
      }
    }

    if (body.rating !== undefined && cols.has('rating')) {
      insertCols.push('rating');
      insertVals.push(Number(body.rating) || 5);
    }

    const commentText = String(body.comment || '').trim();
    if (commentText) {
      if (cols.has('comment')) {
        insertCols.push('comment');
        insertVals.push(commentText);
      } else if (cols.has('review_text')) {
        insertCols.push('review_text');
        insertVals.push(commentText);
      }
    }

    if (insertCols.length === 0) {
      return NextResponse.json(
        { success: true, stored: false },
        { status: 200 }
      );
    }

    const placeholders = insertCols.map((_, idx) => `$${idx + 1}`).join(', ');
    const inserted = await pool.query(
      `INSERT INTO reviews (${insertCols.join(', ')})
       VALUES (${placeholders})
       RETURNING *;`,
      insertVals
    );

    return NextResponse.json(
      { success: true, stored: true, review: inserted.rows[0] },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error saving student review:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan ulasan.' },
      { status: 500 }
    );
  }
}