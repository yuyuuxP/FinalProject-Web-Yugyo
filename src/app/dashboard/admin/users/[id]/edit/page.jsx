import Link from 'next/link';
import pool from '@/lib/db';

export default async function EditUserPage({ params }) {
  const { id } = await params;
  
  let user = null;
  let categories = [];

  try {
    // Ambil data user berdasarkan ID
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1;', [id]);
    user = userRes.rows[0];

    // Ambil daftar kategori untuk dropdown spesialisasi
    const catRes = await pool.query('SELECT id, name FROM categories ORDER BY name ASC;');
    categories = catRes.rows;
  } catch (err) {
    console.error('Error fetching data for edit user:', err);
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[#802924] font-bold">Pengguna tidak ditemukan.</p>
        <Link href="/dashboard/admin/users" className="text-xs underline mt-2 inline-block">Kembali ke Users Management</Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
              DIREKTORI ATELIER • UBAH PENGGUNA
            </span>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Edit Akun: {user.full_name}
            </h2>
          </div>

          <Link
            href="/dashboard/admin/users"
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center text-xs font-bold transition shadow-xs"
          >
            ✕
          </Link>
        </div>

        {/* BODY FORM EDIT */}
        <form 
          action={`/api/admin/users/${user.id}`} 
          method="POST" 
          className="p-6 sm:p-8 space-y-5 bg-[#FFFDF9]"
        >
          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Nama Lengkap & Gelar
            </label>
            <input
              type="text"
              name="full_name"
              defaultValue={user.full_name}
              required
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
            />
          </div>

          {/* Email (Di-freeze / ReadOnly dengan value agar bebas error hidrasi/controlled) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]/75">
              Alamat Email (Terkunci)
            </label>
            <input
              type="email"
              name="email"
              value={user.email || ''}
              readOnly
              className="w-full bg-[#341D17]/5 border border-[#341D17]/15 rounded-2xl px-4 py-3 text-xs font-bold text-[#341D17]/60 cursor-not-allowed select-none focus:outline-none"
            />
          </div>

          {/* Kolom Kata Sandi Baru telah dihilangkan sepenuhnya */}

          {/* Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Peran (Role)
              </label>
              <select
                name="role"
                defaultValue={user.role || 'student'}
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              >
                <option value="student">Siswa (Student)</option>
                <option value="teacher">Instruktur (Teacher)</option>
                <option value="admin">Admin Atelier</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Status Akun
              </label>
              <select
                name="status"
                defaultValue={user.status || 'active'}
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              >
                <option value="active">Aktif (Active / Approved)</option>
                <option value="pending">Pending (Menunggu Verifikasi)</option>
              </select>
            </div>
          </div>

          {/* Spesialisasi Keahlian */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Spesialisasi Keahlian (Kategori Atelier)
            </label>
            <select
              name="specialty"
              defaultValue={user.specialty || ''}
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
            >
              <option value="">Pilih Kategori Keahlian...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center cursor-pointer"
            >
              <span>Simpan Perubahan Pengguna</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}