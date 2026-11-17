import Link from 'next/link';
import pool from '@/lib/db';

export default async function AdminUsersPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const filterTab = resolvedSearchParams?.tab || 'semua';
  const searchQuery = (resolvedSearchParams?.q || '').toLowerCase();

  let users = [];
  let pendingTeachers = [];
  let totalUsers = 0;
  let pendingCount = 0;
  let teacherCount = 0;
  let studentCount = 0;
  let adminCount = 0;

  try {
    const usersRes = await pool.query(`
      SELECT id, full_name, email, role, status, created_at, specialty 
      FROM users 
      ORDER BY id DESC;
    `);

    const allUsers = usersRes.rows;

    totalUsers = allUsers.length;
    pendingTeachers = allUsers.filter(u => u.role === 'teacher' && u.status === 'pending');
    pendingCount = pendingTeachers.length;
    teacherCount = allUsers.filter(u => u.role === 'teacher').length;
    studentCount = allUsers.filter(u => u.role === 'student' || !u.role).length;
    adminCount = allUsers.filter(u => u.role === 'admin').length;

    users = allUsers.filter(u => {
      const role = (u.role || 'student').toLowerCase();
      if (filterTab === 'pending' && (role !== 'teacher' || u.status !== 'pending')) return false;
      if (filterTab === 'teacher' && role !== 'teacher') return false;
      if (filterTab === 'student' && role !== 'student' && role !== '') return false;
      if (filterTab === 'admin' && role !== 'admin') return false;

      if (searchQuery) {
        const matchName = u.full_name?.toLowerCase().includes(searchQuery);
        const matchEmail = u.email?.toLowerCase().includes(searchQuery);
        const matchSpec = u.specialty?.toLowerCase().includes(searchQuery);
        if (!matchName && !matchEmail && !matchSpec) return false;
      }

      return true;
    });
  } catch (err) {
    console.error('Database Error fetching users:', err);
  }

  return (
    <div className="space-y-7">
      
      {/* 1. HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
            <span>🥐</span> DIREKTORI CIVITAS ATELIER
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Kelola Akses Siswa & Verifikasi Pengajar
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/75">
            Kurasi instruktur berkualifikasi maestro pastry dan monitor seluruh pengguna ekosistem Yugyo.
          </p>
        </div>

        <Link
          href="/dashboard/admin/users/create"
          className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>＋</span>
          <span>Tambah Pengguna</span>
        </Link>
      </div>

      {/* 2. STATISTIK KARTU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-2xs">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F9DDBB]/50 text-[#802924] flex items-center justify-center font-bold">
              👥
            </div>
            <div>
              <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">TOTAL PENGGUNA</p>
              <h3 className="font-editorial text-xl font-bold text-[#341D17] mt-0.5">{totalUsers}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">SISWA TERDAFTAR</p>
            <h3 className="font-editorial text-xl font-bold text-[#341D17] mt-0.5">{studentCount}</h3>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 sm:border-l border-[#341D17]/10 sm:pl-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#802924]/10 text-[#802924] flex items-center justify-center font-bold">
              📋
            </div>
            <div>
              <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#802924]">VERIFIKASI GURU</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-editorial text-xl font-bold text-[#341D17]">{pendingCount}</span>
                <span className="w-2 h-2 rounded-full bg-[#802924] animate-pulse" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">MASTER CHEF</p>
            <h3 className="font-editorial text-xl font-bold text-[#341D17] mt-0.5">{teacherCount}</h3>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & TAB FILTER PILLS */}
      <div className="space-y-3.5">
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-[#341D17]/45 text-xs">
            🔍
          </span>
          <form method="GET">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Cari nama, email, atau keahlian..."
              className="w-full bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl pl-11 pr-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
            />
            {filterTab !== 'semua' && <input type="hidden" name="tab" value={filterTab} />}
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/admin/users?tab=semua${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterTab === 'semua'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            Semua ({totalUsers})
          </Link>

          <Link
            href={`/dashboard/admin/users?tab=pending${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            <span>Pending Chef</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterTab === 'pending' ? 'bg-[#FFFDF9] text-[#802924]' : 'bg-[#F9DDBB] text-[#802924]'}`}>
              {pendingCount}
            </span>
          </Link>

          <Link
            href={`/dashboard/admin/users?tab=teacher${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterTab === 'teacher'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            Instruktur Chef ({teacherCount})
          </Link>

          <Link
            href={`/dashboard/admin/users?tab=student${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterTab === 'student'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            Siswa ({studentCount})
          </Link>

          <Link
            href={`/dashboard/admin/users?tab=admin${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterTab === 'admin'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            Admin ({adminCount})
          </Link>
        </div>
      </div>

      {/* 4. VERIFIKASI CALON PENGAJAR (PENDING TEACHERS) */}
      {pendingTeachers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17] flex items-center gap-2">
              <span>⏳</span> Verifikasi Calon Pengajar
            </h3>
            <span className="bg-[#802924] text-[#F9DDBB] px-3 py-1 rounded-full text-[10px] font-extrabold uppercase">
              Aksi Diperlukan
            </span>
          </div>

          <div className="space-y-4">
            {pendingTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#802924] text-[#F9DDBB] font-bold flex items-center justify-center text-base shrink-0">
                      👨‍🍳
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-editorial text-base font-bold text-[#341D17]">{teacher.full_name}</h4>
                        <span className="bg-[#802924] text-[#F9DDBB] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                          Pending
                        </span>
                      </div>
                      <p className="text-xs text-[#341D17]/75">
                        Spesialisasi: {teacher.specialty || 'Master Patisserie & Boulangerie'}
                      </p>
                      <p className="text-[11px] text-[#341D17]/60">{teacher.email}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#341D17]/60 font-semibold">Diajukan baru-baru ini</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#341D17]/10">
                  <form action={`/api/admin/users/${teacher.id}/verify`} method="POST">
                    <input type="hidden" name="status" value="active" />
                    <button
                      type="submit"
                      className="w-full bg-[#82882B] hover:bg-[#6c7223] text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>✓</span> Setujui Pengajar
                    </button>
                  </form>

                  <form action={`/api/admin/users/${teacher.id}/verify`} method="POST">
                    <input type="hidden" name="status" value="rejected" />
                    <button
                      type="submit"
                      className="w-full bg-[#802924]/10 hover:bg-[#802924] text-[#802924] hover:text-[#F9DDBB] font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>✕</span> Tolak
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. DAFTAR SELURUH PENGGUNA */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
              Daftar Seluruh Pengguna
            </h3>
            <p className="text-xs text-[#341D17]/60">Sinkronisasi langsung dengan sistem otentikasi</p>
          </div>
        </div>

        <div className="space-y-3">
          {users.map((u) => {
            const role = (u.role || 'student').toLowerCase();
            const isTeacher = role === 'teacher';
            const isAdmin = role === 'admin';

            return (
              <div key={u.id} className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isAdmin ? 'bg-[#341D17] text-[#F9DDBB]' : isTeacher ? 'bg-[#802924] text-[#F9DDBB]' : 'bg-[#F9DDBB] text-[#802924]'
                  }`}>
                    {isAdmin ? '🛡️' : isTeacher ? '👨‍🍳' : '🎓'}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-editorial text-sm sm:text-base font-bold text-[#341D17]">{u.full_name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                        isAdmin ? 'bg-[#341D17] text-[#F9DDBB]' : isTeacher ? 'bg-[#82882B]/15 text-[#82882B]' : 'bg-[#F9DDBB]/50 text-[#802924]'
                      }`}>
                        {role}
                      </span>
                    </div>
                    <p className="text-xs text-[#341D17]/70">{u.email}</p>
                    <p className="text-[11px] text-[#341D17]/50 font-semibold">
                      Bergabung: {new Date(u.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#341D17]/10">
                  <Link
                    href={`/dashboard/admin/users/${u.id}/edit`}
                    className="px-3 py-1.5 rounded-xl bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                  >
                    <span>✏️</span> Ubah
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}