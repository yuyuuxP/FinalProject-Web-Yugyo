import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseTitle = searchParams.get('courseTitle') || '';
    const categoryName = (searchParams.get('category') || '').toLowerCase();

    const videosRoot = path.join(process.cwd(), 'public', 'videos');
    const courseTokens = normalizeTokens(courseTitle);
    const matchedFiles = [];
    const allFolderFiles = [];

    for (const folder of CATEGORY_FOLDERS) {
      const folderPath = path.join(videosRoot, folder);
      try {
        const entries = await fs.readdir(folderPath, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile()) continue;
          const ext = path.extname(entry.name).toLowerCase();
          if (!VIDEO_EXTENSIONS.has(ext)) continue;

          const fileUrl = `/videos/${folder}/${encodeURIComponent(entry.name)}`;
          const rawUrl = `/videos/${folder}/${entry.name}`;
          const fileTokens = normalizeTokens(entry.name);

          let score = 0;
          for (const cTok of courseTokens) {
            if (fileTokens.includes(cTok)) score += 3;
            else if (fileTokens.some((fTok) => fTok.includes(cTok) || cTok.includes(fTok))) {
              score += 1;
            }
          }

          if (categoryName.includes(folder.replace('_', ' ')) || folder.includes(categoryName)) {
            score += 1;
          }

          const item = {
            fileName: entry.name,
            title: humanizeFileName(entry.name),
            folder,
            mediaUrl: rawUrl,
            encodedUrl: fileUrl,
            score,
          };

          allFolderFiles.push(item);
          if (score >= 2 || (courseTokens.length > 0 && score >= 1)) {
            matchedFiles.push(item);
          }
        }
      } catch {
        // Lewati folder jika belum ada di disk
      }
    }

    matchedFiles.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

    return NextResponse.json({
      success: true,
      courseTitle,
      matchedVideos: matchedFiles.length > 0 ? matchedFiles : allFolderFiles.slice(0, 5),
      totalMatched: matchedFiles.length,
    });
  } catch (error) {
    console.error('Error scanning public/videos:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membaca folder video pembelajaran.' },
      { status: 500 }
    );
  }
}