// =====================================================================
// YUGYO - Artisanal Baking & Pâtisserie Atelier Landing Page
// File: src/app/page.jsx
// Palette: Burgundy (#4B1D3F), Nude (#E8D9C1), Rose Smoke (#D8A7B1), Off Black (#1B1B1B)
// =====================================================================

import Link from 'next/link';

export default function YugyoLandingPage() {
  const curriculumCards = [
    {
      title: 'Sourdough Mastery',
      desc: 'Metode levain hidup & open crumb pori sempurna.',
      cta: '6 Modul Lengkap →',
      href: '/courses',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16c0-4.418 3.582-8 8-8s8 3.582 8 8H4zm4-6v3m4-4v4m4-3v3" />
        </svg>
      ),
    },
    {
      title: 'Viennoiserie Pure',
      desc: 'Croissant bertingkat, pain au chocolat berongga madu.',
      cta: 'Lamination Guide →',
      href: '/courses',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6c-3.866 0-7 2.239-7 5 0 1.657 1.119 3.128 2.845 4.036L7 18h10l-.845-2.964C17.881 14.128 19 12.657 19 11c0-2.761-3.134-5-7-5z" />
        </svg>
      ),
    },
    {
      title: 'Choux & Éclairs',
      desc: 'Penguasaan tekstur craquelin krispi & crème pâtissière sutra.',
      cta: 'Suhu & Kelembaban →',
      href: '/courses',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 17h14M6 17v-3a6 6 0 0112 0v3M9 7h6" />
        </svg>
      ),
    },
    {
      title: 'Sertifikat Digital',
      desc: 'Akreditasi resmi YUGYO Atelier dengan portofolio kurasi.',
      cta: 'Internasional →',
      href: '/courses',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-nude)] text-[var(--color-off-black)] selection:bg-[var(--color-burgundy)] selection:text-[var(--color-nude)]">
      
      {/* ================= HERO BANNER DENGAN OVERLAY BADGES ================= */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="relative w-full h-[300px] sm:h-[380px] md:h-[430px] rounded-3xl overflow-hidden shadow-xl border border-[var(--color-rose-smoke)]/50 bg-[#d5c3aa]">
          
          {/* Foto Utama Artisan Bakery */}
          <img
            src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=85"
            alt="YUGYO Artisan Sourdough & French Croissant"
            className="w-full h-full object-cover object-center"
          />

          {/* Gradasi Lembut Bagian Bawah agar Transisi ke Background Nude Menyatu */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-off-black)]/15 via-transparent to-[var(--color-nude)]/95" />

          {/* Baris Atas: Brand Pill Kiri & Accredited Pill Kanan */}
          <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-6 flex flex-wrap items-center justify-between gap-2">
            {/* Brand Badge: YUGYO ATELIER */}
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 bg-[var(--color-nude)]/95 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-[var(--color-rose-smoke)]/60 transition hover:scale-[1.02]"
            >
              <span className="w-4 h-[1.5px] bg-[var(--color-burgundy)] inline-block" />
              <span className="font-editorial font-bold text-xs sm:text-sm tracking-tight text-[var(--color-burgundy)]">
                YUGYO
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-off-black)]/70">
                ATELIER
              </span>
            </Link>

            {/* Right Badge: Accredited + Quick Login */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-[var(--color-burgundy)] text-[var(--color-nude)] px-3.5 py-2 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase shadow-md">
                <span>🏅</span> ACCREDITED 2026
              </span>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 bg-[var(--color-nude)]/95 hover:bg-white text-[var(--color-burgundy)] px-4 py-2 rounded-full text-xs font-bold shadow-md border border-[var(--color-rose-smoke)] transition"
              >
                Masuk
              </Link>
            </div>
          </div>

          {/* Baris Bawah Kiri: Floating Instructor Avatar Pill */}
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-auto">
            <div className="inline-flex items-center gap-3 bg-[var(--color-nude)]/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-[var(--color-rose-smoke)]/60 max-w-full">
              <div className="flex -space-x-1.5 shrink-0">
                <span className="w-6 h-6 rounded-full bg-[var(--color-burgundy)] text-[var(--color-nude)] text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[var(--color-nude)]">
                  FR
                </span>
                <span className="w-6 h-6 rounded-full bg-[var(--color-rose-smoke)] text-[var(--color-off-black)] text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[var(--color-nude)]">
                  CH
                </span>
                <span className="w-6 h-6 rounded-full bg-[var(--color-off-black)] text-[var(--color-nude)] text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[var(--color-nude)]">
                  ID
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-[var(--color-off-black)] truncate">
                12+ Master Bakers &amp; Pâtissier membimbing Anda
              </p>
            </div>
          </div>

        </div>
      </header>

      {/* ================= KONTEN UTAMA ================= */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16">
        
        {/* SECTION HEADER (THE CULINARY ARTS OF BAKING) */}
        <section className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="w-6 sm:w-8 h-[1px] bg-[var(--color-burgundy)]/50" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[var(--color-burgundy)]">
              THE CULINARY ARTS OF BAKING
            </span>
            <span className="w-6 sm:w-8 h-[1px] bg-[var(--color-burgundy)]/50" />
          </div>

          <h1 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--color-off-black)] tracking-tight leading-snug mb-3.5">
            Master the Art of French Pastry &amp; Artisanal Baking
          </h1>

          <p className="text-xs sm:text-sm text-[var(--color-off-black)]/80 leading-relaxed">
            Pelajari teknik adonan autentik, fermentasi ragi liar, hingga kilau lamination langsung dari master baker YUGYO. Langkah demi langkah, dari dapur rumah menuju level pâtisserie profesional.
          </p>
        </section>

        {/* GRID 2x2 KARTU MODUL & KEUNGGULAN */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">
          {curriculumCards.map((item, idx) => (
            <div
              key={idx}
              className="group bg-[#F5ECE0] hover:bg-[#FAF4EC] rounded-2xl p-5 sm:p-6 border border-[var(--color-rose-smoke)]/55 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-[var(--color-rose-smoke)]/45 text-[var(--color-burgundy)] flex items-center justify-center mb-4 group-hover:bg-[var(--color-burgundy)] group-hover:text-[var(--color-nude)] transition-colors">
                  {item.icon}
                </div>

                <h2 className="font-editorial text-base sm:text-lg font-bold text-[var(--color-off-black)] mb-1.5">
                  {item.title}
                </h2>

                <p className="text-xs text-[var(--color-off-black)]/75 leading-relaxed mb-4">
                  {item.desc}
                </p>
              </div>

              <div>
                <Link
                  href={item.href}
                  className="inline-flex items-center text-[11px] sm:text-xs font-bold text-[var(--color-burgundy)] group-hover:translate-x-1 transition-transform"
                >
                  {item.cta}
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* BANNER HORIZONTAL: INTERACTIVE KITCHEN TIMERS */}
        <section className="bg-[#F5ECE0] rounded-2xl p-4 sm:p-5 border border-[var(--color-rose-smoke)]/55 shadow-sm mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--color-burgundy)] text-[var(--color-nude)] flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--color-off-black)]">
                Interactive Kitchen Timers
              </h3>
              <p className="text-[11px] sm:text-xs text-[var(--color-off-black)]/75 mt-0.5">
                Sinkronisasi langkah fermentasi &amp; waktu pemanggangan real-time saat praktik.
              </p>
            </div>
          </div>

          <div className="text-[var(--color-burgundy)] shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </section>

        {/* KARTU TESTIMONI ALUMNI */}
        <section className="bg-[#F5ECE0] rounded-2xl p-5 sm:p-6 border border-[var(--color-rose-smoke)]/55 shadow-sm mb-7 relative">
          <span
            aria-hidden="true"
            className="font-editorial text-4xl text-[var(--color-rose-smoke)] absolute top-4 right-6 select-none leading-none"
          >
            ”
          </span>

          <blockquote className="font-editorial italic text-xs sm:text-sm text-[var(--color-off-black)]/90 leading-relaxed pr-8 mb-4">
            “YUGYO mengubah cara saya memahami reaksi Maillard dan hidrasi tepung. Sekarang baguette &amp; brioche buatan saya memiliki rongga layaknya boulangerie di Paris.”
          </blockquote>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--color-burgundy)] text-[var(--color-nude)] font-bold text-xs flex items-center justify-center shrink-0">
              MR
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--color-off-black)]">Madeleine Renard</p>
              <p className="text-[11px] text-[var(--color-off-black)]/65">
                Alumni Pâtisserie Artisan • Angkatan 2026
              </p>
            </div>
          </div>
        </section>

        {/* TOMBOL AKSI UTAMA FULL-WIDTH (STACKED BUTTONS) */}
        <section className="space-y-3">
          <Link
            href="/login"
            className="w-full bg-[var(--color-burgundy)] hover:bg-[var(--color-burgundy-hover)] text-[var(--color-nude)] font-bold text-xs sm:text-sm py-3.5 sm:py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span>Mulai Belajar Sekarang</span>
            <span>→</span>
          </Link>

          <Link
            href="/courses"
            className="w-full bg-[var(--color-rose-smoke)]/40 hover:bg-[var(--color-rose-smoke)]/60 text-[var(--color-off-black)] font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl border border-[var(--color-rose-smoke)] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-[var(--color-burgundy)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
            </svg>
            <span>Jelajahi sebagai Tamu (Guest)</span>
          </Link>
        </section>

      </main>

      {/* ================= FOOTER MINIMAL ================= */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 text-center">
        <p className="text-[11px] text-[var(--color-off-black)]/60">
          Akses kurikulum gratis 7 hari tanpa komitmen kartu kredit • YUGYO Baking Atelier © 2026
        </p>
      </footer>

    </div>
  );
}