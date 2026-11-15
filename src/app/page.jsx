import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-light-silver)] flex flex-col justify-between">
      
      {/* NAVBAR / HEADER */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-prussian)] flex items-center justify-center text-white font-bold shadow-md">
            Y
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--color-prussian)]">
            YUGYO
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[var(--color-teal-blue)]">
          <Link href="/" className="hover:text-[var(--color-prussian)] transition">HOME</Link>
          <Link href="/courses" className="hover:text-[var(--color-prussian)] transition">COURSES</Link>
          <Link href="/about" className="hover:text-[var(--color-prussian)] transition">ABOUT</Link>
          <Link href="/contact" className="hover:text-[var(--color-prussian)] transition">CONTACT</Link>
        </nav>

        {/* TOMBOL AKSI: LOGIN & SIGN UP */}
        <div className="flex items-center gap-3">
          <Link 
            href="/login"
            className="text-[var(--color-prussian)] hover:text-[var(--color-teal-blue)] text-sm font-semibold px-4 py-2 transition"
          >
            Login
          </Link>
          <Link 
            href="/register/student"
            className="bg-[var(--color-mughal)] hover:bg-[#2b5421] text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-md transition transform hover:-translate-y-0.5"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 p-8 md:p-12 relative border border-[var(--color-pastel-blue)]/30">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-pastel-blue)]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="md:col-span-7 flex flex-col justify-center z-10 pr-0 md:pr-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-teal-blue)] mb-3">
              ✨ Online Education
            </span>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-prussian)] leading-tight mb-6">
              Start learning <br />
              <span className="text-[var(--color-mughal)]">at home</span>
            </h1>

            <div className="relative w-full max-w-md mb-8">
              <input 
                type="text" 
                placeholder="What are you looking for?"
                className="w-full bg-[var(--color-light-silver)]/60 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] text-sm rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)] shadow-inner"
              />
              <button className="absolute right-1.5 top-1.5 bg-[var(--color-mughal)] text-white w-10 h-10 rounded-full flex items-center justify-center shadow hover:bg-[#2b5421] transition font-bold">
                →
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--color-mughal)]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-pastel-blue)]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-pastel-blue)]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-pastel-blue)]"></span>
            </div>
          </div>

          <div className="md:col-span-5 flex items-center justify-center mt-10 md:mt-0 z-10">
            <div className="relative w-full h-64 md:h-72 bg-gradient-to-br from-[var(--color-pastel-blue)]/30 to-[var(--color-light-silver)] rounded-2xl flex flex-col items-center justify-center p-6 border border-[var(--color-pastel-blue)]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-16 bg-[var(--color-prussian)] rounded-lg shadow-md flex items-center justify-center text-white font-bold text-xs border-b-4 border-[var(--color-teal-blue)]">
                  YUGYO LMS
                </div>
                <div className="w-32 h-4 bg-[var(--color-mughal)] rounded-full shadow"></div>
                <div className="w-28 h-4 bg-[var(--color-teal-blue)] rounded-full shadow"></div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs font-semibold text-[var(--color-prussian)]">Ribuan Modul Belajar Interaktif</p>
                <p className="text-[10px] text-[var(--color-teal-blue)]">Tersedia untuk semua jenjang akademik</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="w-full text-center py-6 text-xs text-[var(--color-teal-blue)] font-medium">
        Designed for Yugyo Platform • Powered by Next.js & Tailwind CSS
      </footer>

    </div>
  );
}