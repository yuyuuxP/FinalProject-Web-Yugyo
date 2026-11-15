import Link from 'next/link';

export default function StudentRegisterPage() {
  return (
    <div className="min-h-screen bg-[var(--color-light-silver)] flex items-center justify-center px-4 py-12">
      
      {/* KARTU UTAMA (Split Layout) */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-[var(--color-pastel-blue)]/40">
        
        {/* SISI KIRI: Ilustrasi & Branding */}
        <div className="md:col-span-6 bg-gradient-to-br from-[var(--color-pastel-blue)]/30 to-[var(--color-light-silver)] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[var(--color-pastel-blue)]/40 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-prussian)] flex items-center justify-center text-white font-bold text-sm shadow">
                Y
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--color-prussian)]">
                YUGYO
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-prussian)] leading-tight mb-2">
              Join as a Student
            </h2>
            <p className="text-xs md:text-sm text-[var(--color-teal-blue)] font-medium">
              Mulai perjalanan belajarmu bersama ribuan modul interaktif di Yugyo.
            </p>
          </div>

          {/* Representasi Visual */}
          <div className="my-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-[220px] h-36 bg-white/80 backdrop-blur rounded-2xl shadow-inner border border-[var(--color-pastel-blue)] flex flex-col items-center justify-center p-4">
              <div className="w-12 h-16 bg-[var(--color-mughal)] rounded-md flex items-center justify-center text-white font-bold text-xs shadow mb-2 border-b-2 border-[var(--color-teal-blue)]">
                STUDY
              </div>
              <div className="w-24 h-2 bg-[var(--color-prussian)] rounded-full mb-1"></div>
              <div className="w-20 h-2 bg-[var(--color-teal-blue)] rounded-full"></div>
            </div>
          </div>

          <div className="text-[11px] text-[var(--color-teal-blue)] font-medium">
            Sudah mendaftar sebagai pengajar?{' '}
            <Link href="/register/instructor" className="text-[var(--color-prussian)] font-bold hover:underline">
              Daftar Instruktur
            </Link>
          </div>
        </div>

        {/* SISI KANAN: Formulir Register Siswa */}
        <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-white">
          
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-bold tracking-wider text-[var(--color-prussian)] uppercase mb-1">
              STUDENT REGISTER
            </h3>
            <p className="text-xs text-[var(--color-teal-blue)]">Buat akun siswa baru kamu</p>
          </div>

          <form className="space-y-4">
            
            {/* Input Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-prussian)] mb-1">
                Full Name
              </label>
              <input 
                type="text" 
                placeholder="Nurhayu Fiantika" 
                className="w-full bg-[var(--color-light-silver)]/50 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)] transition"
                required
              />
            </div>

            {/* Input Email */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-prussian)] mb-1">
                Email Address
              </label>
              <input 
                type="email" 
                placeholder="yuyu@gmail.com" 
                className="w-full bg-[var(--color-light-silver)]/50 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)] transition"
                required
              />
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-prussian)] mb-1">
                Password
              </label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-[var(--color-light-silver)]/50 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)] transition"
                required
              />
            </div>

            {/* Tombol Register */}
            <button 
              type="submit"
              className="w-full bg-[var(--color-mughal)] hover:bg-[#2b5421] text-white font-semibold text-sm py-3 rounded-xl shadow-md transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2"
            >
              REGISTER STUDENT →
            </button>

          </form>

          {/* Opsi Kembali ke Login */}
          <div className="mt-6 text-center text-xs text-[var(--color-teal-blue)]">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-[var(--color-prussian)] font-bold hover:underline">
              Login di sini
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}