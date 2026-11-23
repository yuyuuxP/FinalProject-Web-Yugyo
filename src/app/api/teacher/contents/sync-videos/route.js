import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '@/lib/db';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);
const CATEGORY_FOLDERS = [
  'bread',
  'cakes_decor',
  'cookies',
  'french_pastry',
  'indo_cakes',
];

function normalizeTokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\.(mp4|webm|mov|m4v|mkv)$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function humanizeFileName(fileName) {
  return String(fileName || '')
    .replace(/\.(mp4|webm|mov|m4v|mkv)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const courseId = Number(body?.course_id);
    const courseTitle = String(body?.course_title || '').trim();

    if (!courseId || !courseTitle) {
      return NextResponse.json(
        { success: false, error: 'course_id dan course_title wajib diisi.' },
        { status: 400 }
      );
    }

    const videosRoot = path.join(process.cwd(), 'public', 'videos');
    const courseTokens = normalizeTokens(courseTitle);
    const matchedVideos = [];

    for (const folder of CATEGORY_FOLDERS) {
      const folderPath = path.join(videosRoot, folder);
      try {
        const entries = await fs.readdir(folderPath, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile()) continue;
          const ext = path.extname(entry.name).toLowerCase();
          if (!VIDEO_EXTENSIONS.has(ext)) continue;

          const fileTokens = normalizeTokens(entry.name);
          let score = 0;
          for (const cTok of courseTokens) {
            if (fileTokens.includes(cTok)) score += 3;
            else if (fileTokens.some((fTok) => fTok.includes(cTok) || cTok.includes(fTok))) {
              score += 1;
            }
          }

          if (score >= 2 || (courseTokens.length > 0 && score >= 1)) {
            matchedVideos.push({
              title: humanizeFileName(entry.name),
              mediaUrl: `/videos/${folder}/${entry.name}`,
              score,
            });
          }
        }
      } catch {
        // Lewati folder yang belum ada
      }
    }

    matchedVideos.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

    const existingRes = await pool.query(
      'SELECT media_url, sort_order FROM course_contents WHERE course_id = $1;',
      [courseId]
    );

    const existingUrls = new Set(
      (existingRes.rows || []).map((r) => String(r.media_url || '').trim())
    );
    let nextOrder = Math.max(
      0,
      ...(existingRes.rows || []).map((r) => Number(r.sort_order) || 0)
    );

    let insertedCount = 0;
    for (const vid of matchedVideos) {
      if (existingUrls.has(vid.mediaUrl)) continue;
      nextOrder += 1;
      await pool.query(
        `INSERT INTO course_contents
          (course_id, title, content_type, duration_label, media_url, summary, sort_order)
         VALUES ($1, $2, 'video', '20 Menit', $3, $4, $5);`,
        [
          courseId,
          vid.title,
          vid.mediaUrl,
          `Video pembelajaran terhubung dari folder untuk kursus ${courseTitle}.`,
          nextOrder,
        ]
      );
      existingUrls.add(vid.mediaUrl);
      insertedCount += 1;
    }

    return NextResponse.json({
      success: true,
      insertedCount,
      matchedCount: matchedVideos.length,
    });
  } catch (error) {
    console.error('Error syncing videos to course_contents:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan video ke materi kursus.' },
      { status: 500 }
    );
  }
}