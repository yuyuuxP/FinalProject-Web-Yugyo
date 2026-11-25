import fs from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const COURSES_UPLOAD_DIR = path.join(PUBLIC_DIR, 'pictures', 'courses');
const CATEGORIES_UPLOAD_DIR = path.join(PUBLIC_DIR, 'pictures', 'categories');

const ALLOWED_MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]);

function isSupportedImageUpload(file) {
  if (
    !file ||
    typeof file !== 'object' ||
    typeof file.arrayBuffer !== 'function' ||
    typeof file.size !== 'number' ||
    file.size <= 0
  ) {
    return false;
  }

  const mimeType = String(file.type || '').toLowerCase();
  const extension = path.extname(String(file.name || '')).toLowerCase();
  const mimeExtension = ALLOWED_MIME_EXT[mimeType];

  if (mimeExtension) {
    return (
      !extension ||
      (ALLOWED_IMAGE_EXTENSIONS.has(extension) &&
        (extension === mimeExtension ||
          (mimeExtension === '.jpg' && extension === '.jpeg')))
    );
  }

  return (
    (!mimeType || mimeType === 'application/octet-stream') &&
    ALLOWED_IMAGE_EXTENSIONS.has(extension)
  );
}

function sanitizeBaseName(originalName = 'image') {
  const withoutExt = String(originalName).replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return cleaned || 'upload';
}

function resolveExtension(file) {
  const mimeExt = ALLOWED_MIME_EXT[(file?.type || '').toLowerCase()];
  if (mimeExt) return mimeExt;

  const origExt = path.extname(file?.name || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(origExt)) {
    return origExt === '.jpeg' ? '.jpg' : origExt;
  }
  return '.png';
}

/**
 * Menyimpan file gambar upload ke:
 * - type = 'course'   -> public/pictures/courses/<filename>
 * - type = 'category' -> public/pictures/categories/<filename>
 * Mengembalikan public URL seperti '/pictures/courses/...' atau '/pictures/categories/...'
 */
export async function saveUploadedImage(file, type = 'course') {
  if (!isSupportedImageUpload(file)) {
    return null;
  }

  const targetDir = type === 'category' ? CATEGORIES_UPLOAD_DIR : COURSES_UPLOAD_DIR;
  const publicPrefix = type === 'category' ? '/pictures/categories' : '/pictures/courses';

  await fs.mkdir(targetDir, { recursive: true });

  const ext = resolveExtension(file);
  const baseName = sanitizeBaseName(file.name);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${baseName}${ext}`;
  const fullPath = path.join(targetDir, uniqueName);

  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, bytes);

  return `${publicPrefix}/${uniqueName}`;
}

/**
 * Menghapus file lokal di dalam public/pictures/courses atau public/pictures/categories
 * secara aman (mencegah path traversal keluar folder target).
 */
export async function deleteLocalPictureFile(imageUrl, expectedFolder = null) {
  if (!imageUrl || typeof imageUrl !== 'string') return;

  const trimmed = imageUrl.trim();
  if (!trimmed.startsWith('/pictures/')) return;

  const relativePath = trimmed.replace(/^\/+/, ''); // 'pictures/courses/...'
  const allowedRoot =
    expectedFolder === 'courses'
      ? COURSES_UPLOAD_DIR
      : expectedFolder === 'categories'
      ? CATEGORIES_UPLOAD_DIR
      : path.join(PUBLIC_DIR, 'pictures');

  const resolvedTarget = path.resolve(PUBLIC_DIR, relativePath);
  const resolvedRoot = path.resolve(allowedRoot);

  // Pastikan target berada di dalam direktori yang diizinkan
  if (!resolvedTarget.startsWith(resolvedRoot + path.sep) && resolvedTarget !== resolvedRoot) {
    return;
  }

  try {
    await fs.unlink(resolvedTarget);
  } catch (err) {
    if (err?.code !== 'ENOENT') {
      console.error('Gagal menghapus file gambar lokal:', err);
    }
  }
}