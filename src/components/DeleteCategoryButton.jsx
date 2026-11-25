'use client';

import { FaTrashCan } from 'react-icons/fa6';

export default function DeleteCategoryButton({ categoryId, categoryName }) {
  const handleDelete = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryName}"?`)) {
      return;
    }

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
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      aria-label="Hapus Kategori"
      className="w-8 h-8 rounded-xl bg-[#802924]/10 hover:bg-[#802924] text-[#802924] hover:text-[#F9DDBB] flex items-center justify-center text-xs transition cursor-pointer shadow-2xs"
      title="Hapus Kategori"
    >
      <FaTrashCan className="w-3.5 h-3.5" />
    </button>
  );
}