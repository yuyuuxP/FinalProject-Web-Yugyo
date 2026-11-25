import pool from '@/lib/db';
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
    <div className="min-h-screen bg-[#F9DDBB]">
      <RegisterInstructorCard categories={dbCategories} />
    </div>
  );
}