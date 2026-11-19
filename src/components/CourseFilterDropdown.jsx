'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CourseFilterDropdown({
  categories = [],
  selectedCat = 'all',
  currentTab = 'semua',
  searchQuery = '',
  totalCount = 0,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const buildUrl = ({ nextTab, nextCat }) => {
    const params = new URLSearchParams();
    const tabValue = nextTab ?? currentTab;
    const catValue = nextCat ?? selectedCat;

    if (tabValue && tabValue !== 'semua') {
      params.set('tab', tabValue);
    }
    if (catValue && catValue !== 'all') {
      params.set('cat', String(catValue));
    }
    if (searchQuery) {
      params.set('q', searchQuery);
    }

    const qs = params.toString();
    return qs ? `/dashboard/admin/courses?${qs}` : '/dashboard/admin/courses';
  };

  const handleSelectAllStatuses = () => {
    setOpen(false);
    router.push(buildUrl({ nextTab: 'semua' }));
  };

  const handleSelectCategory = (catId) => {
    setOpen(false);
    router.push(buildUrl({ nextCat: catId }));
  };

  const isAllTab = !currentTab || currentTab === 'semua';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
          isAllTab
            ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
            : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
        }`}
      >
        <span>Semua</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            isAllTab ? 'bg-[#FFFDF9] text-[#802924]' : 'bg-[#F9DDBB] text-[#802924]'
          }`}
        >
          {totalCount}
        </span>
        <span className="text-[10px] ml-0.5">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-60 bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl shadow-xl py-2 z-30 space-y-1">
          <button
            type="button"
            onClick={handleSelectAllStatuses}
            className={`w-full text-left px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center justify-between ${
              isAllTab ? 'bg-[#F9DDBB]/60 text-[#802924]' : 'text-[#341D17] hover:bg-[#F9DDBB]/30'
            }`}
          >
            <span>Semua Status ({totalCount})</span>
            {isAllTab && <span>✓</span>}
          </button>

          <div className="border-t border-[#341D17]/10 my-1" />

          <button
            type="button"
            onClick={() => handleSelectCategory('all')}
            className={`w-full text-left px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              selectedCat === 'all' ? 'text-[#802924] font-bold bg-[#F9DDBB]/30' : 'text-[#341D17] hover:bg-[#F9DDBB]/30'
            }`}
          >
            Semua Kategori
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`w-full text-left px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                String(selectedCat) === String(cat.id)
                  ? 'text-[#802924] font-bold bg-[#F9DDBB]/30'
                  : 'text-[#341D17] hover:bg-[#F9DDBB]/30'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}