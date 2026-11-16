import pool from '@/lib/db';
import YugyoLandingPage from '@/app/page';
import RegisterInstructorCard from '@/components/RegisterInstructorCard';

export default async function RegisterInstructorPage() {
  let dbCategories = [];

  try {
    const res = await pool.query('SELECT id, name, description FROM categories ORDER BY id ASC;');
    dbCategories = res.rows;
  } catch (err) {
    console.error('Error fetching categories for instructor registration:', err);
  }

  return (
    <div className="relative min-h-screen bg-[#F9DDBB] overflow-hidden">
      <div
        aria-hidden="true"
        className="opacity-45 pointer-events-none select-none max-h-screen overflow-hidden"
      >
        <YugyoLandingPage />
      </div>

      <RegisterInstructorCard categories={dbCategories} />
    </div>
  );
}