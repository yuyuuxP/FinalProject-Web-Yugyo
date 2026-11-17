'use client';

import { useState } from 'react';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function ScheduleCalendar() {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(10); // 10 = November (2026)
  const [selectedDate, setSelectedDate] = useState(19); // Default tanggal 19

  const year = 2026;
  const monthName = MONTHS[currentMonthIndex];

  // Helper untuk mendapatkan jumlah hari dalam bulan tertentu pada tahun 2026
  const getDaysInMonth = (monthIdx, yr) => {
    return new Date(yr, monthIdx + 1, 0).getDate();
  };

  const totalDays = getDaysInMonth(currentMonthIndex, year);

  // Buat array tanggal dalam bulan tersebut
  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    const dateNum = i + 1;
    const dayOfWeekIndex = new Date(year, currentMonthIndex, dateNum).getDay();
    // Konversi getDay() (0=Minggu, 1=Senin, ...) ke format singkat Indonesia
    const daysMap = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
    return {
      date: dateNum,
      day: daysMap[dayOfWeekIndex],
    };
  });

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
      setSelectedDate(1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < 11) {
      setCurrentMonthIndex(currentMonthIndex + 1);
      setSelectedDate(1);
    }
  };

  return (
    <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-2xs space-y-4">
      {/* HEADER BULAN & TOMBOL NAVIGASI */}
      <div className="flex items-center justify-between">
        <h3 className="font-editorial text-base font-bold text-[#341D17] flex items-center gap-2">
          <span>📅</span> {monthName} {year}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={currentMonthIndex === 0}
            className="w-7 h-7 rounded-xl bg-[#F9DDBB]/40 hover:bg-[#F9DDBB] text-[#341D17] flex items-center justify-center text-xs transition cursor-pointer disabled:opacity-30"
            title="Bulan Sebelumnya"
          >
            ‹
          </button>
          <span className="text-[11px] font-bold text-[#341D17]/70 px-1">
            {currentMonthIndex + 1} / 12
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            disabled={currentMonthIndex === 11}
            className="w-7 h-7 rounded-xl bg-[#F9DDBB]/40 hover:bg-[#F9DDBB] text-[#341D17] flex items-center justify-center text-xs transition cursor-pointer disabled:opacity-30"
            title="Bulan Selanjutnya"
          >
            ›
          </button>
        </div>
      </div>

      {/* GRID TANGGAL BISA DIGESER (HORIZONTAL SCROLL) & DIPILIH */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {daysArray.map((item) => {
          const isSelected = selectedDate === item.date;
          return (
            <button
              key={item.date}
              type="button"
              onClick={() => setSelectedDate(item.date)}
              className={`min-w-[56px] p-3 rounded-2xl flex flex-col items-center justify-center transition shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#802924] text-[#F9DDBB] shadow-md scale-105'
                  : 'bg-[#F9DDBB]/20 hover:bg-[#F9DDBB]/40 text-[#341D17]'
              }`}
            >
              <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-75">
                {item.day}
              </span>
              <span className="font-editorial text-base font-bold mt-0.5">
                {item.date}
              </span>
              <span
                className={`w-1 h-1 rounded-full mt-1 ${
                  isSelected ? 'bg-[#F9DDBB]' : 'bg-[#802924]/40'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}