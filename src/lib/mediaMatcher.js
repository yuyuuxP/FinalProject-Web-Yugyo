import fs from 'node:fs/promises';
import path from 'node:path';

export const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);
export const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

export const DEFAULT_VIDEO_FOLDERS = [
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
  'kue',
  'bread',
  'roti',
  'cookie',
  'cookies',
  'pastry',
  'prancis',
  'mewah',
  'special',
  'spesial',
  'double',
  'with',
  'dan',
  'the',
  'untuk',
  'pemula',
  'dekorasi',
  'ala',
  'green',
  'tea',
  'tradisional',
  'keik',
  'cangkang',
]);

const TOKEN_ALIASES = new Map([
  ['salindri', 'lindri'],
  ['tartle', 'tartlet'],
  ['tarte', 'tartlet'],
  ['crinckle', 'crinkle'],
  ['crinkles', 'crinkle'],
  ['geomatric', 'geometric'],
  ['shadding', 'shading'],
  ['fondan', 'fondant'],
  ['madeleines', 'madeleine'],
  ['florentines', 'florentine'],
]);

export function normalizeMediaText(text) {
  const ascii = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.(mp4|webm|mov|m4v|mkv|jpg|jpeg|png|webp|gif|avif)$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!ascii) return '';
  return ascii
    .split(' ')
    .map((tok) => TOKEN_ALIASES.get(tok) || tok)
    .join(' ');
}

export function getCoreMediaKeywords(text) {
  const words = normalizeMediaText(text)
    .split(' ')
    .filter((w) => w.length >= 2);
  const core = words.filter((w) => !GENERIC_WORDS.has(w));
  return core.length > 0 ? core : words;
}

export function humanizeMediaFileName(fileName) {
  return String(fileName || '')
    .replace(/\.(mp4|webm|mov|m4v|mkv|jpg|jpeg|png|webp|gif|avif)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function isVideoRelevantToCourse(courseTitle, fileName) {
  const normCourse = normalizeMediaText(courseTitle);
  const normFile = normalizeMediaText(fileName);
  if (!normCourse || !normFile) return false;

  if (normFile.includes(normCourse) || normCourse.includes(normFile)) {
    return true;
  }

  const coreKeywords = getCoreMediaKeywords(courseTitle);
  if (coreKeywords.length === 0) return false;
  return coreKeywords.every((kw) => normFile.includes(kw));
}

export async function scanAllCategoryVideos() {
  const videosRoot = path.join(process.cwd(), 'public', 'videos');
  const allVideos = [];

  async function walk(currentDir, relSegments = []) {
    let entries = [];
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(currentDir, entry.name);
      const nextSegments = [...relSegments, entry.name];

      if (entry.isDirectory()) {
        // Skip folder upload sementara agar tidak bercampur ke katalog otomatis
        if (relSegments.length === 0 && entry.name.toLowerCase() === 'upload') {
          continue;
        }
        await walk(fullPath, nextSegments);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!VIDEO_EXTENSIONS.has(ext)) continue;

        const folder = relSegments.join('/') || 'root';
        const mediaUrl = `/videos/${nextSegments.join('/')}`;
        const encodedUrl =
          '/videos/' + nextSegments.map((seg) => encodeURIComponent(seg)).join('/');

        allVideos.push({
          fileName: entry.name,
          title: humanizeMediaFileName(entry.name),
          folder,
          mediaUrl,
          encodedUrl,
        });
      }
    }
  }

  await walk(videosRoot, []);
  return allVideos;
}

export async function findMatchedVideosForCourse(
  courseTitle,
  preScannedVideos = null,
  categoryName = ''
) {
  const allVideos = Array.isArray(preScannedVideos)
    ? preScannedVideos
    : await scanAllCategoryVideos();

  const normCourse = normalizeMediaText(courseTitle);
  if (!normCourse) return [];

  const normCat = normalizeMediaText(categoryName);
  const matched = [];

  for (const vid of allVideos) {
    if (isVideoRelevantToCourse(courseTitle, vid.fileName)) {
      const normFile = normalizeMediaText(vid.fileName);
      const isExact =
        normFile === normCourse ||
        normFile.includes(normCourse) ||
        normCourse.includes(normFile);

      let score = isExact ? 100 : 50;
      const folderNorm = normalizeMediaText(vid.folder);
      if (normCat && folderNorm && (normCat.includes(folderNorm) || folderNorm.includes(normCat))) {
        score += 10;
      }

      matched.push({
        ...vid,
        score,
      });
    }
  }

  matched.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return matched;
}
