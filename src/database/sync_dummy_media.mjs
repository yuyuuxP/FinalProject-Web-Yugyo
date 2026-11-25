import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);

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
  ['ragi', 'ragi'],
  ['roti', 'roti'],
]);

const FOLDER_TO_CATEGORY_KEYS = [
  { folderKeys: ['bread', 'yeast', 'roti'], categoryKeys: ['bread', 'yeast', 'roti'] },
  { folderKeys: ['cakes_decor', 'decor', 'cake'], categoryKeys: ['decor', 'cakes decorating'] },
  { folderKeys: ['cookies', 'cookie'], categoryKeys: ['cookie', 'small bites'] },
  { folderKeys: ['french_pastry', 'french', 'patisserie', 'pastry'], categoryKeys: ['french', 'patisserie', 'pastry'] },
  { folderKeys: ['indo_cakes', 'indo', 'indonesia', 'nusantara'], categoryKeys: ['indonesian', 'indo', 'tradisional'] },
];

function normalizeText(text) {
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

function getCoreKeywords(text) {
  const words = normalizeText(text)
    .split(' ')
    .filter((w) => w.length >= 2);
  const core = words.filter((w) => !GENERIC_WORDS.has(w));
  return core.length > 0 ? core : words;
}

function humanizeFileName(fileName) {
  return String(fileName || '')
    .replace(/\.(mp4|webm|mov|m4v|mkv|jpg|jpeg|png|webp|gif|avif)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function scoreMediaMatch(courseTitle, categoryName, mediaItem) {
  const normCourse = normalizeText(courseTitle);
  const normFile = normalizeText(mediaItem.fileName);
  if (!normCourse || !normFile) return 0;

  let score = 0;
  if (normFile === normCourse) {
    score = 1000;
  } else if (normFile.length >= 3 && (normCourse.includes(normFile) || normFile.includes(normCourse))) {
    score = 800 + Math.min(150, normFile.length * 4);
  } else {
    const titleWords = normCourse.split(' ');
    const titleCore = getCoreKeywords(courseTitle);
    const fileCore = getCoreKeywords(mediaItem.fileName);
    if (titleCore.length === 0 || fileCore.length === 0) return 0;

    let matched = 0;
    for (const fKw of fileCore) {
      const exact = titleWords.includes(fKw) || titleCore.includes(fKw);
      const partial =
        !exact &&
        fKw.length >= 4 &&
        titleCore.some((tKw) => tKw.length >= 4 && (tKw.includes(fKw) || fKw.includes(tKw)));
      if (exact) matched += 1;
      else if (partial) matched += 0.85;
    }

    if (matched <= 0) return 0;
    const fileCov = matched / fileCore.length;
    const titleCov = matched / titleCore.length;
    if (fileCov >= 0.99 || titleCov >= 0.99) {
      score = 620 + Math.round((fileCov + titleCov) * 80);
    } else if (matched >= 1 && (fileCov >= 0.5 || titleCov >= 0.5)) {
      score = Math.round(250 + fileCov * 200 + titleCov * 120);
    }
  }

  if (score > 0 && mediaItem.folder && categoryName) {
    const folderLower = mediaItem.folder.toLowerCase();
    const catLower = categoryName.toLowerCase();
    const bucket = FOLDER_TO_CATEGORY_KEYS.find((b) =>
      b.folderKeys.some((k) => folderLower.includes(k))
    );
    if (bucket) {
      if (bucket.categoryKeys.some((k) => catLower.includes(k))) {
        score += 45;
      } else if (normFile !== normCourse) {
        score -= 80;
      }
    }
  }

  return score;
}

async function loadDatabaseUrl(rootDir) {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.trim();
  for (const envName of ['.env.local', '.env']) {
    try {
      const raw = await fs.readFile(path.join(rootDir, envName), 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^DATABASE_URL\s*=\s*(.+)$/);
        if (match) {
          return match[1].replace(/^['"]|['"]$/g, '').trim();
        }
      }
    } catch {
      // Lanjut cek file env berikutnya
    }
  }
  return '';
}

async function scanDirectory(rootDir, allowedExts, urlPrefix, skipFolders = new Set()) {
  const results = [];

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
        if (relSegments.length === 0 && skipFolders.has(entry.name.toLowerCase())) {
          continue;
        }
        await walk(fullPath, nextSegments);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!allowedExts.has(ext)) continue;

        results.push({
          fileName: entry.name,
          title: humanizeFileName(entry.name),
          folder: relSegments.join('/'),
          url: `${urlPrefix}/${nextSegments.join('/')}`,
        });
      }
    }
  }

  await walk(rootDir, []);
  results.sort((a, b) => a.url.localeCompare(b.url));
  return results;
}

