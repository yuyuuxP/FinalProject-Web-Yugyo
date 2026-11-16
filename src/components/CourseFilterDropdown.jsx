'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CourseFilterDropdown({ categories, selectedCat, currentTab, searchQuery, totalCount }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const currentCategoryName =
    selectedCat === 'all'
      ? `Semua ${totalCount}`
      : categories.find((c) => String(c.id) === String(selectedCat))?.name || 'Kategori';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (catId) => {
    setIsOpen(false);
    const params = new URLSearchParams();
    if (currentTab && currentTab !== 'semua') params.set('tab', currentTab);
    if (catId !== 'all') params.set('cat', catId);
    if (searchQuery) params.set('q', searchQuery);
    router.push(`/dashboard/admin/courses?${params.toString()}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
          selectedCat !== 'all'
            ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
            : 'bg-[#802924] text-[#F9DDBB] shadow-xs hover:bg-[#661F1B]'
        }`}
      >
        <span>{currentCategoryName}</span>
        <span className="text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl shadow-xl z-30 py-2 space-y-1">
          <button
            type="button"
            onClick={() => handleSelect('all')}
            className={`w-full text-left px-4 py-2 text-xs font-bold transition ${
              selectedCat === 'all' ? 'bg-[#F9DDBB]/60 text-[#802924]' : 'text-[#341D17] hover:bg-[#F9DDBB]/30'
            }`}
          >
            Semua Kategori ({totalCount})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelect(cat.id)}
              className={`w-full text-left px-4 py-2 text-xs font-medium transition ${
                String(selectedCat) === String(cat.id)
                  ? 'bg-[#F9DDBB]/60 text-[#802924] font-bold'
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