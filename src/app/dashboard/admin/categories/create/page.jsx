import pool from '@/lib/db';
import CreateCategoryModal from '@/components/admin/CreateCategoryModal';

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

export default async function CreateCategoryPage() {
  const userCols = await getTableColumns('users');
  const categoryCols = await getTableColumns('categories');
  const courseCols = await getTableColumns('courses');

  const specialtyExpr = userCols.has('specialty')
    ? 'u.specialty'
    : 'NULL::text AS specialty';
  const statusExpr = userCols.has('status')
    ? 'u.status'
    : "'active'::text AS status";
  const statusFilter = userCols.has('status')
    ? "AND LOWER(COALESCE(u.status, 'active')) <> 'pending'"
    : '';

  const teachersRes = await pool.query(
    `SELECT
      u.id,
      u.full_name,
      ${specialtyExpr},
      u.role,
      ${statusExpr}
    FROM users u
    WHERE LOWER(COALESCE(u.role, '')) IN ('teacher', 'instructor', 'guru')
      ${statusFilter}
    ORDER BY u.full_name ASC;`
  );

  const assignedMap = {};

  if (categoryCols.size > 0) {
    const teacherLinkCols = [
      'lead_instructor_id',
      'instructor_id',
      'teacher_id',
      'user_id',
    ].filter((col) => categoryCols.has(col));

    if (teacherLinkCols.length > 0) {
      const selectCols = ['id', 'name', ...teacherLinkCols].join(', ');
      const catRes = await pool.query(`SELECT ${selectCols} FROM categories;`);

      for (const row of catRes.rows || []) {
        for (const col of teacherLinkCols) {
          const val = row[col];
          if (val !== null && val !== undefined && val !== '') {
            assignedMap[String(val)] = row.name || 'Kategori lain';
          }
        }
      }
    }

    if (
      Object.keys(assignedMap).length === 0 &&
      courseCols.has('category_id') &&
      courseCols.has('instructor_id')
    ) {
      const relRes = await pool.query(
        `SELECT DISTINCT
          c.instructor_id,
          cat.name AS category_name
         FROM courses c
         INNER JOIN categories cat ON cat.id = c.category_id
         WHERE c.instructor_id IS NOT NULL;`
      );

      for (const r of relRes.rows || []) {
        if (r.instructor_id) {
          assignedMap[String(r.instructor_id)] =
            r.category_name || 'Kategori lain';
        }
      }
    }
  }

  const teachers = (teachersRes.rows || [])
    .filter((t) => String(t.status || '').toLowerCase() !== 'pending')
    .map((t) => {
      const assignedCategoryName = assignedMap[String(t.id)] || null;
      return {
        ...t,
        assigned_category_name: assignedCategoryName,
        is_assigned: Boolean(assignedCategoryName),
      };
    });

  return <CreateCategoryModal teachers={teachers} />;
}