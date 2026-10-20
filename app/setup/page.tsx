"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import {
  Plus,
  Camera,
  ArrowLeft,
  Trash2,
  X,
  RefreshCw,
  Delete,
  ChevronDown,
  Flag,
  RotateCw,
} from 'lucide-react';

export default function GameSetup() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { savedCourses, savedGroups, startNewGame, syncTemplates } = useGolfStore();

  const [totalHoles, setTotalHoles] = useState<9 | 18>(9);
  const [startingLoop, setStartingLoop] = useState<'Front' | 'Back'>('Front');
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCoursePars, setNewCoursePars] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- R2 Media Storage State Pipeline ---
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function fetchDatabaseTemplates() {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const payload = await res.json();

          const coursesFromDb = payload.courses || [];
          const groupsFromDb = payload.groups || [];

          syncTemplates(coursesFromDb, groupsFromDb);
        }
      } catch (err) {
        console.error('Could not sync live database parameters', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDatabaseTemplates();
  }, [syncTemplates]);

  const triggerFeedback = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      triggerFeedback();

      const signRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!signRes.ok) throw new Error('Signed request mapping failed');
      const { uploadUrl, publicUrl } = await signRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('R2 cloud storage rejection');
      setImageUrl(publicUrl);
    } catch (err) {
      console.error('Upload operation failed:', err);
      alert('Could not attach image to active round storage');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStart = () => {
    triggerFeedback();
    const course = savedCourses[selectedCourseIdx] || {
      id: 'default',
      name: 'Amverton Cove Golf Resort',
      pars: [4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4],
    };
    const group = savedGroups[selectedGroupIdx];

    startNewGame({
      courseId: course.id,
      courseName: course.name,
      totalHoles,
      startingLoop,
      players: group?.players || ['Ayah', 'Luqman', 'Abang', 'Umar'],
      coursePars: course.pars,
      imageUrl: imageUrl || undefined,
    });
    router.push('/play');
  };

  const openCourseModal = () => {
    triggerFeedback();
    setIsModalOpen(true);
  };

  const closeCourseModal = () => {
    triggerFeedback();
    setIsModalOpen(false);
    setNewCourseName('');
    setNewCoursePars('');
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col bg-background px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] font-sans text-foreground subpixel-antialiased select-none md:max-w-3xl md:px-6">
      {/* Top Header Navigation Panel */}
      <header className="relative flex min-h-[56px] w-full flex-shrink-0 items-center justify-center pt-2">
        <button
          onClick={() => {
            triggerFeedback();
            router.push('/');
          }}
          className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface text-foreground shadow-[0_2px_8px_rgba(28,28,30,0.05)] transition active:scale-95 active:bg-[#F3F0E9]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-forest">New Round</p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-foreground">Setup Match</h1>
        </div>
      </header>

      {/* --- CENTERING MIDDLE WRAPPER ZONE --- */}
      <div className="flex min-h-0 flex-1 flex-col justify-center space-y-5 py-6">
        {/* Media Context Container */}
        <div className="w-full">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />

          {!imageUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group flex aspect-[16/10] max-h-[320px] w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[#D8D2C6] bg-surface/60 transition duration-150 hover:border-forest/40 hover:bg-surface disabled:opacity-60"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3EC] text-forest transition group-hover:scale-105">
                {isUploading ? (
                  <RotateCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </span>
              <span className="text-sm font-bold text-[#6B6B70]">
                {isUploading ? 'Uploading photo...' : 'Add a round photo'}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A3A3A8]">
                Optional · Tap to select
              </span>
            </button>
          ) : (
            <div className="relative aspect-[16/10] max-h-[320px] w-full overflow-hidden rounded-3xl border border-line bg-[#EFEAE0] shadow-[0_14px_30px_-24px_rgba(28,28,30,0.6)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Active Snapshot Selection Layout Preview"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

              <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
                <button
                  onClick={() => {
                    triggerFeedback();
                    fileInputRef.current?.click();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white shadow-md backdrop-blur-md transition active:bg-black/60"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    triggerFeedback();
                    setImageUrl(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-[#FF453A] shadow-md backdrop-blur-md transition active:bg-black/60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="absolute bottom-3 left-3 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
                  Round photo
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Selection Tab Section */}
        <div className="space-y-4 rounded-3xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(28,28,30,0.03)]">
          <div>
            <label className="mb-2 block pl-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              Round Length
            </label>
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-line/60 bg-[#F3F0E9] p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  triggerFeedback();
                  setTotalHoles(9);
                }}
                className={`rounded-xl py-2.5 font-bold transition ${
                  totalHoles === 9
                    ? 'bg-forest text-white shadow-sm'
                    : 'text-[#6B6B70] hover:bg-white/60'
                }`}
              >
                9 Holes
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerFeedback();
                  setTotalHoles(18);
                }}
                className={`rounded-xl py-2.5 font-bold transition ${
                  totalHoles === 18
                    ? 'bg-forest text-white shadow-sm'
                    : 'text-[#6B6B70] hover:bg-white/60'
                }`}
              >
                18 Holes
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block pl-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              Starting Tee
            </label>
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-line/60 bg-[#F3F0E9] p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  triggerFeedback();
                  setStartingLoop('Front');
                }}
                className={`rounded-xl py-2.5 font-bold transition ${
                  startingLoop === 'Front'
                    ? 'bg-forest text-white shadow-sm'
                    : 'text-[#6B6B70] hover:bg-white/60'
                }`}
              >
                Front 9 (H1)
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerFeedback();
                  setStartingLoop('Back');
                }}
                className={`rounded-xl py-2.5 font-bold transition ${
                  startingLoop === 'Back'
                    ? 'bg-forest text-white shadow-sm'
                    : 'text-[#6B6B70] hover:bg-white/60'
                }`}
              >
                Back 9 (H10)
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Selection Blocks */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block pl-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              Course Template
            </label>
            <div className="relative flex items-center rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(28,28,30,0.03)] transition focus-within:border-forest/40">
              <select
                value={selectedCourseIdx}
                onChange={(e) => setSelectedCourseIdx(Number(e.target.value))}
                className="z-10 w-full cursor-pointer appearance-none truncate rounded-2xl bg-transparent py-3.5 pl-4 pr-24 text-sm font-semibold text-foreground focus:outline-none"
              >
                {savedCourses.length === 0 ? (
                  <option value={0}>
                    {isLoading ? 'Loading layouts...' : 'Default Layout (Par 36)'}
                  </option>
                ) : (
                  savedCourses.map((c, idx) => (
                    <option key={c.id} value={idx}>
                      {c.name} ({c.pars.length}H)
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-3 z-20 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={openCourseModal}
                  className="rounded-lg p-1.5 text-forest transition hover:bg-[#EAF3EC] active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <ChevronDown className="pointer-events-none h-4 w-4 text-[#A3A3A8]" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block pl-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              Turn Group Flight
            </label>
            <div className="relative flex items-center rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(28,28,30,0.03)] transition focus-within:border-forest/40">
              <select
                value={selectedGroupIdx}
                onChange={(e) => setSelectedGroupIdx(Number(e.target.value))}
                className="z-10 w-full cursor-pointer appearance-none truncate rounded-2xl bg-transparent py-3.5 pl-4 pr-12 text-sm font-semibold text-foreground focus:outline-none"
              >
                {savedGroups.length === 0 ? (
                  <option value={0}>No groups available</option>
                ) : (
                  savedGroups.map((g, idx) => (
                    <option key={g.id} value={idx}>
                      {g.name} — ({g.players.join(', ')})
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute right-3.5 z-20">
                <ChevronDown className="h-4 w-4 text-[#A3A3A8]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="flex w-full shrink-0 items-center justify-center gap-2 rounded-3xl bg-forest py-4 text-sm font-bold tracking-tight text-white shadow-[0_18px_30px_-18px_rgba(11,107,58,0.9)] transition active:scale-[0.99] active:bg-forest-dark"
      >
        <Flag className="h-4 w-4" />
        Start Round
      </button>

      {/* Course Entry Modal */}
      {isModalOpen && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="animate-scale-up relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-2xl">
            {/* 1. Top Right Discard Close Button Icon */}
            <button
              type="button"
              onClick={closeCourseModal}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-[#6B6B70] transition hover:bg-[#F3F0E9]"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </button>

            {/* 2. Modal Header */}
            <div className="mb-4 pr-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Courses</p>
              <h3 className="mt-0.5 text-lg font-extrabold text-foreground">New Course Layout</h3>
            </div>

            <div className="space-y-4">
              {/* 3. Lighter weight, high-contrast text input */}
              <input
                type="text"
                placeholder="Club / Course Name"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="min-h-[56px] w-full rounded-2xl border border-line bg-[#F7F4EE] p-3.5 text-sm font-semibold text-foreground placeholder-[#A3A3A8] focus:border-forest/40 focus:outline-none"
              />

              {/* 4. Premium Obsidian & Amber Gold Monitor */}
              {(() => {
                const parsList = newCoursePars.trim() ? newCoursePars.trim().split(' ') : [];
                const holeCount = parsList.length;
                const isExceeded = holeCount > 18;
                const row1 = parsList.slice(0, 9).join(' ');
                const row2 = parsList.slice(9).join(' ');

                return (
                  <div
                    className={`flex min-h-[62px] flex-col items-center justify-center rounded-2xl border p-4 font-mono text-xl font-black tracking-widest shadow-inner transition-colors ${
                      isExceeded
                        ? 'border-red-600 bg-red-950 text-red-400'
                        : 'border-black bg-[#0F172A] text-[#F5C56B]'
                    }`}
                  >
                    {holeCount > 0 ? (
                      <>
                        <div className="space-y-1 text-center leading-tight">
                          <div>{row1}</div>
                          {row2 && <div>{row2}</div>}
                        </div>
                        <span
                          className={`mt-2 font-sans text-[10px] font-bold tracking-normal ${
                            isExceeded ? 'text-red-400' : 'text-slate-400'
                          }`}
                        >
                          {holeCount}/18 holes {isExceeded && '(Max 18 exceeded)'}
                        </span>
                      </>
                    ) : (
                      <span className="animate-pulse font-sans text-xs font-medium tracking-normal text-white/70">
                        Tap a par below to build the course...
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* 5. Fluid Tactile Grid Action Matrix */}
              <div className="grid w-full grid-cols-5 gap-2">
                {[3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      triggerFeedback();
                      setNewCoursePars((prev) => prev + num + ' ');
                    }}
                    className="flex items-center justify-center rounded-xl border border-line bg-[#F3F0E9] py-3.5 text-lg font-black text-foreground transition active:scale-95 active:bg-forest active:text-white"
                  >
                    {num}
                  </button>
                ))}

                {/* Icon Button: Delete (Amber Highlight) */}
                <button
                  type="button"
                  onClick={() => {
                    triggerFeedback();
                    setNewCoursePars((prev) => prev.slice(0, -2));
                  }}
                  className="flex items-center justify-center rounded-xl border border-[#FDE68A] bg-[#FEF3C7] text-[#D97706] transition active:scale-95 active:bg-[#FDE68A]"
                >
                  <Delete className="h-5 w-5 stroke-[2.5]" />
                </button>

                {/* Icon Button: Save (Sport Emerald Green) */}
                <button
                  type="button"
                  onClick={() => {
                    if (!newCourseName || !newCoursePars) return;
                    const parsArray = newCoursePars.trim().split(' ').map(Number);
                    if (parsArray.length > 18) return;
                    triggerFeedback();
                    useGolfStore.setState((s) => ({
                      savedCourses: [
                        ...s.savedCourses,
                        { id: `c_${Date.now()}`, name: newCourseName, pars: parsArray },
                      ],
                    }));
                    setIsModalOpen(false);
                    setNewCourseName('');
                    setNewCoursePars('');
                  }}
                  className="flex items-center justify-center rounded-xl bg-forest text-white shadow-sm shadow-[#059669]/20 transition active:scale-95 active:bg-forest-dark"
                >
                  <Plus className="h-5 w-5 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
