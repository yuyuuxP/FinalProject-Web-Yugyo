import pool from '@/lib/db';
import AdminCourseDetailModal from '@/components/AdminCourseDetailModal';

export default async function AdminCourseDetailPage({ params }) {
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
    <div className="relative min-h-screen bg-[#F9DDBB]">
      {/* Latar belakang halaman Course Management dengan efek blur agar fokus pada modal detail */}
      <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto opacity-35 pointer-events-none select-none">
        <h1 className="font-editorial text-2xl font-bold text-[#341D17]">Course Management</h1>
        <p className="text-xs text-[#341D17]/75">Memuat detail kurikulum atelier...</p>
      </div>

      {/* Modal Detail Course di Foreground */}
      <AdminCourseDetailModal
        course={
          course || {
            id: courseId,
            title: 'Detail Kurikulum Atelier',
            description: 'Kurikulum masterclass pastry profesional.',
          }
        }
      />
    </div>
  );
}