import pool from '@/lib/db';
import { cookies } from 'next/headers';
import ContentManagementClient from '@/components/teacher/ContentManagementClient';

export default async function TeacherContentsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const selectedCourseId = resolvedSearchParams?.courseId;

  let teacherId = null;
  let courses = [];
  let currentCourse = null;
  let contents = [];

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('yugyo_user_id')?.value;

    if (userId) {
      const teacherRes = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'teacher';", [userId]);
      if (teacherRes.rows.length > 0) {
        teacherId = teacherRes.rows[0].id;
      }
    }

    if (!teacherId) {
      const fallbackRes = await pool.query("SELECT id FROM users WHERE role = 'teacher' LIMIT 1;");
      if (fallbackRes.rows.length > 0) {
        teacherId = fallbackRes.rows[0].id;
      }
    }

    if (teacherId) {
      // 1. Ambil SEMUA kursus yang diampu oleh teacher ini
      const coursesRes = await pool.query(`
        SELECT c.*, u.full_name as instructor_name 
        FROM courses c 
        LEFT JOIN users u ON c.instructor_id = u.id 
        WHERE c.instructor_id = $1 
        ORDER BY c.id DESC;
      `, [teacherId]);

      courses = coursesRes.rows;

      if (courses.length > 0) {
        // Tentukan kursus aktif: berdasarkan parameter URL courseId atau kursus pertama
        if (selectedCourseId) {
          currentCourse = courses.find(c => String(c.id) === String(selectedCourseId)) || courses[0];
        } else {
          currentCourse = courses[0];
        }

        // 2. Ambil daftar materi/konten KHUSUS untuk kursus yang sedang aktif dipilih
        const contentRes = await pool.query(`
          SELECT * FROM course_contents 
          WHERE course_id = $1 
          ORDER BY order_index ASC, id ASC;
        `, [currentCourse.id]);
        
        contents = contentRes.rows;
      }
    }
  } catch (err) {
    console.error('Error fetching teacher contents & courses:', err);
  }

  return (
    <ContentManagementClient 
      courses={courses} 
      currentCourse={currentCourse} 
      contents={contents} 
    />
  );
}