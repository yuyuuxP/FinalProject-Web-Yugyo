'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function cleanUrlString(val) {
  const s = String(val ?? '').trim();
  return !s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined'
    ? ''
    : s;
}

function getItemVideoUrl(item) {
  return cleanUrlString(item?.video_url || item?.media_url || '');
}

function getItemDescription(item) {
  return String(item?.description ?? item?.summary ?? '');
}

function getItemOrder(item, fallbackIdx = 0) {
  const n = Number(item?.order_index ?? item?.sort_order);
  return Number.isFinite(n) && n > 0 ? n : fallbackIdx + 1;
}

function isVideoPath(url) {
  const clean = cleanUrlString(url);
  return Boolean(clean) && /\.(mp4|webm|mov|m4v|mkv)$/i.test(clean);
}

function toPlayableVideoSrc(url) {
  const clean = cleanUrlString(url);
  if (!clean) return '';
  return clean
    .split('/')
    .map((seg, idx) =>
      idx === 0 ? seg : encodeURIComponent(decodeURIComponent(seg))
    )
    .join('/');
}

async function updateExistingModuleInDb({ itemId, payload }) {
  const numericId = Number(itemId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return { savedToDb: false, record: payload };
  }

  try {
    const res = await fetch(`/api/teacher/contents/${numericId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success !== false) {
      return {
        savedToDb: true,
        record: data?.content || payload,
      };
    }
  } catch {
    // Fallback jika error jaringan
  }

  return { savedToDb: false, record: payload };
}

async function createNewModuleInDb({ payload }) {
  try {
    const res = await fetch('/api/teacher/contents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success !== false) {
      return {
        savedToDb: true,
        record: data?.content || payload,
      };
    }
  } catch {
    // Fallback jika error jaringan
  }

  return { savedToDb: false, record: payload };
}

async function deleteModuleInDb({ itemId }) {
  const numericId = Number(itemId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return false;
  }

  try {
    const res = await fetch(`/api/teacher/contents/${numericId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function ContentManagementClient({
  teacher,
  courses = [],
  selectedCourse,
  initialContents = [],
  matchedVideos = [],
}) {
  const router = useRouter();
  const activeVideoRef = useRef(null);

  const safeCourses = useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];
    const seen = new Set();
    return list.filter((c, idx) => {
      const k = String(c?.id ?? `idx-${idx}`);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [courses]);

  const safeMatchedVideos = useMemo(
    () => (Array.isArray(matchedVideos) ? matchedVideos : []),
    [matchedVideos]
  );

  const defaultCourseId = selectedCourse?.id ?? safeCourses[0]?.id ?? '';
  const [selectedCourseOverride, setSelectedCourseOverride] = useState(null);
  const activeCourseId = selectedCourseOverride ?? defaultCourseId;

  const baseListForCourse = useMemo(() => {
    const dbItems = Array.isArray(initialContents) ? initialContents : [];
    const seenIds = new Set();
    const seenSignature = new Set();

    const uniqueDbItems = [];
    for (let i = 0; i < dbItems.length; i += 1) {
      const it = dbItems[i];
      const idStr =
        it?.id !== undefined && it?.id !== null ? String(it.id) : '';
      const vidUrl = getItemVideoUrl(it);
      const normTitle = String(it?.title || '')
        .trim()
        .toLowerCase();
      const sig = `${normTitle}::${vidUrl.toLowerCase()}`;

      if (idStr && seenIds.has(idStr)) continue;
      if (normTitle && seenSignature.has(sig)) continue;

      if (idStr) seenIds.add(idStr);
      if (normTitle) seenSignature.add(sig);

      uniqueDbItems.push({
        ...it,
        video_url: vidUrl || null,
        description: getItemDescription(it),
        order_index: getItemOrder(it, i),
        __uid: idStr || `db-${i}`,
      });
    }

    const folderItems = [];
    for (let j = 0; j < safeMatchedVideos.length; j += 1) {
      const vid = safeMatchedVideos[j];
      const vidUrl = cleanUrlString(vid.mediaUrl);
      const sig = `${String(vid.title || '')
        .trim()
        .toLowerCase()}::${vidUrl.toLowerCase()}`;
      if (seenSignature.has(sig)) continue;
      seenSignature.add(sig);

      folderItems.push({
        id: `folder-${selectedCourse?.id ?? 'crs'}-${vid.fileName}-${j}`,
        __uid: `folder-${selectedCourse?.id ?? 'crs'}-${vid.fileName}-${j}`,
        course_id: selectedCourse?.id,
        title: vid.title,
        video_url: vidUrl || null,
        description: '',
        status: 'published',
        order_index: uniqueDbItems.length + folderItems.length + 1,
      });
    }

    return [...uniqueDbItems, ...folderItems];
  }, [selectedCourse, initialContents, safeMatchedVideos]);

  const [mutatedByCourse, setMutatedByCourse] = useState({});
  const courseKey = String(selectedCourse?.id ?? activeCourseId ?? 'none');

  const safeContents = useMemo(() => {
    const stateForCourse = mutatedByCourse[courseKey] || {
      added: [],
      editedByUid: {},
      deletedUids: [],
    };

    const deletedSet = new Set(stateForCourse.deletedUids || []);

    const updatedBase = baseListForCourse
      .map((item, idx) => {
        const uid = item.__uid || `base-${idx}`;
        const patch = stateForCourse.editedByUid?.[uid];
        const merged = patch
          ? { ...item, ...patch, __uid: uid }
          : { ...item, __uid: uid };
        return {
          ...merged,
          video_url: getItemVideoUrl(merged) || null,
          description: getItemDescription(merged),
          order_index: getItemOrder(merged, idx),
        };
      })
      .filter((item) => !deletedSet.has(item.__uid));

    const updatedAdded = (stateForCourse.added || [])
      .map((item, idx) => {
        const uid = item.__uid || item.id || `added-${idx}`;
        const patch = stateForCourse.editedByUid?.[uid];
        const merged = patch
          ? { ...item, ...patch, __uid: uid }
          : { ...item, __uid: uid };
        return {
          ...merged,
          video_url: getItemVideoUrl(merged) || null,
          description: getItemDescription(merged),
          order_index: getItemOrder(merged, idx),
        };
      })
      .filter((item) => !deletedSet.has(item.__uid));

    return [...updatedBase, ...updatedAdded].sort(
      (a, b) => (Number(a.order_index) || 999) - (Number(b.order_index) || 999)
    );
  }, [baseListForCourse, mutatedByCourse, courseKey]);

  const [editingUid, setEditingUid] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedUid, setExpandedUid] = useState(null);

  const [moduleTitle, setModuleTitle] = useState('');
  const [sortOrderInput, setSortOrderInput] = useState('1');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const draftCount = safeContents.filter(
    (c) => String(c?.status || '').toLowerCase() === 'draft'
  ).length;

  const isEditingVideoModule = useMemo(() => {
    const currentVideo = editingItem ? getItemVideoUrl(editingItem) : '';
    return isVideoPath(currentVideo) || isVideoPath(videoUrlInput);
  }, [editingItem, videoUrlInput]);

  const resetEditorFields = (nextOrderValue = '') => {
    setEditingUid(null);
    setEditingItem(null);
    setModuleTitle('');
    setSortOrderInput(
      String(nextOrderValue || safeContents.length + 1)
    );
    setVideoUrlInput('');
    setDescriptionInput('');
  };

  const handleToggleModule = (item) => {
    const uid = item.__uid || String(item.id);
    const willOpen = expandedUid !== uid;
    const vidUrl = getItemVideoUrl(item);
    const itemHasVideo = isVideoPath(vidUrl);

    setExpandedUid(willOpen ? uid : null);
    setEditingUid(uid);
    setEditingItem(item);
    setModuleTitle(item?.title || '');
    setSortOrderInput(String(getItemOrder(item, 0)));
    setVideoUrlInput(vidUrl);
    setDescriptionInput(getItemDescription(item));
    setFeedback('');

    if (willOpen && itemHasVideo) {
      setTimeout(() => {
        if (activeVideoRef.current) {
          activeVideoRef.current.play().catch(() => {});
        }
      }, 50);
    }
  };

  const handleStartNewModule = () => {
    setExpandedUid(null);
    resetEditorFields(String(safeContents.length + 1));
    setFeedback('');
  };

  const handleDeleteModule = async (e, item) => {
    e.stopPropagation();
    const uid = item.__uid || String(item.id);

    const deletedDb = await deleteModuleInDb({ itemId: item.id });

    setMutatedByCourse((prev) => {
      const currentState = prev[courseKey] || {
        added: [],
        editedByUid: {},
        deletedUids: [],
      };

      const nextDeleted = Array.from(
        new Set([...(currentState.deletedUids || []), uid])
      );

      return {
        ...prev,
        [courseKey]: {
          ...currentState,
          deletedUids: nextDeleted,
        },
      };
    });

    if (editingUid === uid) {
      resetEditorFields(String(Math.max(1, safeContents.length)));
    }
    if (expandedUid === uid) {
      setExpandedUid(null);
    }

    setFeedback(
      deletedDb
        ? `Modul "${item.title}" dihapus permanen dari database.`
        : `Modul "${item.title}" dihapus dari daftar.`
    );
  };

  const handleCourseDropdownChange = (e) => {
    const nextId = e.target.value;
    setSelectedCourseOverride(nextId);
    setExpandedUid(null);
    resetEditorFields('1');
    setFeedback('');
    router.push(`/dashboard/teacher/contents?courseId=${nextId}`);
  };

  const handleSaveModule = async (isDraft = false) => {
    if (!activeCourseId || saving) return;

    const trimmedTitle = moduleTitle.trim();
    const trimmedVideo = cleanUrlString(videoUrlInput);
    const trimmedDesc = descriptionInput.trim();
    const parsedOrder = Math.max(
      1,
      Number.parseInt(sortOrderInput, 10) || safeContents.length + 1
    );

    if (!trimmedTitle && !trimmedVideo && !trimmedDesc) {
      setFeedback('Silakan isi judul, video, atau teks isi materi terlebih dahulu.');
      return;
    }

    const finalTitle = trimmedTitle || 'Modul Pembelajaran';

    const payload = {
      course_id: Number(activeCourseId),
      title: finalTitle,
      description: trimmedDesc,
      video_url: trimmedVideo || null,
      order_index: parsedOrder,
      status: isDraft ? 'draft' : 'published',
    };

    setSaving(true);
    setFeedback('');

    const isEditMode = Boolean(editingUid && editingItem);

    if (isEditMode) {
      const numericId = Number(editingItem.id);
      const hasNumericId = Number.isInteger(numericId) && numericId > 0;

      if (!hasNumericId) {
        const { savedToDb, record } = await createNewModuleInDb({ payload });
        const realId = record?.id ?? editingItem.id;
        const nextUid = realId ? String(realId) : editingUid;

        const updatedRecord = {
          ...editingItem,
          ...(record || {}),
          ...payload,
          id: realId,
          __uid: nextUid,
        };

        setMutatedByCourse((prev) => {
          const currentState = prev[courseKey] || {
            added: [],
            editedByUid: {},
            deletedUids: [],
          };

          const nextDeleted = Array.from(
            new Set([...(currentState.deletedUids || []), editingUid])
          );

          return {
            ...prev,
            [courseKey]: {
              ...currentState,
              added: [...currentState.added, updatedRecord],
              deletedUids: nextDeleted,
            },
          };
        });

        resetEditorFields(String(safeContents.length + 1));
        setSaving(false);
        setFeedback(
          savedToDb
            ? 'Modul tersimpan permanen di database.'
            : 'Modul diperbarui.'
        );
        return;
      }

      const { savedToDb, record } = await updateExistingModuleInDb({
        itemId: numericId,
        payload,
      });

      const updatedRecord = {
        ...editingItem,
        ...(record || {}),
        ...payload,
        id: numericId,
        __uid: editingUid,
      };

      setMutatedByCourse((prev) => {
        const currentState = prev[courseKey] || {
          added: [],
          editedByUid: {},
          deletedUids: [],
        };

        return {
          ...prev,
          [courseKey]: {
            ...currentState,
            editedByUid: {
              ...currentState.editedByUid,
              [editingUid]: updatedRecord,
            },
          },
        };
      });

      resetEditorFields(String(safeContents.length + 1));
      setSaving(false);
      setFeedback(
        isDraft
          ? 'Draf modul tersimpan dan kolom dikosongkan.'
          : savedToDb
          ? 'Perubahan modul tersimpan permanen di database.'
          : 'Perubahan modul diterapkan.'
      );
      return;
    }

    const { savedToDb, record } = await createNewModuleInDb({ payload });
    const newId = record?.id ?? `added-${Date.now()}`;
    const newUid = String(newId);
    const createdRecord = {
      ...(record || {}),
      ...payload,
      id: newId,
      __uid: newUid,
    };

    setMutatedByCourse((prev) => {
      const currentState = prev[courseKey] || {
        added: [],
        editedByUid: {},
        deletedUids: [],
      };

      return {
        ...prev,
        [courseKey]: {
          ...currentState,
          added: [...currentState.added, createdRecord],
        },
      };
    });

    resetEditorFields(String(safeContents.length + 2));
    setSaving(false);
    setFeedback(
      isDraft
        ? 'Draf modul disimpan dan kolom dikosongkan.'
        : savedToDb
        ? 'Modul baru tersimpan permanen di database.'
        : 'Modul baru ditambahkan.'
    );
  };

  const currentCourse =
    safeCourses.find((c) => String(c.id) === String(activeCourseId)) ||
    selectedCourse;

  return (
    <div className="min-h-screen bg-[#F3D8BE]/60 text-[#341D17] p-4 sm:p-6 space-y-5">
      {/* KARTU ATAS: SILABUS KURSUS AKTIF & STRUKTUR URUTAN MATERI */}
      <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/10 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#802924] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#FFFDF9]">
              SILABUS KURSUS AKTIF
            </span>
            {currentCourse && (
              <span className="text-[11px] font-bold text-[#341D17]/60">
                ID: #CRS-{String(currentCourse.id).padStart(3, '0')}
              </span>
            )}
          </div>

          <span className="rounded-xl border border-[#341D17]/12 bg-[#FFFDF9] px-3 py-1.5 text-xs font-bold text-[#341D17]">
            Author: {teacher?.full_name || 'Ayu'}
          </span>
        </div>

        <div>
          <select
            value={activeCourseId}
            onChange={handleCourseDropdownChange}
            aria-label="Pilih Kursus Aktif"
            className="w-full rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] px-4 py-3 text-base sm:text-lg font-bold text-[#341D17] focus:border-[#802924] focus:outline-none"
          >
            {safeCourses.map((c, cIdx) => (
              <option key={`${c.id ?? 'course'}-${cIdx}`} value={c.id}>
                {c.title} ({c.status === 'active' || !c.status ? 'Aktif' : c.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-xl bg-[#802924] px-3 py-1.5 font-bold text-[#FFFDF9]">
              Total: {safeContents.length} Modul
            </span>
            <span className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] px-3 py-1.5 font-semibold text-[#341D17]/75">
              {draftCount} Draft Baru
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartNewModule}
            className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition cursor-pointer"
          >
            + Tambah Materi
          </button>
        </div>

        {/* STRUKTUR & URUTAN MATERI */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">
              Struktur &amp; Urutan Materi
            </h2>
            <span className="text-[11px] text-[#341D17]/55">
              Klik 1x buka deskripsi, klik lagi tutup
            </span>
          </div>

          {safeContents.length === 0 ? (
            <div className="rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]/70 px-4 py-6 text-center text-xs text-[#341D17]/65">
              Belum ada modul materi untuk kursus &ldquo;
              {currentCourse?.title || 'ini'}&rdquo;. Silakan tambahkan melalui editor di bawah.
            </div>
          ) : (
            <div className="space-y-2.5">
              {safeContents.map((item, idx) => {
                const uid = item.__uid || `${item.id ?? 'mod'}-${idx}`;
                const vidUrl = getItemVideoUrl(item);
                const descText = getItemDescription(item).trim();
                const orderNum = getItemOrder(item, idx);
                const hasVideo = isVideoPath(vidUrl);
                const isExpanded = expandedUid === uid;
                const hasDescription = Boolean(descText);

                return (
                  <div
                    key={uid}
                    onClick={() => handleToggleModule(item)}
                    className={`rounded-2xl border p-3.5 space-y-3 transition cursor-pointer ${
                      isExpanded
                        ? 'border-[#802924] bg-[#F9DDBB]/35'
                        : 'border-[#341D17]/12 bg-[#FAF6F0]/75 hover:bg-[#F9DDBB]/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                          URUTAN #{String(orderNum).padStart(2, '0')} &bull;{' '}
                          {hasVideo ? 'VIDEO' : 'TEKS'}
                        </p>
                        <p className="text-sm font-bold text-[#341D17] truncate">
                          {item.title}
                        </p>
                        {hasVideo && (
                          <p className="text-[11px] text-[#341D17]/60 truncate">
                            {vidUrl}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteModule(e, item)}
                        aria-label={`Hapus modul ${item.title}`}
                        title="Hapus modul"
                        className="shrink-0 rounded-xl border border-[#341D17]/12 bg-[#FFFDF9] hover:border-[#802924] hover:bg-[#802924] hover:text-[#FFFDF9] p-2 text-[#802924] transition cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="space-y-2.5 pt-1"
                      >
                        {hasVideo && (
                          <div className="overflow-hidden rounded-2xl border border-[#341D17]/15 bg-black">
                            <video
                              ref={activeVideoRef}
                              key={toPlayableVideoSrc(vidUrl)}
                              src={toPlayableVideoSrc(vidUrl)}
                              controls
                              autoPlay
                              playsInline
                              className="w-full max-h-80 object-contain"
                            />
                          </div>
                        )}

                        {hasDescription && (
                          <div className="rounded-xl border border-[#341D17]/10 bg-[#FFFDF9] p-3 text-xs text-[#341D17]/85 whitespace-pre-line leading-relaxed">
                            {descText}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {feedback && (
        <div className="rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] px-4 py-2.5 text-xs font-bold text-[#802924]">
          {feedback}
        </div>
      )}

      {/* KARTU BAWAH: EDITOR EDIT / TAMBAH MODUL */}
      <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/10 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
              EDITOR MATERI AKTIF
            </span>
            <h2 className="font-editorial text-xl font-bold text-[#341D17]">
              {editingItem ? `Edit: ${editingItem.title}` : 'Modul Pembelajaran Baru'}
            </h2>
          </div>

          <span className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] px-3 py-1 text-[11px] font-bold text-[#341D17]/75">
            Order Index: {sortOrderInput || safeContents.length + 1}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
              JUDUL MATERI
            </label>
            <input
              type="text"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="Judul modul / materi"
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/40 focus:border-[#802924] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
              URUTAN MODUL
            </label>
            <input
              type="number"
              min={1}
              value={sortOrderInput}
              onChange={(e) => setSortOrderInput(e.target.value)}
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#341D17] focus:border-[#802924] focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
            {isEditingVideoModule
              ? 'GANTI VIDEO MATERI (URL / PATH MP4)'
              : 'TAMBAHKAN VIDEO KE MODUL TEKS (URL / PATH MP4 - OPSIONAL)'}
          </label>
          <input
            type="text"
            value={videoUrlInput}
            onChange={(e) => setVideoUrlInput(e.target.value)}
            placeholder="/videos/french_pastry/Masterclass Classic Croissant.mp4"
            className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/40 focus:border-[#802924] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
            <span>
              {isEditingVideoModule
                ? 'TEKS DESKRIPSI DI BAWAH VIDEO'
                : 'ISI MATERI TEKS / CATATAN'}
            </span>
            <span className="text-[#802924]">
              {isEditingVideoModule ? 'Tampil di Bawah Video' : 'Modul Teks'}
            </span>
          </div>

          <textarea
            rows={4}
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            placeholder={
              isEditingVideoModule
                ? 'Tuliskan teks deskripsi atau catatan tambahan yang muncul di bawah video...'
                : 'Tuliskan atau ubah isi catatan / materi teks di sini...'
            }
            className="w-full rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] p-3.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/40 focus:border-[#802924] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveModule(true)}
            className="rounded-2xl border border-[#341D17]/15 bg-[#FAF6F0] hover:bg-[#F9DDBB]/45 py-2.5 px-4 text-xs sm:text-sm font-bold text-[#341D17] transition cursor-pointer disabled:opacity-60"
          >
            Simpan Draf
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveModule(false)}
            className="rounded-2xl bg-[#802924] hover:bg-[#661F1B] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#FFFDF9] transition cursor-pointer disabled:opacity-60"
          >
            {editingItem ? 'Simpan Perubahan Modul' : 'Terbitkan Modul'}
          </button>
        </div>
      </section>
    </div>
  );
}