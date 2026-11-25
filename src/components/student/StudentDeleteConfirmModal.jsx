'use client';

import { FaTriangleExclamation, FaTrashCan, FaXmark } from 'react-icons/fa6';

export default function StudentDeleteConfirmModal({
  open,
  title = 'Konfirmasi Penghapusan',
  message,
  confirmLabel = 'Hapus Permanen',
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-delete-confirm-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#341D17]/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#802924]/20 bg-[#FFFDF9]/95 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#802924]/10 text-[#802924]">
            <FaTriangleExclamation className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="student-delete-confirm-title"
              className="font-editorial text-xl font-bold text-[#341D17]"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#341D17]/75">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Tutup konfirmasi"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#341D17]/10 text-[#341D17]/60 transition hover:bg-[#341D17]/5 disabled:opacity-50"
          >
            <FaXmark className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] px-4 py-2.5 text-xs font-bold text-[#341D17] transition hover:bg-[#F9DDBB]/50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#802924] px-4 py-2.5 text-xs font-bold text-[#FFFDF9] transition hover:bg-[#661F1B] disabled:opacity-60"
          >
            <FaTrashCan className="h-3.5 w-3.5" aria-hidden="true" />
            {loading ? 'Menghapus...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
