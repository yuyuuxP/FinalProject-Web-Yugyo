import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PROFILE_STORE_PATH = path.join(process.cwd(), 'data', 'student-profiles.json');

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

async function readProfiles() {
  try {
    const raw = await fs.readFile(PROFILE_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeProfiles(list) {
  await fs.mkdir(path.dirname(PROFILE_STORE_PATH), { recursive: true });
  await fs.writeFile(PROFILE_STORE_PATH, JSON.stringify(list, null, 2), 'utf8');
}

function formatTitleCase(text) {
  return String(text || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1) : ''
    )
    .join(' ');
}

function mapRowToProfile(row, fallbackName = 'Student') {
  const name = row?.full_name || fallbackName;
  return {
    id: row?.id ?? 1,
    fullName: name,
    email:
      row?.email ||
      `${String(name).toLowerCase().replace(/\s+/g, '.')}@yugyo-atelier.id`,
    role: row?.role || 'student',
    studentCode: row?.student_code || `#YG-${10000 + Number(row?.id || 1)}`,
    avatarUrl: row?.avatar_url || '',
    whatsapp: row?.whatsapp || '+62 812-9876-5432',
    bio:
      row?.bio ||
      'Peminat pastry Prancis otodidak, fokus pada teknik laminasi adonan beragi (Viennoiserie) dan penguasaan ragi alami sourdough.',
    activeCourses: Number(row?.active_courses ?? 2),
    completedSessions: Number(row?.completed_sessions ?? 14),
    certificatesCount: Number(row?.certificates_count ?? 1),
    semesterLabel: row?.semester_label || 'Semester Ganjil 2026/2027',
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const queryUsername = String(searchParams.get('username') || '').trim();
  const queryEmail = String(searchParams.get('email') || '').trim();

  const pool = await getPgPool();
  if (pool) {
    try {
      await pool
        .query(
          `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS avatar_url TEXT,
        ADD COLUMN IF NOT EXISTS student_code TEXT,
        ADD COLUMN IF NOT EXISTS whatsapp TEXT,
        ADD COLUMN IF NOT EXISTS bio TEXT,
        ADD COLUMN IF NOT EXISTS active_courses INTEGER DEFAULT 2,
        ADD COLUMN IF NOT EXISTS completed_sessions INTEGER DEFAULT 14,
        ADD COLUMN IF NOT EXISTS certificates_count INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS semester_label TEXT DEFAULT 'Semester Ganjil 2026/2027'
      `
        )
        .catch(() => null);

      let res;
      if (queryEmail) {
        res = await pool.query(
          `SELECT id, full_name, email, role, avatar_url, student_code, whatsapp, bio, active_courses, completed_sessions, certificates_count, semester_label
           FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [queryEmail]
        );
      } else if (queryUsername) {
        res = await pool.query(
          `SELECT id, full_name, email, role, avatar_url, student_code, whatsapp, bio, active_courses, completed_sessions, certificates_count, semester_label
           FROM users WHERE LOWER(full_name) = LOWER($1) LIMIT 1`,
          [queryUsername]
        );
      } else {
        res = await pool.query(
          `SELECT id, full_name, email, role, avatar_url, student_code, whatsapp, bio, active_courses, completed_sessions, certificates_count, semester_label
           FROM users WHERE LOWER(COALESCE(role, 'student')) = 'student'
           ORDER BY id ASC LIMIT 1`
        );
      }

      if (res?.rows?.[0]) {
        return NextResponse.json({
          profile: mapRowToProfile(res.rows[0], queryUsername || 'Student'),
        });
      }
    } catch (err) {
      console.error('GET /api/student/profile DB error:', err);
    }
  }

  const list = await readProfiles();
  const matched =
    list.find(
      (p) =>
        (queryEmail &&
          String(p.email).toLowerCase() === queryEmail.toLowerCase()) ||
        (queryUsername &&
          String(p.fullName).toLowerCase() === queryUsername.toLowerCase())
    ) || list[0];

  if (matched) {
    return NextResponse.json({ profile: matched });
  }

  const baseName = queryUsername || 'Student';
  return NextResponse.json({
    profile: mapRowToProfile(
      {
        id: 1,
        full_name: baseName,
        email:
          queryEmail ||
          `${baseName.toLowerCase().replace(/\s+/g, '.')}@yugyo-atelier.id`,
        role: 'student',
        student_code: '#YG-88219',
      },
      baseName
    ),
  });
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const rawName = String(body.fullName ?? body.full_name ?? '').trim();
    const fullName = rawName ? formatTitleCase(rawName) : '';
    const email = String(body.email ?? '').trim();
    const whatsapp =
      body.whatsapp !== undefined ? String(body.whatsapp).trim() : undefined;
    const bio =
      body.bio !== undefined ? String(body.bio).slice(0, 200) : undefined;
    const avatarUrl =
      body.avatarUrl === null ? '' : String(body.avatarUrl ?? '').trim();
    const targetUsername = String(
      body.currentUsername || fullName || ''
    ).trim();

    if (rawName && !fullName) {
      return NextResponse.json(
        { message: 'Nama lengkap tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const pool = await getPgPool();
    if (pool) {
      try {
        await pool
          .query(
            `
          ALTER TABLE users
          ADD COLUMN IF NOT EXISTS avatar_url TEXT,
          ADD COLUMN IF NOT EXISTS student_code TEXT,
          ADD COLUMN IF NOT EXISTS whatsapp TEXT,
          ADD COLUMN IF NOT EXISTS bio TEXT,
          ADD COLUMN IF NOT EXISTS active_courses INTEGER DEFAULT 2,
          ADD COLUMN IF NOT EXISTS completed_sessions INTEGER DEFAULT 14,
          ADD COLUMN IF NOT EXISTS certificates_count INTEGER DEFAULT 1,
          ADD COLUMN IF NOT EXISTS semester_label TEXT DEFAULT 'Semester Ganjil 2026/2027'
        `
          )
          .catch(() => null);

        const lookup = await pool.query(
          `SELECT id, full_name, email, role, avatar_url, student_code, whatsapp, bio, active_courses, completed_sessions, certificates_count, semester_label
           FROM users
           WHERE ($1 <> '' AND LOWER(email) = LOWER($1))
              OR ($2 <> '' AND LOWER(full_name) = LOWER($2))
           LIMIT 1`,
          [email, targetUsername]
        );

        if (lookup.rows?.[0]) {
          const existing = lookup.rows[0];
          const nextFullName = fullName || existing.full_name;
          const nextAvatar =
            body.avatarUrl !== undefined ? avatarUrl : existing.avatar_url || '';
          const nextWhatsapp =
            whatsapp !== undefined
              ? whatsapp
              : existing.whatsapp || '+62 812-9876-5432';
          const nextBio =
            bio !== undefined
              ? bio
              : existing.bio ||
                'Peminat pastry Prancis otodidak, fokus pada teknik laminasi adonan beragi (Viennoiserie) dan penguasaan ragi alami sourdough.';

          const updated = await pool.query(
            `UPDATE users
             SET full_name = $1,
                 avatar_url = $2,
                 whatsapp = $3,
                 bio = $4
             WHERE id = $5
             RETURNING id, full_name, email, role, avatar_url, student_code, whatsapp, bio, active_courses, completed_sessions, certificates_count, semester_label`,
            [nextFullName, nextAvatar, nextWhatsapp, nextBio, existing.id]
          );

          const profilePayload = mapRowToProfile(updated.rows[0], nextFullName);
          const list = await readProfiles();
          const idx = list.findIndex(
            (item) => String(item.id) === String(profilePayload.id)
          );
          if (idx !== -1) list[idx] = profilePayload;
          else list.unshift(profilePayload);
          await writeProfiles(list);

          return NextResponse.json({ success: true, profile: profilePayload });
        }
      } catch (err) {
        console.error('PATCH /api/student/profile DB error:', err);
      }
    }

    const list = await readProfiles();
    const idx = list.findIndex(
      (item) =>
        (email && String(item.email).toLowerCase() === email.toLowerCase()) ||
        (targetUsername &&
          String(item.fullName).toLowerCase() === targetUsername.toLowerCase())
    );

    const base =
      idx !== -1
        ? list[idx]
        : mapRowToProfile(
            {
              id: Date.now(),
              full_name: targetUsername || 'Student',
              email:
                email ||
                `${(targetUsername || 'student').toLowerCase().replace(/\s+/g, '.')}@yugyo-atelier.id`,
              role: 'student',
              student_code: '#YG-88219',
            },
            targetUsername || 'Student'
          );

    const nextProfile = {
      ...base,
      ...(fullName ? { fullName } : {}),
      ...(whatsapp !== undefined ? { whatsapp } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(body.avatarUrl !== undefined ? { avatarUrl } : {}),
    };

    if (idx !== -1) list[idx] = nextProfile;
    else list.unshift(nextProfile);
    await writeProfiles(list);

    return NextResponse.json({ success: true, profile: nextProfile });
  } catch (err) {
    console.error('PATCH /api/student/profile error:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan perubahan profil siswa.' },
      { status: 500 }
    );
  }
}