async function publicFileExists(publicDir, urlPath) {
  if (!urlPath || typeof urlPath !== 'string' || !urlPath.startsWith('/')) return false;
  try {
    const cleanRel = decodeURIComponent(urlPath.replace(/^\/+/, ''));
    const stat = await fs.stat(path.join(publicDir, cleanRel));
    return stat.isFile();
  } catch {
    return false;
  }
}

function isPlaceholderOrEmptyUrl(url) {
  const s = String(url || '').trim();
  if (!s) return true;
  const lower = s.toLowerCase();
  return (
    lower === 'null' ||
    lower === 'undefined' ||
    lower.startsWith('https://example.invalid/') ||
    lower.startsWith('https://youtube.com/watch?v=sample')
  );
}

function matchCategoryByFolder(folderName, categories) {
  const folderLower = String(folderName || '').toLowerCase();
  if (!folderLower) return null;

  const bucket = FOLDER_TO_CATEGORY_KEYS.find((b) =>
    b.folderKeys.some((k) => folderLower.includes(k))
  );
  if (bucket) {
    const hit = categories.find((cat) =>
      bucket.categoryKeys.some((k) => String(cat.name || '').toLowerCase().includes(k))
    );
    if (hit) return hit;
  }

  const folderTokens = normalizeText(folderName).split(' ').filter(Boolean);
  return (
    categories.find((cat) => {
      const catNorm = normalizeText(cat.name);
      return folderTokens.some((tok) => tok.length >= 3 && catNorm.includes(tok));
    }) || null
  );
}

