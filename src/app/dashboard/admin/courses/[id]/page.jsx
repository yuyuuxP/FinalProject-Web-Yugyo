import pool from '@/lib/db';
import AdminCoursesPage from '../page';
import AdminCourseDetailModal from '@/components/AdminCourseDetailModal';

export default async function AdminCourseDetailPage({ params, searchParams }) {
  const resolvedParams = await params;
  const courseId = resolvedParams.id;

  let course = null;

  try {
    const res = await pool.query(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.status,
        cat.name AS category_name,
        u.full_name AS instructor_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = $1
      LIMIT 1;
    `,
      [courseId]
    );

    if (res.rows.length > 0) {
      course = res.rows[0];
    }
  } catch (err) {
    console.error('Error fetching course detail:', err);
  }

  return (
    <div className="relative min-h-screen">
      
      {/* 1. LATAR BELAKANG: HALAMAN COURSE MANAGEMENT (TRANSPARAN) */}
      <div
        aria-hidden="true"
        className="opacity-40 pointer-events-none select-none max-h-screen overflow-hidden"
      >
        <AdminCoursesPage searchParams={searchParams} />
      </div>

      {/* 2. FOREGROUND: MODAL CARD DETAIL COURSE */}
      <AdminCourseDetailModal course={course || { id: courseId, title: 'Teknik Sheeting Mentega Tourage 84%', description: 'Kurikulum masterclass atelier' }} />

    </div>
  );
}