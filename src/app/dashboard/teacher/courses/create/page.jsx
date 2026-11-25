import pool from '@/lib/db';
import { cookies } from 'next/headers';
import CreateCourseClient from '@/components/teacher/CreateCourseClient';

export default async function CreateCoursePage() {
  let teacher = null;
  let assignedCategory = null;

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('yugyo_user_id')?.value;

    // 1. Ambil data guru yang sedang login
    if (userId) {
      const teacherRes = await pool.query("SELECT id, full_name, specialty FROM users WHERE id = $1 AND role = 'teacher';", [userId]);
      if (teacherRes.rows.length > 0) {
        teacher = teacherRes.rows[0];
      }
    }

    // 2. Cari kategori di database yang cocok dengan spesialisasi guru (specialty)
    if (teacher && teacher.specialty) {
      const catRes = await pool.query("SELECT id, name FROM categories WHERE name ILIKE $1 LIMIT 1;", [ `%${teacher.specialty}%` ]);
      if (catRes.rows.length > 0) {
        assignedCategory = catRes.rows[0];
      }
    }

    // Fallback jika tidak ketemu
    if (!assignedCategory) {
      const defaultCat = await pool.query("SELECT id, name FROM categories ORDER BY id ASC LIMIT 1;");
      assignedCategory = defaultCat.rows[0];
    }

  } catch (err) {
    console.error('Error fetching teacher specialty/category:', err);
  }

  return <CreateCourseClient teacher={teacher} assignedCategory={assignedCategory} />;
}