async function runSync() {
  const quiet = process.argv.includes('--quiet');
  const forceCreate = process.argv.includes('--force');
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');

  const databaseUrl = await loadDatabaseUrl(rootDir);
  if (!databaseUrl) {
    if (!quiet) console.warn('[db:sync] DATABASE_URL tidak ditemukan, sinkronisasi dilewati.');
    return;
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await pool.query('SELECT 1');
  } catch (err) {
    if (quiet) {
      console.warn('[db:sync] PostgreSQL belum aktif, sinkronisasi dilewati:', err?.message || err);
      await pool.end().catch(() => {});
      return;
    }
    throw err;
  }

  try {
    const [catPictures, coursePictures, courseVideos] = await Promise.all([
      scanDirectory(path.join(publicDir, 'pictures', 'categories'), IMAGE_EXTENSIONS, '/pictures/categories'),
      scanDirectory(path.join(publicDir, 'pictures', 'courses'), IMAGE_EXTENSIONS, '/pictures/courses'),
      scanDirectory(path.join(publicDir, 'videos'), VIDEO_EXTENSIONS, '/videos', new Set(['upload'])),
    ]);

    const contentColsRes = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'course_contents';"
    );
    const contentCols = new Set(contentColsRes.rows.map((r) => r.column_name));

    const trackedRes = await pool
      .query("SELECT key_value FROM system_settings WHERE key_name = 'synced_manual_media_files' LIMIT 1;")
      .catch(() => ({ rows: [] }));

    let previouslySynced = new Set();
    if (trackedRes.rows[0]?.key_value) {
      try {
        const parsed = JSON.parse(trackedRes.rows[0].key_value);
        if (Array.isArray(parsed)) {
          previouslySynced = new Set(parsed.map((x) => String(x)));
        }
      } catch {
        previouslySynced = new Set();
      }
    }

    // 1. Sinkronisasi gambar kategori
    const categoriesRes = await pool.query('SELECT id, name, image_url FROM categories ORDER BY id ASC;');
    const categories = categoriesRes.rows;
    let updatedCategories = 0;

    for (const cat of categories) {
      const catNorm = normalizeText(cat.name);
      const currentExists = await publicFileExists(publicDir, cat.image_url);
      if (!isPlaceholderOrEmptyUrl(cat.image_url) && currentExists) continue;

      let bestPic = null;
      let bestScore = 0;
      for (const pic of catPictures) {
        const picNorm = normalizeText(pic.fileName);
        let sc = 0;
        if (picNorm === catNorm) sc = 100;
        else {
          for (const tok of picNorm.split(' ').filter((t) => t.length >= 3)) {
            if (catNorm.includes(tok)) sc += 20;
          }
          for (const tok of catNorm.split(' ').filter((t) => t.length >= 3)) {
            if (picNorm.includes(tok)) sc += 15;
          }
        }
        if (sc > bestScore) {
          bestScore = sc;
          bestPic = pic;
        }
      }

      if (bestPic && bestScore > 0) {
        await pool.query('UPDATE categories SET image_url = $1 WHERE id = $2;', [bestPic.url, cat.id]);
        cat.image_url = bestPic.url;
        updatedCategories += 1;
      }
    }

    // 2. Sinkronisasi thumbnail_url, video_url, dan course_contents untuk kursus yang sudah ada
    const coursesRes = await pool.query(`
      SELECT c.id, c.title, c.description, c.category_id, c.instructor_id, c.thumbnail_url, c.video_url,
             COALESCE(cat.name, '') AS category_name
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      ORDER BY c.id ASC;
    `);
    const courses = coursesRes.rows;

    const usedPictureUrls = new Set();
    const usedVideoUrls = new Set();
    let updatedCourses = 0;
    let insertedContents = 0;

    for (const course of courses) {
      let nextThumb = course.thumbnail_url;
      let nextVideo = course.video_url;

      const thumbExists = await publicFileExists(publicDir, nextThumb);
      if (isPlaceholderOrEmptyUrl(nextThumb) || (String(nextThumb || '').startsWith('/pictures/') && !thumbExists)) {
        let bestPic = null;
        let bestScore = 0;
        for (const pic of coursePictures) {
          const sc = scoreMediaMatch(course.title, course.category_name, pic);
          if (sc > bestScore) {
            bestScore = sc;
            bestPic = pic;
          }
        }
        if (bestPic && bestScore >= 250) {
          nextThumb = bestPic.url;
        }
      }
      if (String(nextThumb || '').startsWith('/pictures/')) {
        usedPictureUrls.add(nextThumb);
      }

      const videoExists = await publicFileExists(publicDir, nextVideo);
      if (isPlaceholderOrEmptyUrl(nextVideo) || (String(nextVideo || '').startsWith('/videos/') && !videoExists)) {
        let bestVid = null;
        let bestScore = 0;
        for (const vid of courseVideos) {
          const sc = scoreMediaMatch(course.title, course.category_name, vid);
          if (sc > bestScore) {
            bestScore = sc;
            bestVid = vid;
          }
        }
        if (bestVid && bestScore >= 250) {
          nextVideo = bestVid.url;
        }
      }
      if (String(nextVideo || '').startsWith('/videos/')) {
        usedVideoUrls.add(nextVideo);
      }

      if (nextThumb !== course.thumbnail_url || nextVideo !== course.video_url) {
        await pool.query(
          'UPDATE courses SET thumbnail_url = $1, video_url = $2 WHERE id = $3;',
          [nextThumb || null, nextVideo || null, course.id]
        );
        updatedCourses += 1;
      }

      // Perbarui/lengkapi course_contents agar video lokal terbaca di silabus
      const existingContentsRes = await pool.query(
        'SELECT id, title, video_url FROM course_contents WHERE course_id = $1 ORDER BY order_index ASC NULLS LAST, id ASC;',
        [course.id]
      );

      for (const row of existingContentsRes.rows) {
        if (String(row.video_url || '').startsWith('https://example.invalid/') && nextVideo) {
          if (contentCols.has('media_url')) {
            await pool.query(
              'UPDATE course_contents SET video_url = $1, media_url = $1, cover_image_url = COALESCE(NULLIF(cover_image_url, \'\'), $2), updated_at = CURRENT_TIMESTAMP WHERE id = $3;',
              [nextVideo, nextThumb || null, row.id]
            );
          } else {
            await pool.query(
              'UPDATE course_contents SET video_url = $1, cover_image_url = COALESCE(NULLIF(cover_image_url, \'\'), $2), updated_at = CURRENT_TIMESTAMP WHERE id = $3;',
              [nextVideo, nextThumb || null, row.id]
            );
          }
        }
      }

      const existingVideoSet = new Set(
        existingContentsRes.rows.map((r) => String(r.video_url || '').trim().toLowerCase())
      );

      const allMatched = courseVideos
        .map((vid) => ({ vid, sc: scoreMediaMatch(course.title, course.category_name, vid) }))
        .filter((item) => item.sc >= 250)
        .sort((a, b) => b.sc - a.sc || a.vid.title.localeCompare(b.vid.title));

      const highConfidence = allMatched.filter((item) => item.sc >= 600);
      const matchedCourseVideos =
        highConfidence.length > 0 ? highConfidence : allMatched.slice(0, 1);

      let nextOrder = existingContentsRes.rows.length;
      for (const { vid } of matchedCourseVideos) {
        usedVideoUrls.add(vid.url);
        if (existingVideoSet.has(vid.url.toLowerCase())) continue;
        nextOrder += 1;

        const descText = course.description
          ? `${course.description}`
          : `Video pembelajaran ${vid.title} untuk kursus ${course.title}.`;

        if (contentCols.has('media_url') && contentCols.has('summary')) {
          await pool.query(
            `INSERT INTO course_contents
              (course_id, title, description, summary, content_type, duration_minutes, order_index, status, cover_image_url, video_url, media_url, updated_at)
             VALUES ($1, $2, $3, $3, 'Video & Bacaan', 20, $4, 'published', $5, $6, $6, CURRENT_TIMESTAMP);`,
            [course.id, vid.title, descText, nextOrder, nextThumb || null, vid.url]
          );
        } else {
          await pool.query(
            `INSERT INTO course_contents
              (course_id, title, description, content_type, duration_minutes, order_index, status, cover_image_url, video_url, updated_at)
             VALUES ($1, $2, $3, 'Video & Bacaan', 20, $4, 'published', $5, $6, CURRENT_TIMESTAMP);`,
            [course.id, vid.title, descText, nextOrder, nextThumb || null, vid.url]
          );
        }
        existingVideoSet.add(vid.url.toLowerCase());
        insertedContents += 1;
      }
    }

    // 3. Jika pengguna menginput file video/gambar BARU secara manual yang belum punya kursus,
    //    buatkan kursus + materinya otomatis agar langsung tampil di website!
    const teachersRes = await pool.query(
      "SELECT id, full_name, specialty FROM users WHERE LOWER(COALESCE(role, '')) = 'teacher' AND LOWER(COALESCE(status, 'active')) = 'active' ORDER BY id ASC;"
    );
    const teachers = teachersRes.rows;
    const defaultCategory = categories[0] || null;
    const defaultTeacher = teachers[0] || null;
    let createdCourses = 0;

    for (const vid of courseVideos) {
      if (usedVideoUrls.has(vid.url)) continue;
      if (!forceCreate && previouslySynced.has(vid.url)) continue;

      const matchedCat = matchCategoryByFolder(vid.folder, categories) || defaultCategory;
      const matchedTeacher =
        teachers.find(
          (t) =>
            matchedCat &&
            String(t.specialty || '').toLowerCase().trim() === String(matchedCat.name || '').toLowerCase().trim()
        ) || defaultTeacher;

      let matchedPic = null;
      let bestPicScore = 0;
      for (const pic of coursePictures) {
        const sc = scoreMediaMatch(vid.title, matchedCat?.name || '', pic);
        if (sc > bestPicScore) {
          bestPicScore = sc;
          matchedPic = pic;
        }
      }
      const thumbUrl = bestPicScore >= 250 && matchedPic ? matchedPic.url : matchedCat?.image_url || null;
      if (thumbUrl) usedPictureUrls.add(thumbUrl);

      const insertedCourse = await pool.query(
        `INSERT INTO courses (title, description, category_id, instructor_id, status, video_url, thumbnail_url)
         VALUES ($1, $2, $3, $4, 'active', $5, $6)
         RETURNING id;`,
        [
          vid.title,
          `Materi praktik ${vid.title} dari folder ${vid.folder || 'atelier'}.`,
          matchedCat?.id || null,
          matchedTeacher?.id || null,
          vid.url,
          thumbUrl,
        ]
      );
      const newCourseId = insertedCourse.rows[0].id;

      if (contentCols.has('media_url') && contentCols.has('summary')) {
        await pool.query(
          `INSERT INTO course_contents
            (course_id, title, description, summary, content_type, duration_minutes, order_index, status, cover_image_url, video_url, media_url, updated_at)
           VALUES ($1, $2, $3, $3, 'Video & Bacaan', 20, 1, 'published', $4, $5, $5, CURRENT_TIMESTAMP);`,
          [newCourseId, vid.title, `Video pembelajaran ${vid.title}.`, thumbUrl, vid.url]
        );
      } else {
        await pool.query(
          `INSERT INTO course_contents
            (course_id, title, description, content_type, duration_minutes, order_index, status, cover_image_url, video_url, updated_at)
           VALUES ($1, $2, $3, 'Video & Bacaan', 20, 1, 'published', $4, $5, CURRENT_TIMESTAMP);`,
          [newCourseId, vid.title, `Video pembelajaran ${vid.title}.`, thumbUrl, vid.url]
        );
      }

      usedVideoUrls.add(vid.url);
      createdCourses += 1;
      insertedContents += 1;
    }

    // Jika ada gambar kursus baru yang belum terpakai dan belum punya video pasangannya
    for (const pic of coursePictures) {
      if (usedPictureUrls.has(pic.url)) continue;
      if (!forceCreate && previouslySynced.has(pic.url)) continue;

      const matchedCat = matchCategoryByFolder(pic.folder, categories) || defaultCategory;
      const matchedTeacher =
        teachers.find(
          (t) =>
            matchedCat &&
            String(t.specialty || '').toLowerCase().trim() === String(matchedCat.name || '').toLowerCase().trim()
        ) || defaultTeacher;

      await pool.query(
        `INSERT INTO courses (title, description, category_id, instructor_id, status, thumbnail_url)
         VALUES ($1, $2, $3, $4, 'active', $5);`,
        [
          pic.title,
          `Materi praktik ${pic.title} dari folder ${pic.folder || 'atelier'}.`,
          matchedCat?.id || null,
          matchedTeacher?.id || null,
          pic.url,
        ]
      );

      usedPictureUrls.add(pic.url);
      createdCourses += 1;
    }

    const allTracked = Array.from(
      new Set([
        ...previouslySynced,
        ...catPictures.map((p) => p.url),
        ...coursePictures.map((p) => p.url),
        ...courseVideos.map((v) => v.url),
      ])
    ).sort();

    await pool.query(
      `INSERT INTO system_settings (key_name, key_value, updated_at)
       VALUES ('synced_manual_media_files', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key_name) DO UPDATE SET
         key_value = EXCLUDED.key_value,
         updated_at = CURRENT_TIMESTAMP;`,
      [JSON.stringify(allTracked)]
    );

    if (!quiet || updatedCategories || updatedCourses || insertedContents || createdCourses) {
      console.log(
        `[db:sync] Selesai: ${updatedCategories} kategori diperbarui, ${updatedCourses} kursus diperbarui, ${createdCourses} kursus baru dibuat, ${insertedContents} modul video ditambahkan.`
      );
    }
  } finally {
    await pool.end().catch(() => {});
  }
}

runSync().catch((err) => {
  console.error('[db:sync] Gagal menyinkronkan media:', err);
  process.exit(1);
});
