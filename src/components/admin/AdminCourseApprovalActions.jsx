'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AdminCourseDeleteButton from '@/components/admin/AdminCourseDeleteButton';

export default function AdminCourseApprovalActions({ course }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState('');
  const [error, setError] = useState('');

  const updateCourseStatus = async (status) => {
    if (pendingAction) return;

    setPendingAction(status);
    setError('');
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Gagal memperbarui status kursus.');
      }

      router.refresh();
    } catch (requestError) {
      console.error('Error updating course approval status:', requestError);
      setError(requestError.message || 'Tidak dapat menghubungi server.');
    } finally {
      setPendingAction('');
    }
  };

  return (
    <div className="shrink-0 self-end space-y-2 sm:self-auto">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/dashboard/admin/courses/${course.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] px-4 py-2.5 text-xs font-bold text-[#341D17] transition hover:bg-[#F9DDBB]/55"
        >
          Detail
        </Link>
        <AdminCourseDeleteButton
          courseId={course.id}
          courseTitle={course.title}
          size="regular"
        />
        <button
          type="button"
          disabled={Boolean(pendingAction)}
          onClick={() => updateCourseStatus('active')}
          className="whitespace-nowrap rounded-xl bg-[#5C6B2E] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#4B5824] disabled:opacity-60"
        >
          {pendingAction === 'active' ? 'Menyetujui...' : 'Setujui'}
        </button>
        <button
          type="button"
          disabled={Boolean(pendingAction)}
          onClick={() => updateCourseStatus('draft')}
          className="whitespace-nowrap rounded-xl border border-[#802924]/25 bg-[#FFFDF9] px-4 py-2.5 text-xs font-bold text-[#802924] transition hover:bg-[#802924] hover:text-[#FFFDF9] disabled:opacity-60"
        >
          {pendingAction === 'draft' ? 'Menolak...' : 'Tolak'}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-right text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
