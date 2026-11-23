import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const REPORTS_UPLOAD_DIR = path.join(process.cwd(), 'public', 'pictures', 'reports');

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
    if (!parsed) continue;

    const safeBase = String(item?.caption || 'bug-proof')
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

export async function POST(request) {
  try {
    const body = await request.json();
    const savedPhotos = await saveReportPhotos(body?.photos || []);
    const primaryPhotoUrl = savedPhotos[0]?.url || '';

    const cols = await getTableColumns('reports');

    if (cols.size > 0) {
      const insertCols = [];
      const insertVals = [];

      const descriptionText = String(body?.description || '').trim();
      if (descriptionText) {
        if (cols.has('description')) {
          insertCols.push('description');
          insertVals.push(descriptionText);
        } else if (cols.has('comment')) {
          insertCols.push('comment');
          insertVals.push(descriptionText);
        }
      }

      if (body?.featureArea && cols.has('feature_area')) {
        insertCols.push('feature_area');
        insertVals.push(String(body.featureArea));
      }

      if (body?.severity && cols.has('severity')) {
        insertCols.push('severity');
        insertVals.push(String(body.severity));
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
        await pool.query(
          `INSERT INTO reports (${insertCols.join(', ')})
           VALUES (${placeholders});`,
          insertVals
        ).catch(() => null);
      }
    }

    return NextResponse.json(
      {
        success: true,
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