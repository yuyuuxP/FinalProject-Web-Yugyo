import pool from '@/lib/db';
import UsersManagementClient from '@/components/admin/UsersManagementClient';

export const dynamic = 'force-dynamic';

async function getTableColumns(tableName) {
  try {
    const res = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1;`,
      [tableName]
    );
    return new Set((res.rows || []).map((r) => String(r.column_name).toLowerCase()));
  } catch {
    return new Set();
  }
}

export default async function AdminUsersPage() {
  const userCols = await getTableColumns('users');

  const nameExpr = userCols.has('full_name')
    ? 'u.full_name'
    : userCols.has('name')
    ? 'u.name AS full_name'
    : "split_part(u.email, '@', 1) AS full_name";

  const statusExpr = userCols.has('status')
    ? "COALESCE(NULLIF(TRIM(u.status), ''), 'active')"
    : "'active'";

  const specialtyExpr = userCols.has('specialty')
    ? 'u.specialty'
    : 'NULL::text AS specialty';

  const createdAtExpr = userCols.has('created_at')
    ? 'u.created_at'
    : 'NULL::timestamp AS created_at';
  const portfolioUrlExpr = userCols.has('portfolio_url')
    ? 'u.portfolio_url'
    : 'NULL::text AS portfolio_url';
  const portfolioFilePathExpr = userCols.has('portfolio_file_path')
    ? 'u.portfolio_file_path'
    : 'NULL::text AS portfolio_file_path';
  const portfolioFileNameExpr = userCols.has('portfolio_file_name')
    ? 'u.portfolio_file_name'
    : 'NULL::text AS portfolio_file_name';

  let users = [];
  try {
    const result = await pool.query(
      `SELECT
        u.id,
        ${nameExpr},
        u.email,
        COALESCE(NULLIF(TRIM(u.role), ''), 'student') AS role,
        ${statusExpr} AS status,
        ${specialtyExpr},
        ${createdAtExpr},
        ${portfolioUrlExpr},
        ${portfolioFilePathExpr},
        ${portfolioFileNameExpr}
      FROM users u
      WHERE LOWER(COALESCE(u.role, '')) <> 'admin'
      ORDER BY u.id ASC;`
    );

    users = (result.rows || []).filter(
      (u) => String(u?.role || '').trim().toLowerCase() !== 'admin'
    );
  } catch (err) {
    console.error('Error loading users in AdminUsersPage:', err);
  }

  return <UsersManagementClient initialUsers={users} users={users} />;
}