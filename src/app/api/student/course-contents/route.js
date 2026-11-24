import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);
const CATEGORY_FOLDERS = [
  'bread',
  'cakes_decor',
  'cookies',
  'french_pastry',
  'indo_cakes',
];

const GENERIC_WORDS = new Set([
  'masterclass',
  'classic',
  'kelas',
  'kursus',
  'modul',
  'sesi',
  'dasar',
  'lanjutan',
  'otentik',
  'authentic',
  'klasik',
  'modern',
  'atelier',
  'anti',
  'gagal',
  'pain',
  'cake',
  'cakes',
  'bread',
  'cookie',
  'cookies',
  'pastry',
  'special',
  'spesial',
  'double',
  'with',
  'dan',
  'the',
]);

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\.(mp4|webm|mov|m4v|mkv)$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCoreKeywords(text) {
  const words = normalizeText(text)
    .split(' ')
    .filter((w) => w.length >= 2);
  const core = words.filter((w) => !GENERIC_WORDS.has(w));
  return core.length > 0 ? core : words;
}

function humanizeFileName(fileName) {
  return String(fileName || '')
    .replace(/\.(mp4|webm|mov|m4v|mkv)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function isVideoRelevantToCourse(courseTitle, fileName) {
  const normCourse = normalizeText(courseTitle);
  const normFile = normalizeText(fileName);
  if (!normCourse || !normFile) return false;

  if (normFile.includes(normCourse) || normCourse.includes(normFile)) {
    return true;
  }

  const coreKeywords = getCoreKeywords(courseTitle);
  if (coreKeywords.length === 0) return false;
  return coreKeywords.every((kw) => normFile.includes(kw));
}

async function scanAllCategoryVideos() {
  const videosRoot = path.join(process.cwd(), 'public', 'videos');
  const allVideos = [];

  for (const folder of CATEGORY_FOLDERS) {
    const folderPath = path.join(videosRoot, folder);
    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!VIDEO_EXTENSIONS.has(ext)) continue;

        allVideos.push({
          fileName: entry.name,
          title: humanizeFileName(entry.name),
          folder,
          mediaUrl: `/videos/${folder}/${entry.name}`,
        });
      }
    } catch {
      // Lewati folder jika belum ada di disk
    }
  }

  return allVideos;
}

function findMatchedVideosForCourse(courseTitle, allVideos) {
  const normCourse = normalizeText(courseTitle);
  if (!normCourse) return [];

  const matched = [];
  for (const vid of allVideos) {
    if (isVideoRelevantToCourse(courseTitle, vid.fileName)) {
      const normFile = normalizeText(vid.fileName);
      const isExact =
        normFile === normCourse ||
        normFile.includes(normCourse) ||
        normCourse.includes(normFile);

      matched.push({
        ...vid,
        score: isExact ? 100 : 50,
      });
    }
  }

  matched.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return matched;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseIdFilter = Number(
      searchParams.get('courseId') ?? searchParams.get('course_id') ?? ''
    );

    const [coursesRes, contentsRes, allVideos] = await Promise.all([
      pool
        .query('SELECT id, title FROM public.courses ORDER BY id ASC;')
        .catch(() => ({ rows: [] })),
      pool
        .query(
          `SELECT *
           FROM public.course_contents
           ORDER BY course_id ASC, order_index ASC NULLS LAST, id ASC;`
        )
        .catch(() => ({ rows: [] })),
      scanAllCategoryVideos(),
    ]);

    const courses = (coursesRes.rows || []).filter((c) =>
      Number.isInteger(courseIdFilter) && courseIdFilter > 0
        ? Number(c.id) === courseIdFilter
        : true
    );

    const rawDbContents = (contentsRes.rows || []).filter(
      (row) => String(row?.status || 'published').toLowerCase() !== 'draft'
    );

    const unifiedContents = [];

    for (const course of courses) {
      const courseIdNum = Number(course.id);
      const dbForCourse = rawDbContents.filter(
        (row) => Number(row.course_id) === courseIdNum
      );

      const seenIds = new Set();
      const seenSignature = new Set();
      const courseItems = [];

      for (let i = 0; i < dbForCourse.length; i += 1) {
        const row = dbForCourse[i];
        const idStr = row?.id !== undefined && row?.id !== null ? String(row.id) : '';
        const vidUrl = String(row?.video_url ?? row?.media_url ?? '').trim();
        const normTitle = String(row?.title || '').trim().toLowerCase();
        const sig = `${normTitle}::${vidUrl.toLowerCase()}`;

        if (idStr && seenIds.has(idStr)) continue;
        if (normTitle && seenSignature.has(sig)) continue;

        if (idStr) seenIds.add(idStr);
        if (normTitle) seenSignature.add(sig);

        courseItems.push({
          ...row,
          course_id: courseIdNum,
          course_title: course.title,
          description: row.description ?? row.summary ?? '',
          video_url: vidUrl || null,
          media_url: vidUrl || null,
          order_index: Number(row.order_index ?? row.sort_order ?? i + 1) || i + 1,
        });
      }

      const matchedVideos = findMatchedVideosForCourse(course.title, allVideos);
      for (let j = 0; j < matchedVideos.length; j += 1) {
        const vid = matchedVideos[j];
        const vidUrl = String(vid.mediaUrl || '').trim();
        const sig = `${String(vid.title || '').trim().toLowerCase()}::${vidUrl.toLowerCase()}`;
        if (seenSignature.has(sig)) continue;
        seenSignature.add(sig);

        courseItems.push({
          id: `folder-${courseIdNum}-${vid.fileName}-${j}`,
          course_id: courseIdNum,
          course_title: course.title,
          title: vid.title,
          description: '',
          video_url: vidUrl || null,
          media_url: vidUrl || null,
          status: 'published',
          order_index: courseItems.length + 1,
        });
      }

      courseItems.sort(
        (a, b) => (Number(a.order_index) || 999) - (Number(b.order_index) || 999)
      );
      unifiedContents.push(...courseItems);
    }

    return NextResponse.json({ contents: unifiedContents });
  } catch (err) {
    return NextResponse.json(
      { contents: [], error: err?.message || 'Gagal memuat modul kursus' },
      { status: 200 }
    );
  }
}