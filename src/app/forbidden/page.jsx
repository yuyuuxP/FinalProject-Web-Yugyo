import Link from 'next/link';
import {
  FaShieldHalved,
  FaArrowLeft,
  FaHouse,
  FaRightToBracket,
} from 'react-icons/fa6';

function getDashboardHrefByRole(role) {
  const r = String(role || '')
    .trim()
    .toLowerCase();
  if (r === 'admin') return '/dashboard/admin';
  if (r === 'teacher' || r === 'instructor') return '/dashboard/teacher';
  if (r === 'student') return '/dashboard/student';
  return '/';
}

export default async function ForbiddenPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const actualRole = String(resolvedParams?.role || '').trim();
  const requiredRole = String(resolvedParams?.required || '').trim();
  const fromPath = String(resolvedParams?.from || '').trim();

  const homeDashboardHref = getDashboardHrefByRole(actualRole);

  return (
    <div className="min-h-screen w-full bg-[#F9DDBB] text-[#341D17] flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center space-y-5 text-center">
        {/* Badge Guard PNG Bulat + 403 */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36">
            <img
              src="/guard.png"
              alt="Guard 403"
              className="w-full h-full rounded-full object-cover object-center"
            />
            <span className="inline-flex items-center justify-center gap-1 absolute bottom-1 right-1 bg-[#802924] text-[#F9DDBB] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-xs">
              <FaShieldHalved className="w-2.5 h-2.5 shrink-0" />
              <span>403</span>
            </span>
          </div>
        </div>

        {/* Pill Kode 403 */}
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center justify-center gap-2 bg-[#FFFDF9]/85 text-[#802924] px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#802924]" />
            <span>KODE 403 &bull; HAK AKSES TERBATAS</span>
          </span>
        </div>

        {/* Judul & Pesan */}
        <div className="w-full flex flex-col items-center justify-center space-y-2.5 text-center">
          <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-[#341D17] leading-tight text-center">
            403 Forbidden - Akses Ditolak
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/80 leading-relaxed max-w-md mx-auto text-center">
            Anda tidak memiliki hak akses untuk membuka halaman ini. Halaman ini hanya dapat diakses oleh role yang berwenang.
          </p>
        </div>

        {/* Info Detail Role Jika Tersedia */}
        {(requiredRole || actualRole || fromPath) && (
          <div className="w-full flex flex-col items-center justify-center text-[11px] text-[#341D17]/75 space-y-0.5 text-center">
            {requiredRole && (
              <p className="text-center">
                Role yang dibutuhkan:{' '}
                <strong className="font-bold text-[#802924] uppercase">
                  {requiredRole}
                </strong>
              </p>
            )}
            {actualRole && (
              <p className="text-center">
                Role akun aktif saat ini:{' '}
                <strong className="font-bold text-[#341D17] uppercase">
                  {actualRole}
                </strong>
              </p>
            )}
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="w-full flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            href={homeDashboardHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] px-4 py-2.5 text-xs font-bold transition"
          >
            <FaHouse className="w-3.5 h-3.5 shrink-0" />
            <span>Kembali ke Halaman Utama</span>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFFDF9] hover:bg-[#FFFDF9]/80 border border-[#341D17]/20 text-[#341D17] px-4 py-2.5 text-xs font-bold transition"
          >
            <FaRightToBracket className="w-3.5 h-3.5 shrink-0" />
            <span>Ganti Akun</span>
          </Link>
        </div>

        <div className="flex items-center justify-center">
          <Link
            href="/courses"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#802924] hover:underline"
          >
            <FaArrowLeft className="w-3 h-3 shrink-0" />
            <span>Jelajahi Katalog Kursus</span>
          </Link>
        </div>
      </div>
    </div>
  );
}