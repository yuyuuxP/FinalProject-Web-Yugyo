const ACTIVE_STUDENT_STORAGE_KEY = 'yugyo_active_student_id';
const ACTIVE_STUDENT_NAME_KEY = 'yugyo_active_student_name';

const BLOCKED_LABELS = new Set([
  'yugyo',
  'yugyo atelier',
  'student',
  'st',
  'student portal',
  'student portal • user profile',
  'student baker atelier',
  'portal akun siswa',
  'profil pengguna siswa',
  'lihat katalog guest',
  'dashboard',
  'course',
  'course catalog',
  'schedule',
  'chat instructor',
  'ulasan',
  'log out',
  'logout',
  'user',
]);

function parsePositiveInt(val) {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function isBlockedStudentName(value) {
  const clean = String(value || '').trim();
  if (!clean || clean.length < 3 || clean.length > 50) return true;
  const lower = clean.toLowerCase();
  if (BLOCKED_LABELS.has(lower)) return true;
  if (
    lower.includes('admin') ||
    lower.includes('teacher') ||
    lower.includes('instructor') ||
    lower.includes('student baker')
  ) {
    return true;
  }
  return false;
}

function pickUserFromObject(obj) {
  if (!obj || typeof obj !== 'object') return null;

  const role = String(
    obj.role ||
      obj.user?.role ||
      obj.currentUser?.role ||
      obj.data?.role ||
      ''
  )
    .trim()
    .toLowerCase();

  if (role === 'admin' || role === 'teacher' || role === 'instructor') {
    return null;
  }

  const targets = [
    obj,
    obj.user,
    obj.currentUser,
    obj.student,
    obj.profile,
    obj.data,
    obj.data?.user,
    obj.session?.user,
  ];

  for (const item of targets) {
    if (!item || typeof item !== 'object') continue;
    const itemRole = String(item.role || role || '')
      .trim()
      .toLowerCase();
    if (
      itemRole === 'admin' ||
      itemRole === 'teacher' ||
      itemRole === 'instructor'
    ) {
      continue;
    }

    const candidates = [
      item.full_name,
      item.fullName,
      item.name,
      item.username,
      item.user_name,
      item.userName,
    ];

    for (const raw of candidates) {
      const clean = String(raw || '').trim();
      if (!isBlockedStudentName(clean)) {
        const rawId =
          parsePositiveInt(item.id) ||
          parsePositiveInt(item.userId) ||
          parsePositiveInt(item.user_id) ||
          parsePositiveInt(item.studentId) ||
          parsePositiveInt(item.student_id) ||
          null;

        return {
          studentId: itemRole === 'student' ? rawId : null,
          studentName: clean,
        };
      }
    }
  }

  return null;
}

function detectStudentFromStorage(storage) {
  if (!storage) return null;
  try {
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i) || '';
      if (
        key === ACTIVE_STUDENT_STORAGE_KEY ||
        key === ACTIVE_STUDENT_NAME_KEY
      ) {
        continue;
      }
      const raw = storage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const found = pickUserFromObject(parsed);
        if (found?.studentName) return found;
      } catch {
        // Abaikan jika bukan JSON
      }
    }
  } catch {
    // Abaikan jika storage tidak dapat diakses
  }
  return null;
}

function readActiveStudentNameFromDom() {
  if (typeof document === 'undefined') return '';

  const leafNodes = Array.from(document.querySelectorAll('*')).filter(
    (node) => node.children.length === 0
  );

  // 1. Cek sapaan "Halo, <Nama>!"
  for (const node of leafNodes) {
    const txt = String(node.textContent || '').trim();
    const match = txt.match(/^Halo,\s*([^!?\n,]+)/i);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (!isBlockedStudentName(candidate)) return candidate;
    }
  }

  // 2. Cek nama di header / sidebar dekat label "Student Baker Atelier"
  for (let i = 0; i < leafNodes.length; i += 1) {
    const txt = String(leafNodes[i].textContent || '').trim();
    if (txt.toLowerCase() === 'student baker atelier') {
      for (let j = i - 1; j >= Math.max(0, i - 3); j -= 1) {
        const prevTxt = String(leafNodes[j].textContent || '').trim();
        if (!isBlockedStudentName(prevTxt)) {
          return prevTxt;
        }
      }
    }
  }

  return '';
}

export function saveActiveStudentId(studentId, studentName = '') {
  if (typeof window === 'undefined') return;
  try {
    const validId = parsePositiveInt(studentId);
    if (validId) {
      window.sessionStorage.setItem(ACTIVE_STUDENT_STORAGE_KEY, String(validId));
    } else {
      window.sessionStorage.removeItem(ACTIVE_STUDENT_STORAGE_KEY);
    }

    const cleanName = String(studentName || '').trim();
    if (cleanName && !isBlockedStudentName(cleanName)) {
      window.sessionStorage.setItem(ACTIVE_STUDENT_NAME_KEY, cleanName);
    }
  } catch {
    // Abaikan jika storage tidak tersedia
  }
}

export async function getActiveStudentIdentity() {
  let fromLocal = null;
  let fromSession = null;
  let savedName = '';
  let savedId = null;

  if (typeof window !== 'undefined') {
    fromLocal = detectStudentFromStorage(window.localStorage);
    fromSession = detectStudentFromStorage(window.sessionStorage);
    try {
      savedName = String(
        window.sessionStorage.getItem(ACTIVE_STUDENT_NAME_KEY) || ''
      ).trim();
      savedId = parsePositiveInt(
        window.sessionStorage.getItem(ACTIVE_STUDENT_STORAGE_KEY)
      );
    } catch {
      // Abaikan
    }
  }

  const domName = readActiveStudentNameFromDom();

  const resolvedName =
    fromLocal?.studentName ||
    fromSession?.studentName ||
    domName ||
    (!isBlockedStudentName(savedName) ? savedName : '') ||
    '';

  const sameAsSaved =
    Boolean(resolvedName) &&
    Boolean(savedName) &&
    resolvedName.toLowerCase() === savedName.toLowerCase();

  const resolvedId =
    fromLocal?.studentId ||
    fromSession?.studentId ||
    (sameAsSaved ? savedId : null) ||
    null;

  saveActiveStudentId(resolvedId, resolvedName);

  return {
    studentId: resolvedId,
    studentName: resolvedName,
  };
}