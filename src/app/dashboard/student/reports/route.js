import fs from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const REPORTS_UPLOAD_DIR = path.join(process.cwd(), 'public', 'pictures', 'reports');
const REPORTS_STORE_PATH = path.join(process.cwd(), 'data', 'student-reports.json');

const SEED_REPORTS = [
  {
    id: 'rep-video-1',
    username: 'Salwa',
    userEmail: 'salwa@yugyo.atelier',
    title: 'Video pemutaran sempat berhenti saat pindah resolusi',
    featureArea: 'Course & Video Player',
    severity: 'Sedang',
    reportedAt: '18 Nov 2026',
    status: 'Ditinjau',
    description:
      'Saat mengganti kualitas video di tengah modul praktik, pemutar sempat loading cukup lama sebelum kembali berjalan normal.',
    photoLabel: 'Screenshot Pemutar Video',
    photoCount: 1,
    photoUrl: '',
    photos: [],
    adminReply: {
      name: 'Tim Teknis Yugyo',
      initials: 'YT',
      message:
        'Terima kasih atas laporannya. Buffering saat perpindahan stream video sedang kami optimalkan.',
    },
  },
  {
    id: 'rep-schedule-2',
    username: 'Salwa',
    userEmail: 'salwa@yugyo.atelier',
    title: 'Konfirmasi jadwal kelas tampil dua kali setelah klik cepat',
    featureArea: 'Schedule & Booking',
    severity: 'Tinggi',
    reportedAt: '12 Nov 2026',
    status: 'Selesai',
    description:
      'Ketika tombol simpan jadwal ditekan berulang kali dengan cepat, notifikasi status muncul ganda pada tampilan jadwal.',
    photoLabel: 'Bukti Tampilan Jadwal',
    photoCount: 0,
    photoUrl: '',
    photos: [],
    adminReply: null,
  },
];

function decodeSessionCookie(rawVal) {
  if (!rawVal) return null;
  try {
    const decoded = decodeURIComponent(rawVal);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // abaikan
  }
  try {
    const parsed = JSON.parse(Buffer.from(rawVal, 'base64').toString('utf8'));
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // abaikan
  }
  return null;
}

async function resolveCurrentStudentIdentity() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const c of allCookies) {
      const session = decodeSessionCookie(c.value);
      const userObj = session?.user && typeof session.user === 'object' ? session.user : session;
      const uname =
        userObj?.username ||
        userObj?.full_name ||
        userObj?.name ||
        userObj?.user_name ||
        '';
      if (uname && String(uname).trim().length > 0) {
        return {
          username: String(uname).trim(),
          email: String(userObj?.email || '').trim(),
        };
      }
    }
  } catch {
    // abaikan jika tidak ada cookie sesi
  }
  return { username: 'Salwa', email: '' };
}

async function readStoredReports() {
  try {
    const raw = await fs.readFile(REPORTS_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // file belum ada, kembalikan seed awal
  }
  return [...SEED_REPORTS];
}

async function writeStoredReports(list) {
  await fs.mkdir(path.dirname(REPORTS_STORE_PATH), { recursive: true });
  await fs.writeFile(REPORTS_STORE_PATH, JSON.stringify(list, null, 2), 'utf8');
}

function parseBase64Image(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;

  const rawExt = match[1].toLowerCase();
  const base64Data = match[2];

  let ext = 'png';
  if (rawExt === 'jpeg' || rawExt === 'jpg') ext = 'jpg';
  else if (rawExt === 'webp') ext = 'webp';
  else if (rawExt === 'gif') ext = 'gif';
  else if (rawExt === 'png') ext = 'png';

  const buffer = Buffer.from(base64Data, 'base64');
  if (!buffer || buffer.length === 0) return null;

  return { buffer, ext };
}

async function saveReportPhotos(photos) {
  if (!Array.isArray(photos) || photos.length === 0) return [];

  await fs.mkdir(REPORTS_UPLOAD_DIR, { recursive: true });
  const savedFiles = [];

  for (let i = 0; i < Math.min(photos.length, 3); i += 1) {
    const item = photos[i];
    const parsed = parseBase64Image(item?.url || '');
    if (!parsed) {
      if (typeof item?.url === 'string' && item.url.startsWith('/pictures/reports/')) {
        savedFiles.push({
          id: item?.id || `saved-${Date.now()}-${i + 1}`,
          caption: item?.caption || 'Bukti Error',
          fileName: path.basename(item.url),
          url: item.url,
        });
      }
      continue;
    }

    const safeBase =
      String(item?.caption || 'bug-proof')
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24) || 'bug-proof';

    const fileName = `report-${Date.now()}-${i + 1}-${safeBase}.${parsed.ext}`;
    const targetPath = path.join(REPORTS_UPLOAD_DIR, fileName);

    await fs.writeFile(targetPath, parsed.buffer);

    savedFiles.push({
      id: item?.id || `saved-${Date.now()}-${i + 1}`,
      caption: item?.caption || 'Bukti Error',
      fileName,
      url: `/pictures/reports/${fileName}`,
    });
  }

  return savedFiles;
}

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

