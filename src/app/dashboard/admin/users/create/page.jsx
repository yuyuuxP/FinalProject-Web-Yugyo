import pool from '@/lib/db';
import CreateUserModal from '@/components/admin/CreateUserModal';

export const dynamic = 'force-dynamic';

async function getTableColumns(tableName) {
  const res = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1;`,
    [tableName]
  );
  return new Set((res.rows || []).map((r) => r.column_name));
}

export default async function CreateUserPage() {
  const categoryCols = await getTableColumns('categories');
  const courseCols = await getTableColumns('courses');
  const userCols = await getTableColumns('users');

  const teacherLinkCols = [
    'lead_instructor_id',
    'instructor_id',
    'teacher_id',
    'user_id',
  ].filter((col) => categoryCols.has(col));

  const selectCols = ['id', 'name', ...teacherLinkCols].join(', ');
  const catRes = await pool.query(
    `SELECT ${selectCols}
     FROM categories
     ORDER BY name ASC;`
  );

  const takenCategoryIds = new Set();
  const takenCategoryNames = new Set();

  for (const row of catRes.rows || []) {
    const hasTeacherInCat = teacherLinkCols.some(
      (col) => row[col] !== null && row[col] !== undefined && row[col] !== ''
    );
    if (hasTeacherInCat) {
      takenCategoryIds.add(String(row.id));
      if (row.name) {
        takenCategoryNames.add(String(row.name).trim().toLowerCase());
      }
    }
  }

  if (courseCols.has('category_id') && courseCols.has('instructor_id')) {
    const courseCatRes = await pool.query(
      `SELECT DISTINCT category_id
       FROM courses
       WHERE category_id IS NOT NULL
         AND instructor_id IS NOT NULL;`
    );
    for (const r of courseCatRes.rows || []) {
      if (r.category_id !== null && r.category_id !== undefined) {
        takenCategoryIds.add(String(r.category_id));
      }
    }
  }

  if (userCols.has('specialty')) {
    const specRes = await pool.query(
      `SELECT DISTINCT LOWER(TRIM(specialty)) AS spec_name
       FROM users
       WHERE LOWER(COALESCE(role, '')) IN ('teacher', 'instructor', 'guru')
         AND COALESCE(LOWER(status), 'active') <> 'pending'
         AND specialty IS NOT NULL
         AND TRIM(specialty) <> '';`
    );
    for (const r of specRes.rows || []) {
      if (r.spec_name) {
        takenCategoryNames.add(String(r.spec_name));
      }
    }
  }

  const categories = (catRes.rows || []).map((cat) => {
    const normName = String(cat.name || '').trim().toLowerCase();
    const hasTeacher =
      takenCategoryIds.has(String(cat.id)) ||
      (normName && takenCategoryNames.has(normName));

    return {
      id: cat.id,
      name: cat.name,
      has_teacher: hasTeacher,
    };
  });

  return <CreateUserModal categories={categories} />;
}