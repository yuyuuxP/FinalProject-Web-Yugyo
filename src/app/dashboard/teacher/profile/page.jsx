import { cookies } from 'next/headers';
import pool from '@/lib/db';
import InstructorProfileClient from '@/components/teacher/InstructorProfileClient';

export const dynamic = 'force-dynamic';

async function ensureInstructorProfileTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS instructor_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      display_name_title VARCHAR(180) NOT NULL DEFAULT '',
      academic_email VARCHAR(160) NOT NULL DEFAULT '',
      whatsapp_number VARCHAR(50) NOT NULL DEFAULT '+62 812-3456-7890',
      account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      badge_role_label VARCHAR(120) NOT NULL DEFAULT 'Atelier Master Instructor',
      avatar_url TEXT,
      specialties JSONB NOT NULL DEFAULT '["Viennoiserie", "Laminated Dough", "Artisan Sourdough"]'::jsonb,
      credentials_text TEXT NOT NULL DEFAULT 'Sertifikasi Patisserie & Boulangerie Atelier',
      bio_text TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function normalizeUserStatus(rawStatus) {
  return String(rawStatus || '').toLowerCase() === 'pending' ? 'PENDING' : 'ACTIVE';
}

function buildDefaultProfileForUser(user) {
  const fullName = user?.full_name || 'Chef Pengajar';
  const email = user?.email || '';
  const specialty = user?.specialty || 'Baking & Pastry';
  const statusUpper = normalizeUserStatus(user?.status);

  return {
    display_name_title: `${fullName}, Master Baker Atelier`,
    academic_email: email,
    whatsapp_number: '+62 812-4567-8910',
    account_status: statusUpper,
    badge_role_label: 'Atelier Master Instructor',
    avatar_url: null,
    specialties: [specialty],
    credentials_text: `Instruktur Terverifikasi Yugyo Atelier (${fullName})`,
    bio_text: `Mengampu sesi praktik, konsultasi resep, dan evaluasi tugas peserta kelas bersama ${fullName} di Yugyo Atelier.`,
  };
}

async function getAuthenticatedTeacher() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('yugyo_user_id')?.value;

  if (userId) {
    const res = await pool.query(
      "SELECT id, full_name, email, role, status, specialty FROM users WHERE id = $1 AND role = 'teacher' LIMIT 1;",
      [userId]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  }

  const fallback = await pool.query(
    "SELECT id, full_name, email, role, status, specialty FROM users WHERE role = 'teacher' ORDER BY id ASC LIMIT 1;"
  );
  return fallback.rows[0] || null;
}

export default async function TeacherProfilePage() {
  await ensureInstructorProfileTable();

  const user = await getAuthenticatedTeacher();
  let profile = null;

  if (user) {
    const dbStatus = normalizeUserStatus(user.status);

    let profRes = await pool.query(
      'SELECT * FROM instructor_profiles WHERE user_id = $1 LIMIT 1;',
      [user.id]
    );

    if (profRes.rows.length === 0) {
      const defaults = buildDefaultProfileForUser(user);
      profRes = await pool.query(
        `INSERT INTO instructor_profiles (
          user_id, display_name_title, academic_email, whatsapp_number,
          account_status, badge_role_label, avatar_url, specialties,
          credentials_text, bio_text
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
        RETURNING *;`,
        [
          user.id,
          defaults.display_name_title,
          defaults.academic_email,
          defaults.whatsapp_number,
          dbStatus,
          defaults.badge_role_label,
          defaults.avatar_url,
          JSON.stringify(defaults.specialties),
          defaults.credentials_text,
          defaults.bio_text,
        ]
      );
    }

    profile = {
      ...profRes.rows[0],
      account_status: dbStatus,
    };
  }

  return (
    <InstructorProfileClient
      user={user}
      initialProfile={profile}
    />
  );
}