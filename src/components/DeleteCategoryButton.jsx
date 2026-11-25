'use client';

import { useState } from 'react';
import { FaTrashCan } from 'react-icons/fa6';
import AdminDeleteConfirmModal from '@/components/admin/AdminDeleteConfirmModal';

export default function DeleteCategoryButton({ categoryId, categoryName }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert('Gagal menghapus kategori.');
      }
    } catch (err) {
      console.error('Delete error:', err);
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
        aria-label="Hapus Kategori"
        className="w-8 h-8 rounded-xl bg-[#802924]/10 hover:bg-[#802924] text-[#802924] hover:text-[#F9DDBB] flex items-center justify-center text-xs transition cursor-pointer shadow-2xs"
        title="Hapus Kategori"
      >
        <FaTrashCan className="w-3.5 h-3.5" />
      </button>
      <AdminDeleteConfirmModal
        open={showConfirm}
        title="Hapus Kategori"
        message={`Hapus kategori "${categoryName}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
        onCancel={() => !deleting && setShowConfirm(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}