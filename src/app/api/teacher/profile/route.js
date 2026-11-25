import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';
import { requireActiveTeacher } from '@/lib/teacher-access';

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

export async function PATCH(request) {
  try {
    const access = await requireActiveTeacher();
    if (access.response) return access.response;

    await ensureInstructorProfileTable();
    const user = access.account;

    const dbStatus =
      String(user.status || '').toLowerCase() === 'pending' ? 'PENDING' : 'ACTIVE';

    const body = await request.json();
    const displayNameTitle = String(body?.display_name_title ?? '').trim();
    const whatsappNumber = String(body?.whatsapp_number ?? '').trim();
    const avatarUrl =
      typeof body?.avatar_url === 'string' && body.avatar_url.trim()
        ? body.avatar_url.trim()
        : null;
    const specialties = Array.isArray(body?.specialties)
      ? body.specialties
          .map((item) => String(item || '').trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];
    const credentialsText = String(body?.credentials_text ?? '').trim();
    const bioText = String(body?.bio_text ?? '').trim().slice(0, 600);

    const updatedRes = await pool.query(
      `INSERT INTO instructor_profiles (
        user_id, display_name_title, academic_email, whatsapp_number,
        account_status, avatar_url, specialties, credentials_text, bio_text, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        display_name_title = EXCLUDED.display_name_title,
        academic_email = EXCLUDED.academic_email,
        whatsapp_number = EXCLUDED.whatsapp_number,
        account_status = EXCLUDED.account_status,
        avatar_url = EXCLUDED.avatar_url,
        specialties = EXCLUDED.specialties,
        credentials_text = EXCLUDED.credentials_text,
        bio_text = EXCLUDED.bio_text,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;`,
      [
        user.id,
        displayNameTitle || `${user.full_name}, Master Baker Atelier`,
        user.email,
        whatsappNumber,
        dbStatus,
        avatarUrl,
        JSON.stringify(specialties),
        credentialsText,
        bioText,
      ]
    );

    const cleanName = displayNameTitle.split(',')[0]?.trim();
    if (cleanName) {
      await pool.query(
        'UPDATE users SET full_name = $1 WHERE id = $2;',
        [cleanName, user.id]
      );
    }

    revalidatePath('/dashboard/teacher/profile');
    revalidatePath('/dashboard/teacher');

    return NextResponse.json({
      success: true,
      profile: updatedRes.rows[0],
    });
  } catch (err) {
    console.error('PATCH /api/teacher/profile error:', err);
    return NextResponse.json(
      { message: `Gagal menyimpan profil: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}