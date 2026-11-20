'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

function normalizeStatus(item) {
  const rawStatus = String(item?.status || '').toLowerCase();
  if (rawStatus === 'canceled') return 'canceled';
  if (rawStatus === 'completed' || Boolean(item?.is_done)) return 'completed';
  return 'scheduled';
}

function mapSessions(list) {
  return (Array.isArray(list) ? list : []).map((s) => {
    const st = normalizeStatus(s);
    return {
      ...s,
      is_popup: Boolean(s?.is_popup),
      is_done: st === 'completed',
      status: st,
    };
  });
}

export default function AdminScheduleClient({
  admin,
  courses = [],
  instructors = [],
  initialSessions = [],
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [sessions, setSessions] = useState(() => mapSessions(initialSessions));
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    course_id: courses[0]?.id || '',
    instructor_id: instructors[0]?.id || '',
    title: '',
    notes: '',
    session_date: '2026-11-20',
    session_time: '14:00 WITA',
    location_label: 'Atelier Studio 02',
    is_popup: false,
  });

  const stats = useMemo(() => {
    const totalCount = sessions.length;
    const scheduledCount = sessions.filter((s) => normalizeStatus(s) === 'scheduled').length;
    const popupCount = sessions.filter((s) => Boolean(s.is_popup)).length;
    const completedCount = sessions.filter((s) => normalizeStatus(s) === 'completed').length;
    const canceledCount = sessions.filter((s) => normalizeStatus(s) === 'canceled').length;

    return {
      totalCount,
      scheduledCount,
      popupCount,
      completedCount,
      canceledCount,
    };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return sessions.filter((item) => {
      const st = normalizeStatus(item);
      if (statusFilter === 'scheduled' && st !== 'scheduled') return false;
      if (statusFilter === 'popup' && !Boolean(item.is_popup)) return false;
      if (statusFilter === 'completed' && st !== 'completed') return false;
      if (statusFilter === 'canceled' && st !== 'canceled') return false;

      if (!q) return true;
      const haystack = [
        item.title,
        item.notes,
        item.course_title,
        item.instructor_name,
        item.location_label,
        item.session_date,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [sessions, statusFilter, searchQuery]);

  const openCreateModal = () => {
    setErrorMsg('');
    setEditingSessionId(null);
    setFormData({
      course_id: courses[0]?.id || '',
      instructor_id: instructors[0]?.id || '',
      title: '',
      notes: '',
      session_date: '2026-11-20',
      session_time: '14:00 WITA',
      location_label: 'Atelier Studio 02',
      is_popup: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setErrorMsg('');
    setEditingSessionId(item.id);
    setFormData({
      course_id: item.course_id || courses[0]?.id || '',
      instructor_id: item.instructor_id || instructors[0]?.id || '',
      title: item.title || '',
      notes: item.notes || '',
      session_date: item.session_date || '2026-11-20',
      session_time: item.session_time || '14:00 WITA',
      location_label: item.location_label || 'Atelier Studio 02',
      is_popup: Boolean(item.is_popup),
    });
    setIsModalOpen(true);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const isEditing = Boolean(editingSessionId);
      const endpoint = isEditing ? '/api/teacher/schedule' : '/api/admin/schedule';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing ? { ...formData, session_id: editingSessionId } : formData
        ),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal menyimpan jadwal sesi.');
      }

      const matchedCourse = courses.find((c) => String(c.id) === String(formData.course_id));
      const matchedInstructor = instructors.find(
        (u) => String(u.id) === String(formData.instructor_id)
      );

      if (isEditing) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === editingSessionId
              ? {
                  ...s,
                  ...(data.session || {}),
                  course_id: Number(formData.course_id),
                  instructor_id: formData.instructor_id
                    ? Number(formData.instructor_id)
                    : s.instructor_id,
                  title: formData.title,
                  notes: formData.notes,
                  session_date: formData.session_date,
                  session_time: formData.session_time,
                  location_label: formData.location_label,
                  is_popup: Boolean(formData.is_popup),
                  course_title: matchedCourse?.title || s.course_title || 'Kursus Atelier',
                  instructor_name:
                    matchedInstructor?.full_name || s.instructor_name || 'Instruktur Atelier',
                }
              : s
          )
        );
        setFeedbackMsg('Perubahan detail sesi berhasil disimpan dan disinkronkan.');
      } else {
        const created = {
          ...(data.session || {}),
          id: data.session?.id || Date.now(),
          course_id: Number(formData.course_id),
          instructor_id: formData.instructor_id ? Number(formData.instructor_id) : null,
          title: formData.title,
          notes: formData.notes,
          session_date: formData.session_date,
          session_time: formData.session_time,
          location_label: formData.location_label,
          is_popup: Boolean(formData.is_popup),
          is_done: false,
          status: 'scheduled',
          course_title: matchedCourse?.title || 'Kursus Atelier',
          instructor_name: matchedInstructor?.full_name || 'Instruktur Atelier',
        };

        setSessions((prev) => [created, ...prev]);
        setFeedbackMsg('Jadwal sesi baru berhasil ditambahkan dan tersinkron ke database.');
      }

      setIsModalOpen(false);
      setEditingSessionId(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menyimpan jadwal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (item, actionType) => {
    if (!item?.id || busyId) return;
    const currentStatus = normalizeStatus(item);

    if (actionType === 'cancel' && currentStatus !== 'scheduled') return;
    if (actionType === 'delete' && currentStatus !== 'canceled') return;
    if ((actionType === 'mark_done' || actionType === 'unmark_done') && currentStatus === 'canceled') {
      return;
    }

    if (actionType === 'delete') {
      const ok = window.confirm(
        `Hapus permanen kelas yang dibatalkan "${item.title}"?`
      );
      if (!ok) return;
    }

    setBusyId(item.id);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      if (actionType === 'delete') {
        const res = await fetch(`/api/teacher/schedule?session_id=${item.id}`, {
          method: 'DELETE',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || 'Gagal menghapus kelas.');
        }

        setSessions((prev) => prev.filter((s) => s.id !== item.id));
        setFeedbackMsg(`Kelas "${item.title}" berhasil dihapus dari database.`);
      } else {
        const res = await fetch('/api/teacher/schedule', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: item.id,
            action: actionType,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || 'Gagal memperbarui status sesi di database.');
        }

        const nextStatus =
          actionType === 'cancel'
            ? 'canceled'
            : actionType === 'unmark_done'
            ? 'scheduled'
            : 'completed';

        setSessions((prev) =>
          prev.map((s) =>
            s.id === item.id
              ? {
                  ...(data.session || s),
                  status: nextStatus,
                  is_done: nextStatus === 'completed',
                }
              : s
          )
        );

        setFeedbackMsg(
          actionType === 'cancel'
            ? `Kelas "${item.title}" diubah menjadi Dibatalkan.`
            : actionType === 'unmark_done'
            ? `Mark as Done untuk "${item.title}" dibatalkan dan sesi kembali aktif.`
            : `Kelas "${item.title}" ditandai selesai (Mark as Done).`
        );
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat memproses aksi.');
    } finally {
      setBusyId(null);
    }
  };

  const filterButtons = [
    { key: 'all', label: 'Semua' },
    { key: 'scheduled', label: 'Terjadwal' },
    { key: 'popup', label: 'Dadakan' },
    { key: 'completed', label: 'Selesai' },
    { key: 'canceled', label: 'Dibatalkan' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="block text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#802924]">
            ATELIER KALENDER • {admin?.full_name || 'Admin Yugyo'}
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Manajemen Jadwal
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/75">
            Pantau seluruh jadwal kelas &amp; sesi yang dibuat oleh instructor maupun admin secara terpusat.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="self-start sm:self-auto rounded-2xl bg-[#802924] hover:bg-[#661F1B] px-5 py-3 text-xs sm:text-sm font-bold text-[#F9DDBB] shadow-md transition inline-flex items-center gap-2 cursor-pointer"
        >
          <span>+</span>
          <span>Buat Jadwal</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="rounded-2xl border border-[#341D17]/20 bg-[#F9DDBB]/60 px-4 py-3 text-xs font-bold text-[#341D17]">
          {feedbackMsg} {isPending ? '• Menyinkronkan database...' : ''}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-800">
          {errorMsg}
        </div>
      )}

      {/* 5 KARTU STATISTIK TERHUBUNG KE DATABASE & STATE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-1.5">
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
            TOTAL SESI TERDATA
          </span>
          <p className="font-editorial text-2xl font-bold text-[#341D17]">
            {stats.totalCount}
          </p>
          <p className="text-xs text-[#341D17]/70">Tersinkron dengan jadwal teacher</p>
        </div>

        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-1.5">
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
            TERJADWAL AKTIF
          </span>
          <p className="font-editorial text-2xl font-bold text-[#341D17]">
            {stats.scheduledCount}
          </p>
          <p className="text-xs text-[#341D17]/70">Menunggu pelaksanaan / mark as done</p>
        </div>

        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-1.5">
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
            KELAS DADAKAN (POP-UP)
          </span>
          <p className="font-editorial text-2xl font-bold text-[#341D17]">
            {stats.popupCount}
          </p>
          <p className="text-xs text-[#341D17]/70">Sesi tambahan di luar jadwal rutin</p>
        </div>

        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-1.5">
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
            SELESAI (MARK AS DONE)
          </span>
          <p className="font-editorial text-2xl font-bold text-[#341D17]">
            {stats.completedCount}
          </p>
          <p className="text-xs text-[#341D17]/70">Sesi tuntas divalidasi instructor</p>
        </div>

        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-1.5">
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#802924]">
            DIBATALKAN
          </span>
          <p className="font-editorial text-2xl font-bold text-[#802924]">
            {stats.canceledCount}
          </p>
          <p className="text-xs text-[#341D17]/70">Kelas/sesi yang dibatalkan</p>
        </div>
      </div>

      {/* FILTER TANPA ANGKA + PENCARIAN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterButtons.map((btn) => {
            const active = statusFilter === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => setStatusFilter(btn.key)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                    : 'border border-[#341D17]/20 bg-[#FFFDF9] text-[#341D17] hover:bg-[#F9DDBB]/50'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jadwal, kelas, chef, studio..."
            className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-4 py-2 text-xs text-[#341D17] placeholder:text-[#341D17]/45"
          />
        </div>
      </div>

      {/* DAFTAR SESI */}
      {filteredSessions.length === 0 ? (
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-6 text-center text-xs text-[#341D17]/70">
          Tidak ada jadwal sesi yang cocok dengan filter atau pencarian saat ini.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredSessions.map((item) => {
            const status = normalizeStatus(item);
            const isBusy = busyId === item.id;

            const badgeClass =
              status === 'canceled'
                ? 'bg-red-500/15 text-red-800'
                : status === 'completed'
                ? 'bg-[#341D17] text-[#F9DDBB]'
                : 'bg-[#F9DDBB] text-[#802924]';

            const badgeText =
              status === 'canceled'
                ? 'DIBATALKAN'
                : status === 'completed'
                ? 'SELESAI (DONE)'
                : 'TERJADWAL';

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${badgeClass}`}
                    >
                      {badgeText}
                    </span>

                    {item.is_popup && (
                      <span className="rounded-full bg-[#802924]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#802924]">
                        KELAS DADAKAN
                      </span>
                    )}

                    <span className="text-xs font-semibold text-[#341D17]/75">
                      {item.session_date} • {item.session_time || '14:00 WITA'}
                    </span>
                  </div>

                  <span className="rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-1 text-[11px] font-bold text-[#341D17]">
                    {item.location_label || 'Atelier Studio 02'}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                    {item.course_title || 'KURSUS ATELIER'}
                    {item.instructor_name ? ` • CHEF ${String(item.instructor_name).toUpperCase()}` : ''}
                  </p>
                  <h3
                    className={`font-editorial text-lg sm:text-xl font-bold ${
                      status === 'canceled' ? 'text-[#341D17]/55 line-through' : 'text-[#341D17]'
                    }`}
                  >
                    {item.title}
                  </h3>
                  {item.notes && (
                    <p className="text-xs sm:text-sm text-[#341D17]/75">{item.notes}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#341D17]/10 pt-3">
                  {status !== 'canceled' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => openEditModal(item)}
                      className="rounded-xl border border-[#341D17]/20 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 px-3.5 py-2 text-xs font-bold text-[#341D17] transition cursor-pointer disabled:opacity-50"
                    >
                      Edit
                    </button>
                  )}

                  {status === 'scheduled' && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(item, 'cancel')}
                        className="rounded-xl border border-[#341D17]/25 bg-[#FFFDF9] hover:bg-[#F9DDBB]/60 px-4 py-2 text-xs font-bold text-[#341D17] transition cursor-pointer disabled:opacity-50"
                      >
                        {isBusy ? 'Memproses...' : 'Batalkan'}
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(item, 'mark_done')}
                        className="rounded-xl bg-[#341D17]/10 hover:bg-[#341D17]/20 px-4 py-2 text-xs font-bold text-[#341D17] transition cursor-pointer disabled:opacity-50"
                      >
                        {isBusy ? 'Menyimpan...' : 'Mark as Done'}
                      </button>
                    </>
                  )}

                  {status === 'completed' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleAction(item, 'unmark_done')}
                      className="rounded-xl bg-[#341D17]/15 hover:bg-[#341D17]/25 px-4 py-2 text-xs font-bold text-[#341D17] transition cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? 'Membatalkan...' : '✓ Marked as Done • Batal'}
                    </button>
                  )}

                  {status === 'canceled' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleAction(item, 'delete')}
                      className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#F9DDBB] shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? 'Menghapus...' : 'Hapus'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL BUAT / EDIT JADWAL ADMIN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#341D17]/20 bg-[#FFFDF9] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#341D17]/10 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#802924]">
                  {editingSessionId ? 'EDIT JADWAL SESI' : 'ADMIN ATELIER SCHEDULE'}
                </span>
                <h3 className="font-editorial text-xl font-bold text-[#341D17]">
                  {editingSessionId ? 'Ubah Detail Sesi Kelas' : 'Buat Jadwal Sesi Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingSessionId(null);
                }}
                className="h-8 w-8 rounded-full bg-[#802924] text-xs font-bold text-[#F9DDBB] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                  KURSUS
                </label>
                <select
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData((p) => ({ ...p, course_id: e.target.value }))}
                  className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {instructors.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                    INSTRUCTOR / CHEF
                  </label>
                  <select
                    value={formData.instructor_id}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, instructor_id: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                  >
                    {instructors.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                  JUDUL SESI
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Contoh: Sesi Evaluasi Adonan & Praktik"
                  className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                    TANGGAL
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.session_date}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, session_date: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                    WAKTU
                  </label>
                  <input
                    type="text"
                    value={formData.session_time}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, session_time: e.target.value }))
                    }
                    placeholder="14:00 WITA"
                    className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                  LOKASI / STUDIO
                </label>
                <input
                  type="text"
                  value={formData.location_label}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, location_label: e.target.value }))
                  }
                  placeholder="Atelier Studio 02"
                  className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                  CATATAN SESI (OPSIONAL)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Ringkasan topik atau catatan tambahan..."
                  className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#341D17] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.is_popup}
                  onChange={(e) => setFormData((p) => ({ ...p, is_popup: e.target.checked }))}
                  className="rounded border-[#341D17]/30"
                />
                <span>Tandai sebagai Kelas Dadakan (Pop-up)</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSessionId(null);
                  }}
                  className="rounded-xl border border-[#341D17]/20 px-4 py-2.5 text-xs font-bold text-[#341D17] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-5 py-2.5 text-xs font-bold text-[#F9DDBB] cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editingSessionId
                    ? 'Simpan Perubahan'
                    : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}