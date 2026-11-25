'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminDeleteConfirmModal from '@/components/admin/AdminDeleteConfirmModal';
import {
  FaUsers,
  FaGraduationCap,
  FaUtensils,
  FaPlus,
  FaCheck,
  FaXmark,
  FaPenToSquare,
  FaTrashCan,
} from 'react-icons/fa6';

const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function formatJoinDate(rawDate) {
  if (!rawDate) return '19 Nov 2026';
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return '19 Nov 2026';
  const wita = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const day = String(wita.getUTCDate()).padStart(2, '0');
  const month = MONTHS_ID[wita.getUTCMonth()] || 'Nov';
  const year = wita.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function getUserDisplayName(user) {
  return user?.username || user?.full_name || user?.name || user?.email || '';
}

function isAdminUser(user) {
  return String(user?.role || '').trim().toLowerCase() === 'admin';
}

function hasTeacherProfile(user) {
  return [
    user?.specialty,
    user?.portfolio_url,
    user?.portfolio_file_path,
    user?.portfolio_file_name,
  ].some((value) => String(value || '').trim() !== '');
}

function isTeacherUser(user) {
  const r = String(user?.role || '').trim().toLowerCase();
  return (
    r === 'teacher' ||
    r === 'instructor' ||
    r === 'guru' ||
    hasTeacherProfile(user)
  );
}

function isStudentUser(user) {
  const r = String(user?.role || '').trim().toLowerCase();
  return (r === 'student' || r === 'siswa') && !hasTeacherProfile(user);
}

function isPendingStatus(user) {
  return String(user?.status || 'active').trim().toLowerCase() === 'pending';
}

function isActiveStatus(user) {
  return String(user?.status || 'active').trim().toLowerCase() === 'active';
}

function matchesUserSearch(user, query) {
  const search = query.trim().toLowerCase();
  if (!search) return true;

  return [
    getUserDisplayName(user),
    user.email || '',
    user.specialty || '',
    user.role || '',
  ]
    .join(' ')
    .toLowerCase()
    .includes(search);
}

function getSafePortfolioUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function extractArrayCandidate(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') {
    for (const key of ['users', 'data', 'items', 'members', 'rows']) {
      if (Array.isArray(val[key])) return val[key];
    }
  }
  return [];
}

function normalizeUserList(rawList) {
  const arr = extractArrayCandidate(rawList);
  return arr.filter((u) => u && typeof u === 'object' && !isAdminUser(u));
}

