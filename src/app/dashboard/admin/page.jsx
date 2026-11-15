// =====================================================================
// YUGYO - Admin Dashboard (Redesigned matching UI reference)
// File: src/app/dashboard/admin/page.jsx
// =====================================================================

import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--color-light-silver)] flex">
      
      {/* SIDEBAR UTAMA (Menggunakan warna khas Prussian/Mughal sesuai identitas Yugyo) */}
      <aside className="w-64 bg-[var(--color-prussian)] text-white p-6 flex flex-col justify-between hidden md:flex shadow-xl">
        <div>
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-9 h-9 rounded-2xl bg-[var(--color-mughal)] flex items-center justify-center text-white font-extrabold text-base shadow-md">
              Y
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wider">YUGYO</h1>
              <p className="text-[10px] text-[var(--color-pastel-blue)] uppercase tracking-widest">E-Learning</p>
            </div>
          </div>

          {/* Navigasi Sidebar */}
          <nav className="space-y-1.5 text-xs font-semibold">
            <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--color-teal-blue)]/30 text-white shadow-sm transition">
              <span>🗂️</span> Dashboard
            </Link>
            <Link href="/dashboard/admin/courses" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>📚</span> Courses
            </Link>
            <Link href="/dashboard/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>👥</span> Students & Instructors
            </Link>
            <Link href="/dashboard/admin/reports" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>💳</span> Transactions
            </Link>
            <Link href="/dashboard/admin/categories" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>💬</span> Chat & Support
            </Link>
            <Link href="/dashboard/admin/schedule" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>📅</span> Schedule
            </Link>
            <Link href="/dashboard/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>⚙️</span> Settings
            </Link>
          </nav>
        </div>

        {/* Footer Sidebar / Logout */}
        <div className="pt-4 border-t border-white/10 px-2">
          <Link href="/login" className="text-xs font-semibold text-rose-300 hover:text-white flex items-center gap-2 transition">
            <span>🚪</span> Keluar Sesi
          </Link>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* HEADER ATAS (Search Bar & Profil Admin) */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-4 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30">
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-[var(--color-light-silver)]/60 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] text-xs rounded-2xl py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
            />
            <button className="absolute right-2 top-2 w-6 h-6 bg-[var(--color-mughal)] text-white rounded-xl flex items-center justify-center text-xs">
              🔍
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-light-silver)] flex items-center justify-center text-xs shadow-inner">
              🔔
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-[var(--color-pastel-blue)]/40">
              <div className="w-9 h-9 rounded-full bg-[var(--color-mughal)] text-white font-bold flex items-center justify-center text-xs">
                KA
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--color-prussian)]">Kanjeng AYU</p>
                <p className="text-[10px] text-[var(--color-teal-blue)]">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* KARTU STATISTIK ATAS (4 Kolom) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-pastel-blue)]/30 text-[var(--color-prussian)] flex items-center justify-center text-lg font-bold">
              🎓
            </div>
            <div>
              <p className="text-xl font-extrabold text-[var(--color-prussian)]">22K</p>
              <p className="text-[11px] text-[var(--color-teal-blue)] font-medium">Total Students</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
              📚
            </div>
            <div>
              <p className="text-xl font-extrabold text-[var(--color-prussian)]">1520</p>
              <p className="text-[11px] text-[var(--color-teal-blue)] font-medium">Courses</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg font-bold">
              🎥
            </div>
            <div>
              <p className="text-xl font-extrabold text-[var(--color-prussian)]">6000</p>
              <p className="text-[11px] text-[var(--color-teal-blue)] font-medium">Total Video</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold">
              💰
            </div>
            <div>
              <p className="text-xl font-extrabold text-[var(--color-prussian)]">$70500</p>
              <p className="text-[11px] text-[var(--color-teal-blue)] font-medium">Total Earning</p>
            </div>
          </div>
        </div>

        {/* BAGIAN TENGAH: User Activity & Top Course */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* User Activity (Grafik / Tren) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-[var(--color-prussian)] uppercase tracking-wider">
                User Activity
              </h3>
              <div className="flex items-center gap-2 bg-[var(--color-light-silver)] px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--color-prussian)]">
                <span>May 2026</span>
                <span>📅</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-[var(--color-teal-blue)] uppercase">This Month</p>
              <p className="text-2xl font-extrabold text-[var(--color-prussian)]">220,342,123</p>
            </div>

            {/* Representasi Visual Grafik Kurva */}
            <div className="h-36 w-full bg-gradient-to-t from-[var(--color-pastel-blue)]/10 to-transparent rounded-2xl flex items-end px-2 pb-2 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--color-teal-blue)] font-medium opacity-40">
                [ Grafik Interaktif Aktivitas Pengguna ]
              </div>
            </div>
          </div>

          {/* Top Course */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-[var(--color-prussian)] uppercase tracking-wider">
                Top Course
              </h3>
              <Link href="/dashboard/admin/courses" className="text-xs font-bold text-[var(--color-teal-blue)] hover:underline">
                See All
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-mughal)] text-white flex items-center justify-center font-bold text-xs">
                    GD
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-prussian)] line-clamp-1">Complete Graphic Design</p>
                    <p className="text-[10px] text-[var(--color-teal-blue)]">1247 Sale</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-[var(--color-prussian)]">$2500</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-prussian)] text-white flex items-center justify-center font-bold text-xs">
                    AI
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-prussian)] line-clamp-1">Artificial Intelligence</p>
                    <p className="text-[10px] text-[var(--color-teal-blue)]">203 Sale</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-[var(--color-prussian)]">$1450</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                    EN
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-prussian)] line-clamp-1">Advance Spoken English</p>
                    <p className="text-[10px] text-[var(--color-teal-blue)]">3269 Sale</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-[var(--color-prussian)]">$5240</span>
              </div>
            </div>
          </div>

        </div>

        {/* BAGIAN BAWAH: Transactions, Top Engagement, & Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Transactions */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-[var(--color-prussian)] uppercase tracking-wider">
                Transactions
              </h3>
              <span className="text-xs font-bold text-[var(--color-teal-blue)] cursor-pointer hover:underline">View All</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    💰
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-prussian)]">Receive $150</p>
                    <p className="text-[10px] text-[var(--color-teal-blue)]">From : Amily Paul</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[var(--color-teal-blue)]">06:34 PM</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    💰
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-prussian)]">Receive $87</p>
                    <p className="text-[10px] text-[var(--color-teal-blue)]">From : Jhon Robert</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[var(--color-teal-blue)]">11:47 AM</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    💰
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-prussian)]">Receive $132</p>
                    <p className="text-[10px] text-[var(--color-teal-blue)]">From : Tisa</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[var(--color-teal-blue)]">07:10 PM</span>
              </div>
            </div>
          </div>

          {/* Top Engagement (Peta) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-prussian)] uppercase tracking-wider mb-4">
                Top Engagement
              </h3>
              <div className="h-28 bg-[var(--color-light-silver)] rounded-2xl flex items-center justify-center text-xs text-[var(--color-teal-blue)] font-medium mb-4">
                🗺️ [ Peta Persebaran Global ]
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--color-teal-blue)] font-medium">
              <div>🇨🇦 Canada 63%</div>
              <div>🇺🇸 California 47%</div>
              <div>🇧🇷 Brazil 21%</div>
              <div>🇮🇳 India 11%</div>
            </div>
          </div>

          {/* Schedule / Kalender */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--color-prussian)] uppercase tracking-wider">
                Schedule
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-mughal)]">
                <button className="w-5 h-5 rounded-full bg-[var(--color-light-silver)] flex items-center justify-center">&lt;</button>
                <span className="mx-1 text-[var(--color-prussian)]">September 2026</span>
                <button className="w-5 h-5 rounded-full bg-[var(--color-light-silver)] flex items-center justify-center">&gt;</button>
              </div>
            </div>

            {/* Grid Kalender Sederhana */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--color-teal-blue)] font-bold mb-2">
              <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[var(--color-prussian)] font-medium">
              <span className="py-1 text-gray-300">29</span>
              <span className="py-1 text-gray-300">30</span>
              <span className="py-1">1</span>
              <span className="py-1">2</span>
              <span className="py-1">3</span>
              <span className="py-1">4</span>
              <span className="py-1">5</span>
              <span className="py-1">6</span>
              <span className="py-1">7</span>
              <span className="py-1">8</span>
              <span className="py-1">9</span>
              <span className="py-1">10</span>
              <span className="py-1">11</span>
              <span className="py-1 bg-[var(--color-mughal)] text-white rounded-full font-bold">12</span>
              <span className="py-1">13</span>
              <span className="py-1">14</span>
              <span className="py-1">15</span>
              <span className="py-1">16</span>
              <span className="py-1">17</span>
              <span className="py-1">18</span>
              <span className="py-1">19</span>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}