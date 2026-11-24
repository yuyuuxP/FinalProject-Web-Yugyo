import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import StudentCoursesClient from '@/components/student/StudentCoursesClient';

export const dynamic = 'force-dynamic';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg', '.mov']);
const STOP_WORDS = new Set([
  'dan',
  'atau',
  'dengan',
  'untuk',
  'yang',
  'ala',
  'klasik',
  'modern',
  'spesial',
  'premium',
  'tradisional',
  'dasar',
  'masterclass',
  'teknik',
]);

function parseIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function pickFirst(obj, keys, fallback = '') {
  for (const key of keys) {
    if (
      obj &&
      obj[key] !== undefined &&
      obj[key] !== null &&
      String(obj[key]).trim() !== '' &&
      String(obj[key]).trim().toLowerCase() !== 'null'
    ) {
      return obj[key];
    }
  }
  return fallback;
}

function normalizeToken(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractUserIdFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  return parseIntOrNull(
    payload.id ??
      payload.userId ??
      payload.user_id ??
      payload.studentId ??
      payload.student_id ??
      payload.sub ??
      payload.user?.id ??
      payload.user?.userId ??
      payload.user?.user_id
  );
}

async function getLoggedInStudentId() {
  try {
    const cookieStore = await cookies();
    for (const c of cookieStore.getAll()) {
      const name = String(c.name || '').toLowerCase();
      const rawVal = String(c.value || '').trim();
      if (!rawVal) continue;

      const directNum = parseIntOrNull(rawVal);
      if (
        directNum &&
        (name.includes('user') ||
          name.includes('student') ||
          name.includes('uid') ||
          name === 'id')
      ) {
        return directNum;
      }

      const candidates = [rawVal];
      try {
        const decoded = decodeURIComponent(rawVal);
        if (decoded !== rawVal) candidates.push(decoded);
      } catch {
        // Abaikan jika gagal decodeURIComponent
      }

      for (const str of candidates) {
        if (str.startsWith('{') || str.startsWith('[')) {
          try {
            const idFromObj = extractUserIdFromPayload(JSON.parse(str));
            if (idFromObj) return idFromObj;
          } catch {
            // Abaikan jika bukan JSON valid
          }
        }

        const parts = str.split('.');
        if (parts.length === 3) {
          try {
            const payloadJson = Buffer.from(
              parts[1].replace(/-/g, '+').replace(/_/g, '/'),
              'base64'
            ).toString('utf8');
            const jwtId = extractUserIdFromPayload(JSON.parse(payloadJson));
            if (jwtId) return jwtId;
          } catch {
            // Abaikan jika bukan JWT valid
          }
        }

        try {
          const b64Json = Buffer.from(
            str.replace(/-/g, '+').replace(/_/g, '/'),
            'base64'
          ).toString('utf8');
          if (b64Json.trim().startsWith('{')) {
            const b64Id = extractUserIdFromPayload(JSON.parse(b64Json));
            if (b64Id) return b64Id;
          }
        } catch {
          // Abaikan jika bukan base64 JSON
        }
      }
    }
  } catch {
    // Abaikan jika cookie gagal dibaca
  }
  return null;
}

function scanVideosFolder() {
  const videos = [];
  const baseDir = path.join(process.cwd(), 'public', 'videos');

  function walk(currentDir, relativeParts = []) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(path.join(currentDir, entry.name), [...relativeParts, entry.name]);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!VIDEO_EXTENSIONS.has(ext)) continue;
        const baseName = entry.name.slice(0, -ext.length);
        const urlParts = ['videos', ...relativeParts, entry.name].map(
          encodeURIComponent
        );

        videos.push({
          url: `/${urlParts.join('/')}`,
          title: baseName.trim(),
          fileKey: normalizeToken(baseName),
          folderKey: normalizeToken(relativeParts.join(' ')),
        });
      }
    }
  }

  try {
    walk(baseDir);
  } catch {
    return [];
  }

  return videos;
}

