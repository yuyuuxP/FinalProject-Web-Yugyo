import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

const REPORTS_STORE_PATH = path.join(process.cwd(), 'data', 'student-reports.json');

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
    const list = await readReports();
    const idx = list.findIndex((item) => String(item.id) === String(id));

    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: 'Report tidak ditemukan.' },
        { status: 404 }
      );
    }

    const updatedItem = {
      ...list[idx],
      ...(body.status ? { status: String(body.status) } : {}),
      ...(body.replyMessage
        ? {
            adminReply: {
              name: 'Admin Yugyo Atelier',
              initials: 'AD',
              message: String(body.replyMessage).trim(),
            },
          }
        : {}),
    };

    list[idx] = updatedItem;
    await writeReports(list);

    return NextResponse.json({ success: true, report: updatedItem }, { status: 200 });
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