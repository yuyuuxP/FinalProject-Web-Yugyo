'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrashCan } from 'react-icons/fa6';
import AdminDeleteConfirmModal from '@/components/admin/AdminDeleteConfirmModal';

export default function AdminCourseDeleteButton({
  courseId,
  courseTitle,
  size = 'compact',
}) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const deleteCourse = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Gagal menghapus kursus.');
      }

      setIsConfirmOpen(false);
      router.refresh();
    } catch (requestError) {
      console.error('Error deleting course:', requestError);
      setError(requestError.message || 'Tidak dapat menghubungi server.');
      setIsConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => {
            setError('');
            setIsConfirmOpen(true);
          }}
          disabled={isDeleting}
          aria-label={`Hapus kursus ${courseTitle}`}
          className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#802924]/25 bg-[#FFFDF9] text-xs font-bold text-[#802924] transition hover:bg-[#802924] hover:text-[#FFFDF9] disabled:opacity-60 ${
            size === 'regular' ? 'px-4 py-2.5' : 'px-3.5 py-1.5'
          }`}
        >
          <FaTrashCan className="h-3 w-3" aria-hidden="true" />
          Hapus
        </button>
        {error && (
          <p role="alert" className="max-w-40 text-right text-[10px] font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
      <AdminDeleteConfirmModal
        open={isConfirmOpen}
        title="Hapus kursus permanen?"
        message={`Kursus "${courseTitle}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, hapus permanen"
        loading={isDeleting}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={deleteCourse}
      />
    </>
  );
}