function matchVideosForCourse(courseTitle, videos) {
  const titleNorm = normalizeToken(courseTitle);
  if (!titleNorm || videos.length === 0) return [];

  const titleKeywords = titleNorm
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  const fileKeywords = (fileKey) =>
    fileKey
      .split(' ')
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  const matched = videos
    .map((vid) => {
      if (!vid.fileKey) return { vid, score: 0 };

      if (vid.fileKey === titleNorm) {
        return { vid, score: 100 };
      }
      if (
        vid.fileKey.length >= 5 &&
        (titleNorm.includes(vid.fileKey) || vid.fileKey.includes(titleNorm))
      ) {
        return { vid, score: 85 };
      }

      const fWords = new Set(fileKeywords(vid.fileKey));
      let exactKeywordHits = 0;
      for (const kw of titleKeywords) {
        if (fWords.has(kw)) {
          exactKeywordHits += 1;
        }
      }

      if (titleKeywords.length > 0 && exactKeywordHits === titleKeywords.length) {
        return { vid, score: 75 + exactKeywordHits * 5 };
      }
      if (exactKeywordHits >= 2) {
        return { vid, score: 50 + exactKeywordHits * 5 };
      }
      if (titleKeywords.length === 1 && exactKeywordHits === 1) {
        return { vid, score: 45 };
      }

      return { vid, score: 0 };
    })
    .filter((item) => item.score >= 45)
    .sort((a, b) => b.score - a.score);

  return matched.map((m) => m.vid);
}

async function getExistingPublicTables(pool) {
  const res = await pool
    .query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    )
    .catch(() => null);
  const set = new Set();
  if (Array.isArray(res?.rows)) {
    for (const r of res.rows) {
      if (r?.table_name) set.add(String(r.table_name).toLowerCase());
    }
  }
  return set;
}

