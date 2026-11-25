import pool from '@/lib/db';
import { cookies } from 'next/headers';
import CourseManagementClient from '@/components/teacher/CourseManagementClient';

export default async function TeacherCoursesPage() {
  let teacherId = null;
  let courses = [];

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('yugyo_user_id')?.value;

    if (userId) {
      const teacherRes = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'teacher';", [userId]);
      if (teacherRes.rows.length > 0) {
        teacherId = teacherRes.rows[0].id;
      }
    } 
    
    if (teacherId) {
      const coursesRes = await pool.query(`
        SELECT c.*, 
               cat.name as category_name,
               u.full_name as instructor_name,
               (SELECT COUNT(se.id) FROM student_enrollments se WHERE se.course_id = c.id) as enrolled_count
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.instructor_id = $1
        ORDER BY c.id DESC;
      `, [teacherId]);
      courses = coursesRes.rows;
    }

} catch (err) {
    console.error('Error fetching teacher courses:', err);
  }

  return <CourseManagementClient courses={courses} />;
}