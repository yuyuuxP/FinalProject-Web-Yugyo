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

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const nextStatus = body.status ? String(body.status) : null;
    const replyMessage =
      typeof body.replyMessage === 'string' ? body.replyMessage.trim() : null;

    const numericId = Number(id);
    const pool = await getPgPool();
    if (pool && Number.isInteger(numericId) && numericId > 0) {
      await pool.query(
        `
        UPDATE reports
        SET
          status = COALESCE($1, status),
          admin_reply = COALESCE($2, admin_reply)
        WHERE id = $3
        `,
        [nextStatus, replyMessage, numericId]
      ).catch((err) => console.error('PATCH DB error:', err));
    }

    const list = await readReports();
    const idx = list.findIndex((item) => String(item.id) === String(id));

    let updatedItem = null;
    if (idx !== -1) {
      updatedItem = {
        ...list[idx],
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(replyMessage
          ? {
              adminReply: {
                name: 'Admin Yugyo Atelier',
                initials: 'AD',
                message: replyMessage,
              },
            }
          : {}),
      };
      list[idx] = updatedItem;
      await writeReports(list);
    }

    return NextResponse.json(
      { success: true, report: updatedItem || { id, status: nextStatus } },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error updating report by admin:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui status report.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    const pool = await getPgPool();
    if (pool && Number.isInteger(numericId) && numericId > 0) {
      await pool
        .query(`DELETE FROM reports WHERE id = $1`, [numericId])
        .catch((err) => console.error('DELETE DB error:', err));
    }

    const list = await readReports();
    const nextList = list.filter((item) => String(item.id) !== String(id));
    await writeReports(nextList);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Error deleting report:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus report.' },
      { status: 500 }
    );
  }
}