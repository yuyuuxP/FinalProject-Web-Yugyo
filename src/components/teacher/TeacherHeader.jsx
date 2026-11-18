import Link from 'next/link';

export default function TeacherHeader({ teacher }) {
  const getInitials = (name) => {
    if (!name) return 'CD';
    const parts = name.replace('Chef ', '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const fullName = teacher?.full_name || 'Chef Pengajar';
  const initials = getInitials(fullName);

  return (
    <header className="h-16 bg-[#FFFDF9] border-b border-[#341D17]/10 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <span className="bg-[#82882B]/15 text-[#82882B] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
          Atelier Studio 02 • Aktif
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/courses"
          className="bg-[#F9DDBB] hover:bg-[#f3ce9b] text-[#802924] px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs"
        >
          👁️ Lihat Katalog Guest
        </Link>
        <div className="w-9 h-9 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-bold text-xs shadow-xs">
          {initials}
        </div>
      </div>
    </header>
  );
}