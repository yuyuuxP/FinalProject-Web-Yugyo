'use client';

import { useState } from 'react';
import AdminDeleteConfirmModal from '@/components/admin/AdminDeleteConfirmModal';

export default function DeleteUserButton({ userId, userName }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert('Gagal menghapus pengguna.');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        aria-label="Hapus Pengguna"
        className="w-8 h-8 rounded-xl bg-[#802924]/10 hover:bg-[#802924] text-[#802924] hover:text-[#F9DDBB] flex items-center justify-center text-xs transition cursor-pointer shadow-2xs"
        title="Hapus Pengguna"
      >
        🗑️
      </button>
      <AdminDeleteConfirmModal
        open={showConfirm}
        title="Hapus Pengguna"
        message={`Hapus pengguna "${userName}" dari sistem? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
        onCancel={() => !deleting && setShowConfirm(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}