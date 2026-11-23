import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const REPORTS_STORE_PATH = path.join(process.cwd(), 'data', 'student-reports.json');

async function getPgPool() {
  try {
    const dbModule = await import('@/lib/db').catch(() => null);
    if (dbModule?.default?.query) return dbModule.default;
    if (dbModule?.pool?.query) return dbModule.pool;

    const pgModule = await import('pg').catch(() => null);
    const Pool = pgModule?.Pool || pgModule?.default?.Pool;
    const connStr = process.env.DATABASE_URL;
    if (Pool && connStr) {
      if (!globalThis.__yugyoPgPool) {
        globalThis.__yugyoPgPool = new Pool({ connectionString: connStr });
      }
      return globalThis.__yugyoPgPool;
    }
  } catch {
    // Abaikan error modul db
  }
  return null;
}

async function readReports() {
  try {
    const raw = await fs.readFile(REPORTS_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeReports(list) {
  await fs.mkdir(path.dirname(REPORTS_STORE_PATH), { recursive: true });
  await fs.writeFile(REPORTS_STORE_PATH, JSON.stringify(list, null, 2), 'utf8');
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    const pool = await getPgPool();

    if (pool && Number.isInteger(numericId) && numericId > 0) {
      await pool
        .query(`DELETE FROM reports WHERE id = $1`, [numericId])
        .catch((err) => console.error('DELETE student report DB error:', err));
    }

    const list = await readReports();
    const nextList = list.filter((item) => String(item.id) !== String(id));
    await writeReports(nextList);

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (err) {
    console.error('Error deleting student report:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus riwayat report.' },
      { status: 500 }
    );
  }
}