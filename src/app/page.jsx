import Link from 'next/link';
import { FaAward, FaArrowRight } from 'react-icons/fa6';

export default function YugyoLandingPage() {
  const curriculumCards = [
    {
      title: 'Sourdough Mastery',
      desc: 'Metode levain hidup & open crumb pori sempurna.',
      cta: '6 Modul Lengkap',
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
      cta: 'Lamination Guide',
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
      cta: 'Suhu & Kelembaban',
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
      cta: 'Internasional',
      href: '/courses',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9DDBB] text-[#341D17] selection:bg-[#802924] selection:text-[#F9DDBB]">
      {/* ================= HERO BANNER DENGAN OVERLAY BADGES ================= */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="relative w-full h-[300px] sm:h-[380px] md:h-[430px] rounded-3xl overflow-hidden shadow-xl border border-[#341D17]/20 bg-[#341D17]">
          {/* Foto Utama Artisan Bakery */}
          <img
            src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=85"
            alt="YUGYO Artisan Sourdough & French Croissant"
            className="w-full h-full object-cover object-center"
          />

          {/* Gradasi Lembut agar Transisi ke Background #F9DDBB Menyatu */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#341D17]/20 via-transparent to-[#F9DDBB]/95" />

          {/* Baris Atas: Brand Pill Kiri & Accredited Pill Kanan */}
          <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-6 flex flex-wrap items-center justify-between gap-2">
            {/* Brand Badge: YUGYO ATELIER */}
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 bg-[#FFFDF9]/95 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-[#341D17]/15 transition hover:scale-[1.02]"
            >
              <span className="w-4 h-[1.5px] bg-[#802924] inline-block" />
              <span className="font-editorial font-bold text-xs sm:text-sm tracking-tight text-[#341D17]">
                YUGYO
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#802924]">
                ATELIER
              </span>
            </Link>

            {/* Right Badge: Accredited (Pistachio #82882B) + Quick Login (#802924) */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#82882B] text-white px-3.5 py-2 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase shadow-md">
                <FaAward className="w-3.5 h-3.5 shrink-0" />
                <span>ACCREDITED 2026</span>
              </span>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] px-4 py-2 rounded-full text-xs font-bold shadow-md transition"
              >
                Masuk
              </Link>
            </div>
          </div>

          {/* Baris Bawah Kiri: Floating Instructor Avatar Pill */}
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-auto">
            <div className="inline-flex items-center gap-3 bg-[#FFFDF9]/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-[#341D17]/15 max-w-full">
              <div className="flex -space-x-1.5 shrink-0">
                <span className="w-6 h-6 rounded-full bg-[#341D17] text-[#F9DDBB] text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[#FFFDF9]">
                  FR
                </span>
                <span className="w-6 h-6 rounded-full bg-[#802924] text-[#F9DDBB] text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[#FFFDF9]">
                  CH
                </span>
                <span className="w-6 h-6 rounded-full bg-[#82882B] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[#FFFDF9]">
                  ID
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-[#341D17] truncate">
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
            <span className="w-6 sm:w-8 h-[1.5px] bg-[#802924]" />
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.22em] uppercase text-[#802924]">
              THE CULINARY ARTS OF BAKING
            </span>
            <span className="w-6 sm:w-8 h-[1.5px] bg-[#802924]" />
          </div>

          <h1 className="meddon-regular text-xl sm:text-3xl md:text-4xl font-normal text-[#341D17] leading-relaxed py-1 mb-3.5">
            Master the Art of French Pastry &amp; Artisanal Baking
          </h1>

          <p className="text-xs sm:text-sm text-[#341D17]/80 leading-relaxed">
            Pelajari teknik adonan autentik, fermentasi ragi liar, hingga kilau lamination langsung dari master baker YUGYO. Langkah demi langkah, dari dapur rumah menuju level pâtisserie profesional.
          </p>
        </section>

        {/* GRID 2x2 KARTU MODUL & KEUNGGULAN */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">
          {curriculumCards.map((item, idx) => (
            <div
              key={idx}
              className="group bg-[#FFFDF9] hover:bg-white rounded-2xl p-5 sm:p-6 border border-[#341D17]/15 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#F9DDBB] text-[#802924] flex items-center justify-center mb-4 group-hover:bg-[#802924] group-hover:text-[#F9DDBB] transition-colors">
                  {item.icon}
                </div>

                <h2 className="font-editorial text-base sm:text-lg font-bold text-[#341D17] mb-1.5">
                  {item.title}
                </h2>

                <p className="text-xs text-[#341D17]/75 leading-relaxed mb-4">
                  {item.desc}
                </p>
              </div>

              <div>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold text-[#82882B] group-hover:text-[#802924] group-hover:translate-x-1 transition-all"
                >
                  <span>{item.cta}</span>
                  <FaArrowRight className="w-3 h-3 shrink-0" />
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* BANNER HORIZONTAL: INTERACTIVE KITCHEN TIMERS */}
        <section className="bg-[#FFFDF9] rounded-2xl p-4 sm:p-5 border border-[#341D17]/15 shadow-sm mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#341D17]">
                Interactive Kitchen Timers
              </h3>
              <p className="text-[11px] sm:text-xs text-[#341D17]/75 mt-0.5">
                Sinkronisasi langkah fermentasi &amp; waktu pemanggangan real-time saat praktik.
              </p>
            </div>
          </div>

          <div className="text-[#82882B] shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </section>

        {/* KARTU TESTIMONI ALUMNI */}
        <section className="bg-[#FFFDF9] rounded-2xl p-5 sm:p-6 border border-[#341D17]/15 shadow-sm mb-7 relative">
          <span
            aria-hidden="true"
            className="font-editorial text-4xl text-[#82882B]/40 absolute top-4 right-6 select-none leading-none"
          >
            ”
          </span>

          <blockquote className="font-editorial italic text-xs sm:text-sm text-[#341D17]/90 leading-relaxed pr-8 mb-4">
            “YUGYO mengubah cara saya memahami reaksi Maillard dan hidrasi tepung. Sekarang baguette &amp; brioche buatan saya memiliki rongga layaknya boulangerie di Paris.”
          </blockquote>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#341D17] text-[#F9DDBB] font-bold text-xs flex items-center justify-center shrink-0">
              MR
            </div>
            <div>
              <p className="text-xs font-bold text-[#341D17]">Madeleine Renard</p>
              <p className="text-[11px] text-[#341D17]/70">
                Alumni Pâtisserie Artisan • Angkatan 2026
              </p>
            </div>
          </div>
        </section>

        {/* TOMBOL AKSI UTAMA FULL-WIDTH (STACKED BUTTONS) */}
        <section className="space-y-3">
          <Link
            href="/login"
            className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs sm:text-sm py-3.5 sm:py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span>Mulai Belajar Sekarang</span>
            <FaArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>

          <Link
            href="/courses"
            className="w-full bg-[#341D17] hover:bg-[#24130F] text-[#F9DDBB] font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-[#82882B]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
            </svg>
            <span>Jelajahi sebagai Tamu (Guest)</span>
          </Link>
        </section>
      </main>

      {/* ================= FOOTER MINIMAL ================= */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 text-center">
        <p className="text-[11px] font-medium text-[#341D17]/70">
          Akses kurikulum gratis 7 hari tanpa komitmen kartu kredit • YUGYO Baking Atelier © 2026
        </p>
      </footer>
    </div>
  );
}