'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export default function AdminScheduleClient({ initialSessions = [] }) {
  const sessions = Array.isArray(initialSessions) ? initialSessions : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sessions.filter((s) => {
      const st = s.status || (s.is_done ? 'completed' : 'scheduled');
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      if (!q) return true;

      return (
        String(s.title || '').toLowerCase().includes(q) ||
        String(s.course_title || '').toLowerCase().includes(q) ||
        String(s.instructor_name || '').toLowerCase().includes(q) ||
        String(s.location_label || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    const total = sessions.length;
    const popupCount = sessions.filter((s) => Boolean(s.is_popup)).length;
    const openCount = sessions.filter(
      (s) => (s.status || (s.is_done ? 'completed' : 'scheduled')) === 'scheduled'
    ).length;
    const doneCount = sessions.filter(
      (s) => (s.status || (s.is_done ? 'completed' : 'scheduled')) === 'completed'
    ).length;
    return { total, popupCount, openCount, doneCount };
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="block text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#802924]">
            ATELIER KALENDER
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Manajemen Jadwal
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/75">
            Pantau seluruh jadwal kelas &amp; sesi yang dibuat oleh instructor maupun admin secara terpusat.
          </p>
        </div>

        <Link
          href="/dashboard/admin/schedule/create"
          className="self-start sm:self-auto rounded-2xl bg-[#802924] hover:bg-[#661F1B] px-5 py-3 text-xs sm:text-sm font-bold text-[#F9DDBB] shadow-md transition inline-flex items-center gap-2"
        >
          <span>+</span>
          <span>Buat Jadwal</span>
        </Link>
      </div>

      {/* 4 KARTU RINGKASAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
            TOTAL SESI TERDATA
          </span>
          <p className="font-editorial text-2xl font-bold text-[#341D17]">{counts.total}</p>
          <p className="text-xs text-[#341D17]/70">Tersinkron dengan jadwal teacher</p>
        </div>

        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
            TERJADWAL AKTIF
          </span>
          <p className="font-editorial text-2xl font-bold text-[#341D17]">{counts.openCount}</p>
          <p className="text-xs text-[#341D17]/70">Menunggu pelaksanaan / mark as done</p>
        </div>

        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
            KELAS DADAKAN (POP-UP)
          </span>
          <p className="font-editorial text-2xl font-bold text-[#802924]">{counts.popupCount}</p>
          <p className="text-xs text-[#341D17]/70">Sesi tambahan di luar jadwal rutin</p>
        </div>

        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
            SELESAI (MARK AS DONE)
          </span>
          <p className="font-editorial text-2xl font-bold text-[#341D17]">{counts.doneCount}</p>
          <p className="text-xs text-[#341D17]/70">Sesi tuntas divalidasi instructor</p>
        </div>
      </div>

      {/* PENCARIAN & FILTER STATUS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: `Semua (${sessions.length})` },
            { key: 'scheduled', label: `Terjadwal (${counts.openCount})` },
            { key: 'completed', label: `Selesai (${counts.doneCount})` },
            { key: 'canceled', label: 'Dibatalkan' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#802924] text-[#F9DDBB]'
                  : 'border border-[#341D17]/15 bg-[#FFFDF9] text-[#341D17] hover:bg-[#F9DDBB]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari jadwal kelas, chef, studio..."
          className="w-full md:w-72 rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] px-4 py-2 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924]"
        />
      </div>

      {/* DAFTAR SESI / JADWAL TERHUBUNG */}
      {filteredSessions.length === 0 ? (
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-8 text-center text-xs text-[#341D17]/70">
          Belum ada sesi kelas yang tercatat. Sesi yang dibuat oleh teacher akan otomatis muncul di sini.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredSessions.map((item) => {
            const st = item.status || (item.is_done ? 'completed' : 'scheduled');
            const badgeStyle =
              st === 'canceled'
                ? 'bg-red-500/15 text-red-800'
                : st === 'completed'
                ? 'bg-[#341D17] text-[#F9DDBB]'
                : 'bg-[#F9DDBB] text-[#802924]';

            const badgeLabel =
              st === 'canceled' ? 'DIBATALKAN' : st === 'completed' ? 'SELESAI' : 'TERJADWAL';

            return (
              <Link
                key={item.id}
                href={`/dashboard/admin/schedule/${item.id}`}
                className="block rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs hover:shadow-md transition space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${badgeStyle}`}
                    >
                      {badgeLabel}
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
                    {item.location_label || 'Atelier Live'}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                    {item.course_title || 'Kursus Atelier'} • Chef {item.instructor_name || 'Instructor'}
                  </p>
                  <h3
                    className={`font-editorial text-lg sm:text-xl font-bold mt-0.5 ${
                      st === 'canceled' ? 'line-through text-[#341D17]/55' : 'text-[#341D17]'
                    }`}
                  >
                    {item.title}
                  </h3>
                  {item.notes && (
                    <p className="text-xs sm:text-sm text-[#341D17]/75 mt-1">{item.notes}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}