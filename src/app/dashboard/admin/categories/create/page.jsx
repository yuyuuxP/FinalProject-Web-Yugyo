import Link from 'next/link';

export default function CreateCategoryPage() {
  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
              🥐 ATELIER TAXONOMY • TAMBAH
            </span>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Buat Kategori Baru
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

        {/* BODY FORM (Menggunakan encType multipart/form-data) */}
        <form 
          action="/api/admin/categories" 
          method="POST" 
          encType="multipart/form-data"
          className="p-6 sm:p-8 space-y-5 bg-[#FFFDF9]"
        >
          {/* Nama Kategori */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Nama Kategori
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: French Viennoiserie"
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
            />
          </div>

          {/* Upload Foto Profil Kategori */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Foto Profil / Ikon Kategori
            </label>
            <input
              type="file"
              name="image_file"
              accept="image/*"
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-3 py-2 text-xs text-[#341D17] file:mr-3 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#802924] file:text-[#F9DDBB] hover:file:bg-[#661F1B] transition shadow-2xs cursor-pointer"
            />
          </div>

          {/* Deskripsi Taksonomi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Deskripsi Taksonomi
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Tuliskan penjelasan singkat mengenai taksonomi kategori ini..."
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>＋</span>
              <span>Simpan Kategori Baru</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}