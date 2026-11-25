'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminDeleteConfirmModal from '@/components/admin/AdminDeleteConfirmModal';
import {
  FaUsers,
  FaGraduationCap,
  FaClipboardList,
  FaUtensils,
  FaPlus,
  FaUserPen,
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

function isTeacherUser(user) {
  const r = String(user?.role || '').trim().toLowerCase();
  return r === 'teacher' || r === 'instructor' || r === 'guru';
}

function isStudentUser(user) {
  const r = String(user?.role || '').trim().toLowerCase();
  return r === 'student' || r === 'siswa';
}

function isPendingStatus(user) {
  return String(user?.status || 'active').trim().toLowerCase() === 'pending';
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
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('teacher');
  const [statusInput, setStatusInput] = useState('active');
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const allTeachers = useMemo(
    () => nonAdminUsers.filter((u) => isTeacherUser(u)),
    [nonAdminUsers]
  );

  const pendingTeachers = useMemo(
    () => allTeachers.filter((u) => isPendingStatus(u)),
    [allTeachers]
  );

  const studentsList = useMemo(
    () => nonAdminUsers.filter((u) => isStudentUser(u)),
    [nonAdminUsers]
  );

  const pendingStudents = useMemo(
    () => studentsList.filter((u) => isPendingStatus(u)),
    [studentsList]
  );

  const totalPendingCount = pendingTeachers.length + pendingStudents.length;

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return nonAdminUsers.filter((u) => {
      if (isAdminUser(u)) return false;

      if (activeFilter === 'pending_chef') {
        if (!isTeacherUser(u) || !isPendingStatus(u)) return false;
      } else if (activeFilter === 'pending_student') {
        if (!isStudentUser(u) || !isPendingStatus(u)) return false;
      } else if (activeFilter === 'teacher' && !isTeacherUser(u)) {
        return false;
      } else if (activeFilter === 'student' && !isStudentUser(u)) {
        return false;
      } else if (activeFilter === 'admin') {
        return false;
      }

      if (!q) return true;
      const hay = [
        getUserDisplayName(u),
        u.email || '',
        u.specialty || '',
        u.role || '',
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  }, [nonAdminUsers, searchQuery, activeFilter]);

  const handleActivatePendingUser = async (user) => {
    if (!user || isAdminUser(user) || actionLoadingId) return;
    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (res.ok) {
        setUserOverrides((prev) => ({
          ...prev,
          [String(user.id)]: { ...(prev[String(user.id)] || {}), status: 'active' },
        }));
        router.refresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectPendingUser = async (user) => {
    if (!user || isAdminUser(user) || actionLoadingId) return;
    setDeleteConfirm({ user, mode: 'reject' });
  };

  const executeRejectPendingUser = async (user) => {
    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.add(String(user.id));
          return next;
        });
        router.refresh();
      }
    } finally {
      setActionLoadingId(null);
      setDeleteConfirm(null);
    }
  };

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
    setDeleteConfirm({ user, mode: 'delete' });
  };

  const executeDeleteUser = async (user) => {
    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.add(String(user.id));
          return next;
        });
        router.refresh();
      }
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
            Kelola Akses Siswa &amp; Verifikasi Pengajar
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/65">
            Kurasi instruktur berkualifikasi maestro pastry dan monitor seluruh pengguna ekosistem Yugyo.
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
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#341D17]/12 overflow-hidden">
        <div className="bg-[#FFFDF9] p-4 sm:p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55">
              TOTAL PENGGUNA
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-[#341D17] mt-1">
              {nonAdminUsers.length}
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
              MENUNGGU PENDING
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-[#341D17] mt-1 flex items-center gap-1.5">
              <span>{totalPendingCount}</span>
              <span className="w-2 h-2 rounded-full bg-[#EA580C] inline-block" />
            </p>
          </div>
          <span className="w-8 h-8 rounded-lg bg-[#FFFDF9] border border-[#341D17]/10 text-[#802924] flex items-center justify-center shrink-0">
            <FaClipboardList className="w-4 h-4" />
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
          onClick={() => setActiveFilter('all')}
          className={`rounded-full px-3.5 py-1 font-bold transition cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#802924] text-[#FFFDF9]'
              : 'bg-[#FFFDF9] border border-[#341D17]/12 text-[#341D17]/75 hover:bg-[#FAF6F0]'
          }`}
        >
          Semua ({nonAdminUsers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('pending_chef')}
          className={`rounded-full px-3.5 py-1 font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
            activeFilter === 'pending_chef'
              ? 'bg-[#802924] text-[#FFFDF9]'
              : 'bg-[#FFFDF9] border border-[#341D17]/12 text-[#341D17]/75 hover:bg-[#FAF6F0]'
          }`}
        >
          <span>Pending Chef</span>
          <span className="rounded-full bg-[#F9DDBB] px-1.5 py-0.5 text-[10px] font-extrabold text-[#802924]">
            {pendingTeachers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('pending_student')}
          className={`rounded-full px-3.5 py-1 font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
            activeFilter === 'pending_student'
              ? 'bg-[#802924] text-[#FFFDF9]'
              : 'bg-[#FFFDF9] border border-[#341D17]/12 text-[#341D17]/75 hover:bg-[#FAF6F0]'
          }`}
        >
          <span>Pending Student</span>
          <span className="rounded-full bg-[#F9DDBB] px-1.5 py-0.5 text-[10px] font-extrabold text-[#802924]">
            {pendingStudents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('teacher')}
          className={`rounded-full px-3.5 py-1 font-bold transition cursor-pointer ${
            activeFilter === 'teacher'
              ? 'bg-[#802924] text-[#FFFDF9]'
              : 'bg-[#FFFDF9] border border-[#341D17]/12 text-[#341D17]/75 hover:bg-[#FAF6F0]'
          }`}
        >
          Instruktur Chef ({allTeachers.length})
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
      </div>

      {/* DAFTAR PENDING CHEF (TEACHER BERSTATUS PENDING) */}
      {pendingTeachers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-editorial text-lg font-bold text-[#341D17] flex items-center gap-2">
              <FaUserPen className="w-4 h-4 text-[#802924] shrink-0" />
              <span>Pending Chef &bull; Verifikasi Calon Pengajar</span>
            </h2>
            <span className="rounded-md bg-[#802924] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#FFFDF9]">
              PENDING CHEF ({pendingTeachers.length})
            </span>
          </div>

          <div className="space-y-3">
            {pendingTeachers.map((cand) => {
              const displayName = getUserDisplayName(cand);
              return (
                <div
                  key={cand.id}
                  className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-4 sm:p-5 space-y-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#802924] text-[#FFFDF9] flex items-center justify-center text-sm font-extrabold shrink-0">
                        {String(displayName || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm sm:text-base font-bold text-[#341D17] truncate">
                            {displayName}
                          </p>
                          <span className="rounded-md bg-[#802924] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#FFFDF9]">
                            PENDING CHEF
                          </span>
                        </div>
                        <p className="text-xs text-[#341D17]/65 truncate">
                          Spesialisasi: {cand.specialty || 'Atelier Baking'}
                        </p>
                        <p className="text-xs text-[#341D17]/55 truncate">
                          {cand.email}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-[#341D17]/45 shrink-0">
                      Diajukan baru-baru ini
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      disabled={actionLoadingId === cand.id}
                      onClick={() => handleActivatePendingUser(cand)}
                      className="sm:col-span-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5C6B2E] hover:bg-[#4B5824] py-2.5 px-4 text-xs sm:text-sm font-bold text-white transition cursor-pointer disabled:opacity-60"
                    >
                      <FaCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Setujui Pengajar</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoadingId === cand.id}
                      onClick={() => handleRejectPendingUser(cand)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#341D17]/80 transition cursor-pointer disabled:opacity-60"
                    >
                      <FaXmark className="w-3.5 h-3.5 shrink-0" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAFTAR PENDING STUDENT (STUDENT BERSTATUS PENDING) */}
      {pendingStudents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-editorial text-lg font-bold text-[#341D17] flex items-center gap-2">
              <FaGraduationCap className="w-4 h-4 text-[#802924] shrink-0" />
              <span>Pending Student &bull; Antrean Status Siswa</span>
            </h2>
            <span className="rounded-md bg-[#802924] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#FFFDF9]">
              PENDING STUDENT ({pendingStudents.length})
            </span>
          </div>

          <div className="space-y-3">
            {pendingStudents.map((stu) => {
              const displayName = getUserDisplayName(stu);
              return (
                <div
                  key={stu.id}
                  className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-4 sm:p-5 space-y-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#802924] text-[#FFFDF9] flex items-center justify-center text-sm font-extrabold shrink-0">
                        {String(displayName || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm sm:text-base font-bold text-[#341D17] truncate">
                            {displayName}
                          </p>
                          <span className="rounded-md bg-[#F9DDBB]/85 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                            PENDING STUDENT
                          </span>
                        </div>
                        <p className="text-xs text-[#341D17]/55 truncate">
                          {stu.email}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-[#341D17]/45 shrink-0">
                      Status: pending
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      disabled={actionLoadingId === stu.id}
                      onClick={() => handleActivatePendingUser(stu)}
                      className="sm:col-span-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5C6B2E] hover:bg-[#4B5824] py-2.5 px-4 text-xs sm:text-sm font-bold text-white transition cursor-pointer disabled:opacity-60"
                    >
                      <FaCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Aktifkan Siswa</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoadingId === stu.id}
                      onClick={() => handleRejectPendingUser(stu)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#341D17]/80 transition cursor-pointer disabled:opacity-60"
                    >
                      <FaXmark className="w-3.5 h-3.5 shrink-0" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAFTAR SELURUH PENGGUNA (TANPA AKUN ADMIN) */}
      <div className="space-y-3 pt-1">
        <div>
          <h2 className="font-editorial text-lg font-bold text-[#341D17]">
            Daftar Seluruh Pengguna
          </h2>
          <p className="text-xs text-[#341D17]/55">
            Sinkronisasi langsung dengan sistem otentikasi
          </p>
        </div>

        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const roleLabel = String(user.role || 'TEACHER').toUpperCase();
            const pending = isPendingStatus(user);
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
                      {pending && (
                        <span className="rounded-md bg-[#802924] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#FFFDF9]">
                          {isTeacherUser(user) ? 'PENDING CHEF' : 'PENDING STUDENT'}
                        </span>
                      )}
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
          deleteConfirm?.mode === 'reject'
            ? 'Tolak Pengajuan Akun'
            : 'Hapus Pengguna'
        }
        message={
          deleteConfirm
            ? deleteConfirm.mode === 'reject'
              ? `Tolak dan hapus pengajuan akun "${getUserDisplayName(deleteConfirm.user)}"? Tindakan ini tidak dapat dibatalkan.`
              : `Hapus pengguna "${getUserDisplayName(deleteConfirm.user)}" dari sistem? Tindakan ini tidak dapat dibatalkan.`
            : ''
        }
        loading={Boolean(deleteConfirm && actionLoadingId === deleteConfirm.user.id)}
        onCancel={() => !actionLoadingId && setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          if (deleteConfirm.mode === 'reject') {
            executeRejectPendingUser(deleteConfirm.user);
          } else {
            executeDeleteUser(deleteConfirm.user);
          }
        }}
      />
    </div>
  );
}