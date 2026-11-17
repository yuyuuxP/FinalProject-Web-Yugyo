import Link from 'next/link';
import pool from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function EditCategoryPage({ params }) {
  const { id } = await params;

  let category = null;

  try {
    const res = await pool.query('SELECT * FROM categories WHERE id = $1;', [id]);
    if (res.rows.length === 0) {
      notFound();
    }
    category = res.rows[0];
  } catch (err) {
    console.error('Error fetching category for edit:', err);
    notFound();
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
              🥐 ATELIER TAXONOMY • EDIT
            </span>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Ubah Kategori: {category.name}
            </h2>
          </div>

          <Link
            href="/dashboard/admin/categories"
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center text-xs font-bold transition shadow-xs"
          >
            ✕
          </Link>
        </div>

        <form 
          action={`/api/admin/categories/${category.id}`} 
          method="POST" 
          className="p-6 sm:p-8 space-y-5 bg-[#FFFDF9]"
        >
          <input type="hidden" name="_method" value="PUT" />

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Nama Kategori
            </label>
            <input
              type="text"
              name="name"
              defaultValue={category.name}
              required
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Deskripsi Taksonomi
            </label>
            <textarea
              name="description"
              rows="4"
              defaultValue={category.description || ''}
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs resize-none"
            ></textarea>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>💾</span>
              <span>Simpan Perubahan Kategori</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}