async function fetchCoursesAndContentsFromDb() {
  const videos = scanVideosFolder();
  const studentId = await getLoggedInStudentId();

  try {
    const dbModule = await import('@/lib/db').catch(() => null);
    const pool = dbModule?.default?.query
      ? dbModule.default
      : dbModule?.pool?.query
        ? dbModule.pool
        : null;

    if (!pool) {
      return { courses: [], contents: [], enrolledCourseIds: [], studentId };
    }

    const existingTables = await getExistingPublicTables(pool);
    if (!existingTables.has('courses')) {
      return { courses: [], contents: [], enrolledCourseIds: [], studentId };
    }

    let enrolledCourseIds = [];
    if (studentId && existingTables.has('student_enrollments')) {
      const enrollRes = await pool
        .query(
          `SELECT course_id
           FROM student_enrollments
           WHERE student_id = $1 AND LOWER(COALESCE(status, 'active')) != 'dropped'`,
          [studentId]
        )
        .catch(() => null);

      if (Array.isArray(enrollRes?.rows)) {
        enrolledCourseIds = enrollRes.rows
          .map((r) => Number(r?.course_id))
          .filter((n) => Number.isInteger(n) && n > 0);
      }
    }

    const courseRes = await pool
      .query('SELECT * FROM courses ORDER BY id ASC')
      .catch(() => null);

    const courseRows = Array.isArray(courseRes?.rows) ? courseRes.rows : [];
    if (courseRows.length === 0) {
      return { courses: [], contents: [], enrolledCourseIds, studentId };
    }

    const categoryById = new Map();
    const catTable = existingTables.has('categories')
      ? 'categories'
      : existingTables.has('course_categories')
        ? 'course_categories'
        : '';

    if (catTable) {
      const catRes = await pool
        .query(`SELECT * FROM ${catTable}`)
        .catch(() => null);
      if (Array.isArray(catRes?.rows)) {
        for (const catRow of catRes.rows) {
          const catId = pickFirst(catRow, ['id', 'category_id']);
          const catName = pickFirst(catRow, [
            'name',
            'title',
            'category_name',
            'label',
          ]);
          if (catId !== '' && catName !== '') {
            categoryById.set(String(catId), String(catName).trim());
          }
        }
      }
    }

    const instructorById = new Map();
    const hasInstructorId = courseRows.some(
      (r) => pickFirst(r, ['instructor_id', 'teacher_id', 'user_id']) !== ''
    );
    if (hasInstructorId && existingTables.has('users')) {
      const userRes = await pool.query('SELECT * FROM users').catch(() => null);
      if (Array.isArray(userRes?.rows)) {
        for (const u of userRes.rows) {
          const uid = pickFirst(u, ['id', 'user_id']);
          const uname = pickFirst(u, [
            'full_name',
            'fullName',
            'name',
            'username',
          ]);
          if (uid !== '' && uname !== '') {
            instructorById.set(String(uid), String(uname).trim());
          }
        }
      }
    }

    const contents = [];

    const courses = courseRows.map((row, idx) => {
      const rawId = pickFirst(row, ['id', 'course_id'], idx + 1);
      const numericId = Number(rawId) || idx + 1;
      const id = String(numericId);
      const title = String(
        pickFirst(
          row,
          ['title', 'course_title', 'name'],
          `Kursus #${idx + 1}`
        )
      ).trim();

      const rawCatId = String(
        pickFirst(row, ['category_id', 'course_category_id'])
      );
      const category = String(
        pickFirst(
          row,
          ['category', 'category_name'],
          categoryById.get(rawCatId) || 'Bread & Yeast Goods'
        )
      ).trim();

      const rawInstId = String(
        pickFirst(row, ['instructor_id', 'teacher_id', 'user_id'])
      );
      const instructor = String(
        pickFirst(
          row,
          ['instructor', 'instructor_name', 'teacher_name'],
          instructorById.get(rawInstId) || 'Chef Yugyo'
        )
      ).trim();

      const matchedVideos = matchVideosForCourse(title, videos);
      matchedVideos.forEach((vid, vIdx) => {
        contents.push({
          id: `vid-${id}-${vIdx + 1}`,
          courseId: id,
          courseTitle: title,
          title: vid.title || title,
          description: '',
          textContent: '',
          type: 'VIDEO',
          mediaUrl: vid.url,
        });
      });

      return {
        id,
        numericId,
        title,
        category,
        instructor,
        progress: Number(pickFirst(row, ['progress'], 40)),
        completedLessons: Number(
          pickFirst(row, ['completed_lessons', 'completedLessons'], 4)
        ),
        totalLessons: Number(
          pickFirst(row, ['total_lessons', 'totalLessons'], 10)
        ),
        remainingDays: Number(
          pickFirst(row, ['remaining_days', 'remainingDays'], 180)
        ),
        badge: String(pickFirst(row, ['badge', 'tag', 'level'], 'Atelier')).trim(),
        videoUrl: matchedVideos[0]?.url || '',
        videoTitle: matchedVideos[0]?.title || title,
      };
    });

    const contentTableCandidates = [
      'course_contents',
      'course_content',
      'contents',
      'content',
      'course_modules',
      'modules',
      'lessons',
      'course_lessons',
      'materials',
      'course_materials',
    ];

    for (const tableName of contentTableCandidates) {
      if (!existingTables.has(tableName)) continue;
      const contentRes = await pool
        .query(`SELECT * FROM ${tableName} ORDER BY id ASC`)
        .catch(() => null);
      if (Array.isArray(contentRes?.rows) && contentRes.rows.length > 0) {
        contentRes.rows.forEach((cRow, cIdx) => {
          const cId = String(
            pickFirst(
              cRow,
              ['id', 'content_id', 'module_id', 'lesson_id'],
              `${tableName}-${cIdx + 1}`
            )
          );
          const courseId = String(
            pickFirst(
              cRow,
              ['course_id', 'courseId', 'parent_course_id', 'course_slug'],
              ''
            )
          ).trim();
          const courseTitle = String(
            pickFirst(cRow, ['course_title', 'course_name'], '')
          ).trim();
          const title = String(
            pickFirst(
              cRow,
              [
                'title',
                'content_title',
                'module_title',
                'lesson_title',
                'name',
                'topic',
              ],
              `Materi #${cIdx + 1}`
            )
          ).trim();
          const textContent = String(
            pickFirst(
              cRow,
              [
                'content_text',
                'body',
                'text',
                'material_text',
                'recipe',
                'steps',
                'description',
                'summary',
                'notes',
              ],
              ''
            )
          ).trim();
          const mediaUrl = String(
            pickFirst(
              cRow,
              ['video_url', 'file_url', 'media_url', 'attachment_url', 'url'],
              ''
            )
          ).trim();
          const rawType = String(
            pickFirst(cRow, ['type', 'content_type', 'media_type', 'format'], '')
          )
            .trim()
            .toUpperCase();

          const type = mediaUrl ? 'VIDEO' : rawType || 'TEKS';

          contents.push({
            id: cId,
            courseId,
            courseTitle,
            title,
            description: textContent,
            textContent,
            type,
            mediaUrl,
          });
        });
        break;
      }
    }

    return { courses, contents, enrolledCourseIds, studentId };
  } catch {
    return { courses: [], contents: [], enrolledCourseIds: [], studentId: null };
  }
}

export default async function StudentCoursesPage() {
  const { courses, contents, enrolledCourseIds, studentId } =
    await fetchCoursesAndContentsFromDb();
  return (
    <StudentCoursesClient
      initialCourses={courses}
      initialContents={contents}
      initialEnrolledCourseIds={enrolledCourseIds}
      currentStudentId={studentId}
    />
  );
}