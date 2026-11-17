'use client';

export default function DeleteUserButton({ userId, userName }) {
  const handleDelete = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}" dari sistem?`)) {
      return;
    }

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
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      aria-label="Hapus Pengguna"
      className="w-8 h-8 rounded-xl bg-[#802924]/10 hover:bg-[#802924] text-[#802924] hover:text-[#F9DDBB] flex items-center justify-center text-xs transition cursor-pointer shadow-2xs"
      title="Hapus Pengguna"
    >
      🗑️
    </button>
  );
}