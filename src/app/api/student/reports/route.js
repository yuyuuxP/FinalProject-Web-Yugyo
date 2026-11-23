import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FALLBACK_FILE = path.join(process.cwd(), 'data', 'student-reports.json');

async function getPgPool() {
  try {
    const dbModule = await import('@/lib/db').catch(() => null);
    if (dbModule?.default?.query) return dbModule.default;
    if (dbModule?.pool?.query) return dbModule.pool;

    const pgModule = await import('pg').catch(() => null);
    const Pool = pgModule?.Pool || pgModule?.default?.Pool;
    const connStr = process.env.DATABASE_URL;
    if (Pool && connStr) {
      if (!globalThis.__yugyoPgPool) {
        globalThis.__yugyoPgPool = new Pool({ connectionString: connStr });
      }
      return globalThis.__yugyoPgPool;
    }
  } catch {
    // Abaikan jika modul db tidak tersedia
  }
  return null;
}

async function readFallbackReports() {
  try {
    const raw = await fs.readFile(FALLBACK_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFallbackReports(items) {
  try {
    await fs.mkdir(path.dirname(FALLBACK_FILE), { recursive: true });
    await fs.writeFile(FALLBACK_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch {
    // Abaikan jika filesystem read-only
  }
}

function mapDbRowToReport(row) {
  const username =
    row.student_username ||
    row.full_name ||
    row.username ||
    'Student';

  return {
    id: row.id,
    studentId: row.student_id ?? null,
    username,
    code: `#STU-${1000 + Number(row.id || 1)}`,
    title: row.title || `Keluhan pada ${row.category || 'Website'}`,
    featureArea: row.category || 'Course & Video Player',
    severity: row.severity || 'Tinggi · Fitur Tidak Berfungsi',
    description: row.content || '',
    status: row.status || 'Belum Dibaca',
    photoUrl: row.image_proof || '',
    photoLabel: row.image_proof ? 'Bukti Gambar Error' : '',
    adminReply: row.admin_reply
      ? { name: 'Admin Yugyo Atelier', initials: 'AD', message: row.admin_reply }
      : null,
    reportedAt: row.created_at
      ? new Date(row.created_at).toLocaleString('id-ID')
      : 'Baru saja',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function GET() {
  const pool = await getPgPool();

  if (pool) {
    try {
      const result = await pool.query(`
        SELECT
          r.id,
          r.student_id,
          r.course_id,
          r.title,
          r.content,
          r.category,
          r.severity,
          r.status,
          r.image_proof,
          r.admin_reply,
          r.created_at,
          u.full_name AS student_username
        FROM reports r
        LEFT JOIN users u ON u.id = r.student_id
        ORDER BY r.created_at DESC, r.id DESC
      `);

      const reports = (result.rows || []).map(mapDbRowToReport);
      return NextResponse.json({ reports });
    } catch (err) {
      console.error('GET /api/student/reports DB error:', err);
    }
  }

  const fallback = await readFallbackReports();
  return NextResponse.json({ reports: fallback });
}

export async function POST(req) {
  try {
    const body = await req.json();

    const username = String(
      body.username ||
        body.studentUsername ||
        body.student_name ||
        body.full_name ||
        'Student'
    ).trim();

    const title = String(
      body.title ||
        `Keluhan pada ${body.featureArea || body.category || 'Website'}`
    ).trim();

    const description = String(
      body.description || body.content || ''
    ).trim();

    const featureArea = String(
      body.featureArea || body.category || 'Course & Video Player'
    ).trim();

    const severity = String(
      body.severity || 'Tinggi · Fitur Tidak Berfungsi'
    ).trim();

    const photoUrl = String(body.photoUrl || body.image_proof || '').trim();

    if (!description) {
      return NextResponse.json(
        { error: 'Isi keluhan error atau bug wajib diisi.' },
        { status: 400 }
      );
    }

    const pool = await getPgPool();

    if (pool) {
      let resolvedStudentId = body.studentId || body.student_id || null;

      if (!resolvedStudentId && username) {
        const userLookup = await pool.query(
          `SELECT id FROM users WHERE LOWER(full_name) = LOWER($1) LIMIT 1`,
          [username]
        );
        if (userLookup.rows?.[0]?.id) {
          resolvedStudentId = userLookup.rows[0].id;
        }
      }

      const inserted = await pool.query(
        `
        INSERT INTO reports (
          student_id,
          course_id,
          title,
          content,
          category,
          severity,
          status,
          image_proof
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'Belum Dibaca', $7)
        RETURNING *
        `,
        [
          resolvedStudentId,
          body.courseId || body.course_id || null,
          title,
          description,
          featureArea,
          severity,
          photoUrl || null,
        ]
      );

      const savedRow = inserted.rows[0];
      const reportItem = mapDbRowToReport({
        ...savedRow,
        student_username: username,
      });

      const existing = await readFallbackReports();
      await writeFallbackReports([reportItem, ...existing]);

      return NextResponse.json({ report: reportItem }, { status: 201 });
    }

    const newFallbackItem = {
      id: `rep-${Date.now()}`,
      username,
      code: `#STU-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      featureArea,
      severity,
      description,
      status: 'Belum Dibaca',
      photoUrl,
      photoLabel: photoUrl ? 'Bukti Gambar Error' : '',
      adminReply: null,
      reportedAt: 'Baru saja',
      createdAt: new Date().toISOString(),
    };

    const existing = await readFallbackReports();
    await writeFallbackReports([newFallbackItem, ...existing]);

    return NextResponse.json({ report: newFallbackItem }, { status: 201 });
  } catch (err) {
    console.error('POST /api/student/reports error:', err);
    return NextResponse.json(
      { error: 'Gagal menyimpan report secara permanen.' },
      { status: 500 }
    );
  }
}