export async function GET() {
  try {
    const reports = await readStoredReports();
    return NextResponse.json({ success: true, reports }, { status: 200 });
  } catch (err) {
    console.error('Error reading reports:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat daftar report.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const identity = await resolveCurrentStudentIdentity();

    const senderUsername =
      String(body?.username || identity.username || 'Salwa').trim() || 'Salwa';
    const senderEmail = String(body?.userEmail || identity.email || '').trim();
    const featureArea = String(body?.featureArea || 'Lainnya').trim();
    const severityLabel = String(body?.severityLabel || body?.severity || 'Sedang').trim();
    const descriptionText = String(body?.description || '').trim();

    const savedPhotos = await saveReportPhotos(body?.photos || []);
    const primaryPhotoUrl = savedPhotos[0]?.url || '';

    const newReport = {
      id: `rep-${Date.now()}`,
      username: senderUsername,
      userEmail: senderEmail,
      title: `Keluhan pada ${featureArea}`,
      featureArea,
      severity: severityLabel,
      reportedAt: '23 Nov 2026',
      status: 'Baru Dikirim',
      description: descriptionText,
      photoLabel: savedPhotos[0]?.caption || body?.photos?.[0]?.caption || 'Gambar Bukti Error',
      photoCount: savedPhotos.length,
      photoUrl: primaryPhotoUrl,
      photos: savedPhotos,
      adminReply: null,
    };

    const currentList = await readStoredReports();
    const updatedList = [newReport, ...currentList];
    await writeStoredReports(updatedList);

    const cols = await getTableColumns('reports');
    if (cols.size > 0) {
      const insertCols = [];
      const insertVals = [];

      if (descriptionText) {
        if (cols.has('description')) {
          insertCols.push('description');
          insertVals.push(descriptionText);
        } else if (cols.has('comment')) {
          insertCols.push('comment');
          insertVals.push(descriptionText);
        }
      }

      if (cols.has('username')) {
        insertCols.push('username');
        insertVals.push(senderUsername);
      }

      if (cols.has('feature_area')) {
        insertCols.push('feature_area');
        insertVals.push(featureArea);
      }

      if (cols.has('severity')) {
        insertCols.push('severity');
        insertVals.push(severityLabel);
      }

      if (primaryPhotoUrl) {
        if (cols.has('image_url')) {
          insertCols.push('image_url');
          insertVals.push(primaryPhotoUrl);
        } else if (cols.has('photo_url')) {
          insertCols.push('photo_url');
          insertVals.push(primaryPhotoUrl);
        }
      }

      if (insertCols.length > 0) {
        const placeholders = insertCols.map((_, idx) => `$${idx + 1}`).join(', ');
        await pool
          .query(
            `INSERT INTO reports (${insertCols.join(', ')})
             VALUES (${placeholders});`,
            insertVals
          )
          .catch(() => null);
      }
    }

    return NextResponse.json(
      {
        success: true,
        report: newReport,
        savedPhotos,
        photoUrl: primaryPhotoUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error saving student bug report:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan report dan gambar.' },
      { status: 500 }
    );
  }
}