export default function UsersManagementClient(props = {}) {
  const router = useRouter();

  const propSeedUsers = useMemo(() => {
    const candidates = [
      props.initialUsers,
      props.users,
      props.userList,
      props.members,
      props.items,
      props.data,
    ];
    for (const cand of candidates) {
      const cleaned = normalizeUserList(cand);
      if (cleaned.length > 0) return cleaned;
    }
    return [];
  }, [props]);

  const [fetchedUsers, setFetchedUsers] = useState([]);
  const [userOverrides, setUserOverrides] = useState({});
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('teacher');
  const [editingUser, setEditingUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('teacher');
  const [statusInput, setStatusInput] = useState('active');
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (propSeedUsers.length > 0) return;

    let cancelled = false;
    fetch('/api/admin/users', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const cleaned = normalizeUserList(data);
        if (cleaned.length > 0) {
          setFetchedUsers(cleaned);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [propSeedUsers]);

  const nonAdminUsers = useMemo(() => {
    const baseList = propSeedUsers.length > 0 ? propSeedUsers : fetchedUsers;
    return baseList
      .filter((u) => u && !isAdminUser(u) && !deletedIds.has(String(u.id)))
      .map((u) => {
        const override = userOverrides[String(u.id)];
        return override ? { ...u, ...override } : u;
      })
      .filter((u) => !isAdminUser(u));
  }, [propSeedUsers, fetchedUsers, userOverrides, deletedIds]);

  const activeUsers = useMemo(
    () => nonAdminUsers.filter((user) => isActiveStatus(user)),
    [nonAdminUsers]
  );

  const pendingTeachers = useMemo(
    () =>
      nonAdminUsers.filter(
        (user) =>
          isPendingStatus(user) &&
          isTeacherUser(user) &&
          matchesUserSearch(user, searchQuery)
      ),
    [nonAdminUsers, searchQuery]
  );

  const pendingStudents = useMemo(
    () =>
      nonAdminUsers.filter(
        (user) =>
          isPendingStatus(user) &&
          isStudentUser(user) &&
          matchesUserSearch(user, searchQuery)
      ),
    [nonAdminUsers, searchQuery]
  );

  const allTeachers = useMemo(
    () => activeUsers.filter((user) => isTeacherUser(user)),
    [activeUsers]
  );

  const studentsList = useMemo(
    () => activeUsers.filter((user) => isStudentUser(user)),
    [activeUsers]
  );

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return activeUsers.filter((user) => {
      if (activeFilter === 'teacher' && !isTeacherUser(user)) {
        return false;
      } else if (activeFilter === 'student' && !isStudentUser(user)) {
        return false;
      } else if (activeFilter !== 'teacher' && activeFilter !== 'student') {
        return false;
      }

      return matchesUserSearch(user, q);
    });
  }, [activeUsers, searchQuery, activeFilter]);

  const openEditModal = (user) => {
    if (!user || isAdminUser(user)) return;
    setEditingUser(user);
    setUsernameInput(getUserDisplayName(user));
    setEmailInput(user.email || '');
    setPasswordInput('');
    setRoleInput(isStudentUser(user) ? 'student' : 'teacher');
    setStatusInput(isPendingStatus(user) ? 'pending' : 'active');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser || isAdminUser(editingUser) || saving) return;

    const nextUsername = usernameInput.trim();
    const nextEmail = emailInput.trim();
    const nextPassword = passwordInput.trim();
    const nextRole = roleInput === 'student' ? 'student' : 'teacher';
    const nextStatus = statusInput === 'pending' ? 'pending' : 'active';

    const payload = {
      username: nextUsername,
      full_name: nextUsername,
      email: nextEmail,
      role: nextRole,
      status: nextStatus,
    };
    if (nextPassword.length > 0) {
      payload.password = nextPassword;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setUserOverrides((prev) => ({
          ...prev,
          [String(editingUser.id)]: {
            ...(prev[String(editingUser.id)] || {}),
            ...(nextUsername ? { username: nextUsername, full_name: nextUsername } : {}),
            ...(nextEmail ? { email: nextEmail } : {}),
            role: nextRole,
            status: nextStatus,
          },
        }));
        setEditingUser(null);
        setPasswordInput('');
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user || isAdminUser(user)) return;
    setActionError('');
    setDeleteConfirm(user);
  };

  const handleApprovePendingUser = async (user) => {
    if (!user || !isPendingStatus(user) || isAdminUser(user)) return;

    setActionError('');
    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setActionError(data.message || 'Gagal menyetujui akun.');
        return;
      }

      setUserOverrides((prev) => ({
        ...prev,
        [String(user.id)]: {
          ...(prev[String(user.id)] || {}),
          status: 'active',
        },
      }));
      router.refresh();
    } catch (error) {
      console.error('Error approving pending user:', error);
      setActionError('Tidak dapat menghubungi server untuk menyetujui akun.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const executeDeleteUser = async (user) => {
    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setActionError(data.message || 'Gagal menghapus akun.');
        return;
      }

      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(String(user.id));
        return next;
      });
      router.refresh();
    } catch (error) {
      console.error('Error deleting user:', error);
      setActionError('Tidak dapat menghubungi server untuk menghapus akun.');
    } finally {
      setActionLoadingId(null);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-5 text-[#341D17]">
      {/* HEADER KONTEN */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
            <FaUsers className="w-3 h-3 shrink-0" />
            <span>DIREKTORI CIVITAS ATELIER</span>
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Kelola Akun Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/65">
            Setujui akun baru dan kelola daftar pengguna aktif.
          </p>
        </div>

        <Link
          href="/dashboard/admin/users/create"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#FFFDF9] transition"
        >
          <FaPlus className="w-3.5 h-3.5 shrink-0" />
          <span>Tambah Pengguna</span>
        </Link>
      </div>

      {/* PANEL STATISTIK RINGKAS (SEMUA PUTIH DENGAN PEMISAH) */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#341D17]/12 overflow-hidden">
        <div className="bg-[#FFFDF9] p-4 sm:p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55">
              TOTAL PENGGUNA AKTIF
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-[#341D17] mt-1">
              {activeUsers.length}
            </p>
          </div>
          <span className="w-8 h-8 rounded-lg bg-[#FFFDF9] border border-[#341D17]/10 text-[#802924] flex items-center justify-center shrink-0">
            <FaUsers className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-[#FFFDF9] p-4 sm:p-5 flex items-center justify-between gap-3 border-t sm:border-t-0 border-[#341D17]/12">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55">
              SISWA TERDAFTAR
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-[#341D17] mt-1">
              {studentsList.length}
            </p>
          </div>
          <span className="w-8 h-8 rounded-lg bg-[#FFFDF9] border border-[#341D17]/10 text-[#341D17] flex items-center justify-center shrink-0">
            <FaGraduationCap className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-[#FFFDF9] p-4 sm:p-5 flex items-center justify-between gap-3 border-t lg:border-t-0 border-[#341D17]/12">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55">
              MASTER CHEF
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-[#341D17] mt-1">
              {allTeachers.length}
            </p>
          </div>
          <span className="w-8 h-8 rounded-lg bg-[#FFFDF9] border border-[#341D17]/10 text-[#341D17] flex items-center justify-center shrink-0">
            <FaUtensils className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari username atau email..."
          className="w-full rounded-xl border border-[#341D17]/12 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/40 focus:border-[#802924] focus:outline-none"
        />
      </div>

      {/* CHIP FILTER */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveFilter('teacher')}
          className={`rounded-full px-3.5 py-1 font-bold transition cursor-pointer ${
            activeFilter === 'teacher'
              ? 'bg-[#802924] text-[#FFFDF9]'
              : 'bg-[#FFFDF9] border border-[#341D17]/12 text-[#341D17]/75 hover:bg-[#FAF6F0]'
          }`}
        >
          Instruktur ({allTeachers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('student')}
          className={`rounded-full px-3.5 py-1 font-bold transition cursor-pointer ${
            activeFilter === 'student'
              ? 'bg-[#802924] text-[#FFFDF9]'
              : 'bg-[#FFFDF9] border border-[#341D17]/12 text-[#341D17]/75 hover:bg-[#FAF6F0]'
          }`}
        >
          Siswa ({studentsList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('pending_teacher')}
          className={`rounded-full px-3.5 py-1 font-bold transition cursor-pointer ${
            activeFilter === 'pending_teacher'
              ? 'bg-[#802924] text-[#FFFDF9]'
              : 'bg-[#FFFDF9] border border-[#341D17]/12 text-[#341D17]/75 hover:bg-[#FAF6F0]'
          }`}
        >
          Pending Chef ({pendingTeachers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('pending_student')}
          className={`rounded-full px-3.5 py-1 font-bold transition cursor-pointer ${
            activeFilter === 'pending_student'
              ? 'bg-[#802924] text-[#FFFDF9]'
              : 'bg-[#FFFDF9] border border-[#341D17]/12 text-[#341D17]/75 hover:bg-[#FAF6F0]'
          }`}
        >
          Pending Siswa ({pendingStudents.length})
        </button>
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {actionError}
        </p>
      )}

      {/* ANTREAN AKUN PENDING */}
      <div className="space-y-5">
        <section
          className={`space-y-3 ${
            activeFilter === 'pending_teacher' ? '' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">
              Pending Chef
            </h2>
            <span className="rounded-full bg-[#F9DDBB] px-2.5 py-1 text-xs font-extrabold text-[#802924]">
              {pendingTeachers.length}
            </span>
          </div>
          {pendingTeachers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#341D17]/20 bg-[#FFFDF9]/70 p-4 text-sm text-[#341D17]/55">
              Tidak ada akun teacher yang menunggu persetujuan.
            </p>
          ) : (
            pendingTeachers.map((user) => {
              const displayName = getUserDisplayName(user);
              const portfolioUrl = getSafePortfolioUrl(user.portfolio_url);

              return (
                <article
                  key={user.id}
                  className="space-y-3 rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#341D17]">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-[#341D17]/60">
                      {user.email}
                    </p>
                    <p className="text-xs text-[#341D17]/60">
                      Spesialisasi: {user.specialty || 'Belum diisi'}
                    </p>
                    {(portfolioUrl || user.portfolio_file_path) && (
                      <div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold">
                        {portfolioUrl && (
                          <a
                            href={portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#802924] underline underline-offset-2"
                          >
                            Lihat portofolio
                          </a>
                        )}
                        {user.portfolio_file_path && (
                          <a
                            href={`/api/admin/users/${user.id}/portfolio`}
                            className="text-[#802924] underline underline-offset-2"
                          >
                            Unduh {user.portfolio_file_name || 'CV/portofolio'}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actionLoadingId === user.id}
                      onClick={() => handleApprovePendingUser(user)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5C6B2E] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#4B5824] disabled:opacity-60"
                    >
                      <FaCheck className="h-3.5 w-3.5" />
                      {actionLoadingId === user.id ? 'Memproses...' : 'Setujui'}
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === user.id}
                      onClick={() => handleDeleteUser(user)}
                      className="rounded-xl border border-[#341D17]/15 px-3 py-2 text-xs font-bold text-[#802924] transition hover:bg-[#FAF6F0] disabled:opacity-60"
                    >
                      Tolak
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section
          className={`space-y-3 ${
            activeFilter === 'pending_student' ? '' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">
              Pending Siswa
            </h2>
            <span className="rounded-full bg-[#F9DDBB] px-2.5 py-1 text-xs font-extrabold text-[#802924]">
              {pendingStudents.length}
            </span>
          </div>
          {pendingStudents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#341D17]/20 bg-[#FFFDF9]/70 p-4 text-sm text-[#341D17]/55">
              Tidak ada akun siswa yang menunggu persetujuan.
            </p>
          ) : (
            pendingStudents.map((user) => {
              const displayName = getUserDisplayName(user);

              return (
                <article
                  key={user.id}
                  className="space-y-3 rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#341D17]">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-[#341D17]/60">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actionLoadingId === user.id}
                      onClick={() => handleApprovePendingUser(user)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5C6B2E] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#4B5824] disabled:opacity-60"
                    >
                      <FaCheck className="h-3.5 w-3.5" />
                      {actionLoadingId === user.id ? 'Memproses...' : 'Setujui'}
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === user.id}
                      onClick={() => handleDeleteUser(user)}
                      className="rounded-xl border border-[#341D17]/15 px-3 py-2 text-xs font-bold text-[#802924] transition hover:bg-[#FAF6F0] disabled:opacity-60"
                    >
                      Tolak
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {/* DAFTAR PENGGUNA AKTIF */}
      <div
        className={`space-y-3 pt-1 ${
          activeFilter === 'teacher' || activeFilter === 'student'
            ? ''
            : 'hidden'
        }`}
      >
        <div>
          <h2 className="font-editorial text-lg font-bold text-[#341D17]">
            {activeFilter === 'teacher'
              ? 'Daftar Instruktur Aktif'
              : 'Daftar Siswa Aktif'}
          </h2>
          <p className="text-xs text-[#341D17]/55">
            Hanya menampilkan akun dengan status aktif
          </p>
        </div>

        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#341D17]/20 bg-[#FFFDF9]/70 p-4 text-sm text-[#341D17]/55">
              Tidak ada akun yang sesuai dengan kategori atau pencarian.
            </p>
          ) : filteredUsers.map((user) => {
            const roleLabel = isTeacherUser(user)
              ? 'TEACHER'
              : String(user.role || 'STUDENT').toUpperCase();
            const displayName = getUserDisplayName(user);

            return (
              <div
                key={user.id}
                className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/10 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#802924] text-[#FFFDF9] flex items-center justify-center text-xs font-extrabold shrink-0">
                    {String(displayName || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-[#341D17] truncate">
                        {displayName}
                      </span>
                      <span className="rounded-md bg-[#F9DDBB]/75 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                        {roleLabel}
                      </span>
                    </div>

                    <p className="text-xs text-[#341D17]/60 truncate">
                      {user.email}
                    </p>
                    <p className="text-[11px] text-[#341D17]/45">
                      Bergabung: {formatJoinDate(user.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    aria-label={`Ubah ${displayName}`}
                    title={`Ubah ${displayName}`}
                    className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] hover:bg-[#F9DDBB]/55 p-2 text-[#341D17] transition cursor-pointer"
                  >
                    <FaPenToSquare className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user)}
                    aria-label={`Hapus ${displayName}`}
                    title={`Hapus ${displayName}`}
                    className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] hover:bg-[#802924] hover:text-[#FFFDF9] p-2 text-[#802924] transition cursor-pointer"
                  >
                    <FaTrashCan className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL UBAH DATA PENGGUNA (USERNAME, EMAIL, PASSWORD, ROLE, STATUS) */}
      {editingUser && (
        <div
          onClick={() => setEditingUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1712]/55 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#FFFDF9] border border-[#341D17]/15 p-6 text-[#341D17] shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-editorial text-xl font-bold">
                Ubah Data Pengguna
              </h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                aria-label="Tutup modal ubah data pengguna"
                className="rounded-full bg-[#802924] text-[#FFFDF9] w-7 h-7 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                <FaXmark className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
                  USERNAME
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2 text-xs sm:text-sm focus:border-[#802924] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2 text-xs sm:text-sm focus:border-[#802924] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengganti password"
                  className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2 text-xs sm:text-sm placeholder:text-[#341D17]/40 focus:border-[#802924] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
                    ROLE
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs sm:text-sm focus:border-[#802924] focus:outline-none"
                  >
                    <option value="student">student</option>
                    <option value="teacher">teacher</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
                    STATUS
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs sm:text-sm focus:border-[#802924] focus:outline-none"
                  >
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#802924] hover:bg-[#661F1B] text-[#FFFDF9] px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminDeleteConfirmModal
        open={Boolean(deleteConfirm)}
        title={
          isPendingStatus(deleteConfirm)
            ? 'Tolak Pengajuan Akun'
            : 'Hapus Pengguna'
        }
        message={
          deleteConfirm
            ? isPendingStatus(deleteConfirm)
              ? `Tolak dan hapus pengajuan akun "${getUserDisplayName(deleteConfirm)}"? Tindakan ini tidak dapat dibatalkan.`
              : `Hapus pengguna "${getUserDisplayName(deleteConfirm)}" dari sistem? Tindakan ini tidak dapat dibatalkan.`
            : ''
        }
        loading={Boolean(deleteConfirm && actionLoadingId === deleteConfirm.id)}
        onCancel={() => !actionLoadingId && setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          executeDeleteUser(deleteConfirm);
        }}
      />
    </div>
  );
}