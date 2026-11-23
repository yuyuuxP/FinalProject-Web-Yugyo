'use client';

import { useEffect, useState } from 'react';

function getInitials(name) {
  const clean = String(name || 'S').trim();
  if (!clean) return 'ST';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function StudentReportsBridge() {
  const [studentReports, setStudentReports] = useState([]);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [statusMap, setStatusMap] = useState({});
  const [replyMap, setReplyMap] = useState({});

  useEffect(() => {
    let active = true;
    fetch('/api/student/reports', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data || !Array.isArray(data.reports)) return;
        const customOnly = data.reports.filter(
          (r) =>
            r &&
            !['rep-video-1', 'rep-schedule-2'].includes(String(r.id || ''))
        );
        setStudentReports(customOnly);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSaveReply = async (reportId, targetLabel = 'Admin') => {
    const cleanText = replyText.trim();
    if (!cleanText) return;

    await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        replyMessage: cleanText,
        status: 'SELESAI',
      }),
    }).catch(() => null);

    setReplyMap((prev) => ({
      ...prev,
      [reportId]: { sender: targetLabel, message: cleanText },
    }));
    setStatusMap((prev) => ({ ...prev, [reportId]: 'SELESAI' }));
    setReplyingId(null);
    setReplyText('');
  };

  const handleEscalateTech = async (reportId) => {
    await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DITERUSKAN KE TIM TEKNIS' }),
    }).catch(() => null);

    setStatusMap((prev) => ({
      ...prev,
      [reportId]: 'DITERUSKAN KE TIM TEKNIS',
    }));
  };

  if (studentReports.length === 0) return null;

  return (
    <div className="space-y-4 pt-2 text-[#341D17]">
      {studentReports.map((item, idx) => {
        const senderUsername = item.username || 'Salwa';
        const badgeStatus =
          statusMap[item.id] ||
          (item.status === 'Baru Dikirim' ? 'BELUM DIBACA' : item.status || 'BELUM DIBACA');
        const savedReply = replyMap[item.id] || item.adminReply;

        return (
          <div
            key={item.id || idx}
            className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/10 p-5 sm:p-6 space-y-4 shadow-2xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#802924] text-[#FFFDF9] text-xs font-extrabold flex items-center justify-center shrink-0">
                  {getInitials(senderUsername)}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-[#341D17]">
                      {senderUsername}
                    </span>
                    <span className="text-[11px] text-[#341D17]/45">
                      #STU-{2000 + idx}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#341D17]/90">
                    {item.title || `Keluhan pada ${item.featureArea || 'Website'}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded bg-[#F9DDBB]/85 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                  {String(badgeStatus).toUpperCase()}
                </span>
                <span className="text-[11px] text-[#341D17]/45">
                  {item.reportedAt || 'Baru saja'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#FAF6F0]/80 border border-[#341D17]/8 px-4 py-3 text-xs sm:text-sm italic text-[#341D17]/80">
              &ldquo;{item.description}&rdquo;
            </div>

            {item.photoUrl && (
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#341D17]/10 p-3 flex items-center gap-3">
                <img
                  src={item.photoUrl}
                  alt={item.photoLabel || 'Bukti gambar error'}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#341D17] truncate">
                    {item.photoLabel || 'Bukti Gambar Error'}
                  </p>
                  <p className="text-[11px] text-[#341D17]/55 truncate">
                    {item.photoUrl}
                  </p>
                </div>
              </div>
            )}

            {savedReply && (
              <div className="rounded-2xl bg-[#FAF6F0] border-l-2 border-[#802924] px-4 py-2.5 text-xs text-[#341D17]/80">
                <strong>{savedReply.sender || savedReply.name || 'Respon'}:</strong>{' '}
                &ldquo;{savedReply.message}&rdquo;
              </div>
            )}

            {replyingId === item.id && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Tulis tanggapan untuk ${senderUsername}...`}
                  className="flex-1 rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs text-[#341D17] focus:border-[#802924] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSaveReply(item.id, 'Admin Yugyo')}
                  className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-3.5 py-2 text-xs font-bold text-[#FFFDF9] cursor-pointer"
                >
                  Kirim
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setReplyingId(replyingId === item.id ? null : item.id);
                  setReplyText('');
                }}
                className="rounded-xl bg-[#802924] hover:bg-[#661F1B] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#FFFDF9] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>&#128172;</span>
                <span>Tanggapi Siswa</span>
              </button>

              <button
                type="button"
                onClick={() => handleEscalateTech(item.id)}
                className="rounded-xl bg-[#F9DDBB]/65 hover:bg-[#F9DDBB] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#802924] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>&#128736;</span>
                <span>Tim Teknis</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}