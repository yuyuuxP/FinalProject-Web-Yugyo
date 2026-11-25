import { NextResponse } from 'next/server';

const FORBIDDEN_PATH = '/forbidden';

function normalizeRole(rawRole) {
  const r = String(rawRole || '')
    .trim()
    .toLowerCase();
  if (!r) return '';
  if (r === 'admin' || r === 'administrator') return 'admin';
  if (
    r === 'teacher' ||
    r === 'instructor' ||
    r === 'pengajar' ||
    r === 'chef'
  ) {
    return 'teacher';
  }
  if (r === 'student' || r === 'siswa') return 'student';
  return r;
}

function parseUserCookie(rawValue) {
  if (!rawValue) return null;
  try {
    const decoded = decodeURIComponent(rawValue);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === 'object') {
      const userObj =
        parsed.user && typeof parsed.user === 'object' ? parsed.user : parsed;
      const role = normalizeRole(userObj.role || parsed.role);
      const id = Number(userObj.id ?? userObj.userId ?? parsed.id ?? 0);
      return {
        id: Number.isInteger(id) && id > 0 ? id : null,
        role,
      };
    }
  } catch {
    // Abaikan jika bukan JSON
  }
  return null;
}

function getSessionFromRequest(request) {
  const roleCookie = normalizeRole(
    request.cookies.get('yugyo_user_role')?.value ||
      request.cookies.get('yugyo_role')?.value
  );
  const idCookie = Number(request.cookies.get('yugyo_user_id')?.value || 0);

  if (roleCookie) {
    return {
      id: Number.isInteger(idCookie) && idCookie > 0 ? idCookie : null,
      role: roleCookie,
    };
  }

  const cookieNames = ['yugyo_user', 'yugyo_session', 'session_user', 'user'];
  for (const name of cookieNames) {
    const val = request.cookies.get(name)?.value;
    const parsed = parseUserCookie(val);
    if (parsed && parsed.role) {
      return parsed;
    }
  }

  return null;
}

function getRequiredRoleForPath(pathname) {
  if (pathname.startsWith('/dashboard/admin')) return 'admin';
  if (pathname.startsWith('/dashboard/teacher')) return 'teacher';
  if (pathname.startsWith('/dashboard/student')) return 'student';
  return null;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === FORBIDDEN_PATH || pathname.startsWith(`${FORBIDDEN_PATH}/`)) {
    return NextResponse.next();
  }

  const requiredRole = getRequiredRoleForPath(pathname);
  if (!requiredRole) {
    return NextResponse.next();
  }

  const session = getSessionFromRequest(request);
  const actualRole = normalizeRole(session?.role);

  if (!actualRole) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (actualRole !== requiredRole) {
    const forbiddenUrl = request.nextUrl.clone();
    forbiddenUrl.pathname = FORBIDDEN_PATH;
    forbiddenUrl.searchParams.set('from', pathname);
    forbiddenUrl.searchParams.set('required', requiredRole);
    forbiddenUrl.searchParams.set('role', actualRole);
    forbiddenUrl.searchParams.set('reason', 'role_mismatch');
    return NextResponse.redirect(forbiddenUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};