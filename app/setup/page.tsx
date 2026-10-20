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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] font-sans text-[#111111] subpixel-antialiased select-none md:max-w-3xl md:px-8">
      {/* Header */}
      <header className="flex items-center gap-3 pb-2 pt-4">
        <button
          onClick={() => {
            triggerFeedback();
            router.push('/');
          }}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition active:scale-95 active:bg-neutral-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">
            New round
          </p>
          <h1 className="mt-1 text-lg font-semibold leading-none tracking-tight">Setup match</h1>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col space-y-7 py-7">
        {/* Media */}
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
              className="flex aspect-[16/10] max-h-[300px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white transition hover:border-neutral-400 disabled:opacity-50"
            >
              {isUploading ? (
                <RotateCw className="h-5 w-5 animate-spin text-neutral-400" />
              ) : (
                <Camera className="h-5 w-5 text-neutral-400" />
              )}
              <span className="text-sm font-medium text-neutral-600">
                {isUploading ? 'Uploading photo...' : 'Add a round photo'}
              </span>
              <span className="text-[10px] font-normal uppercase tracking-[0.14em] text-neutral-400">
                Optional · Tap to select
              </span>
            </button>
          ) : (
            <div className="relative aspect-[16/10] max-h-[300px] w-full overflow-hidden rounded-2xl bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Active Snapshot Selection Layout Preview"
                className="h-full w-full object-cover"
              />

              <div className="absolute right-3 top-3 z-10 flex gap-2">
                <button
                  onClick={() => {
                    triggerFeedback();
                    fileInputRef.current?.click();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:bg-black/60"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    triggerFeedback();
                    setImageUrl(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:bg-black/60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="absolute bottom-3 left-3 z-10">
                <span className="rounded-full bg-black/40 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  Round photo
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Config */}
        <section className="space-y-5">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Round length
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([9, 18] as const).map((holes) => (
                <button
                  key={holes}
                  type="button"
                  onClick={() => {
                    triggerFeedback();
                    setTotalHoles(holes);
                  }}
                  className={`rounded-xl py-2.5 text-xs font-medium transition ${
                    totalHoles === holes
                      ? 'bg-[#111111] text-white'
                      : 'bg-neutral-100 text-neutral-500 active:bg-neutral-200'
                  }`}
                >
                  {holes} Holes
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Starting tee
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerFeedback();
                  setStartingLoop('Front');
                }}
                className={`rounded-xl py-2.5 text-xs font-medium transition ${
                  startingLoop === 'Front'
                    ? 'bg-[#111111] text-white'
                    : 'bg-neutral-100 text-neutral-500 active:bg-neutral-200'
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
                className={`rounded-xl py-2.5 text-xs font-medium transition ${
                  startingLoop === 'Back'
                    ? 'bg-[#111111] text-white'
                    : 'bg-neutral-100 text-neutral-500 active:bg-neutral-200'
                }`}
              >
                Back 9 (H10)
              </button>
            </div>
          </div>
        </section>

        {/* Selects */}
        <section className="space-y-5">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Course template
            </label>
            <div className="relative flex items-center border-b border-neutral-200">
              <select
                value={selectedCourseIdx}
                onChange={(e) => setSelectedCourseIdx(Number(e.target.value))}
                className="z-10 w-full cursor-pointer appearance-none truncate bg-transparent py-3 pr-20 text-sm font-medium text-[#111111] focus:outline-none"
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
              <div className="absolute right-0 z-20 flex items-center gap-1">
                <button
                  type="button"
                  onClick={openCourseModal}
                  className="rounded-full p-1.5 text-neutral-400 transition active:scale-95 active:bg-neutral-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <ChevronDown className="pointer-events-none h-4 w-4 text-neutral-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Turn group flight
            </label>
            <div className="relative flex items-center border-b border-neutral-200">
              <select
                value={selectedGroupIdx}
                onChange={(e) => setSelectedGroupIdx(Number(e.target.value))}
                className="z-10 w-full cursor-pointer appearance-none truncate bg-transparent py-3 pr-10 text-sm font-medium text-[#111111] focus:outline-none"
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
              <div className="pointer-events-none absolute right-0 z-20">
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="w-full shrink-0 rounded-2xl bg-[#111111] py-4 text-sm font-medium text-white transition active:scale-[0.99] active:bg-black"
      >
        Start round
      </button>

      {/* Course Entry Modal */}
      {isModalOpen && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="animate-scale-up relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={closeCourseModal}
              className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 transition active:bg-neutral-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 pr-8">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                Courses
              </p>
              <h3 className="mt-1 text-base font-semibold tracking-tight">New course layout</h3>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Club / Course Name"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="w-full rounded-xl bg-neutral-100 px-4 py-3.5 text-sm font-medium text-[#111111] placeholder-neutral-400 focus:outline-none"
              />

              {(() => {
                const parsList = newCoursePars.trim() ? newCoursePars.trim().split(' ') : [];
                const holeCount = parsList.length;
                const isExceeded = holeCount > 18;
                const row1 = parsList.slice(0, 9).join(' ');
                const row2 = parsList.slice(9).join(' ');

                return (
                  <div
                    className={`flex min-h-[62px] flex-col items-center justify-center rounded-xl p-4 font-mono text-lg font-medium tracking-widest transition-colors ${
                      isExceeded ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-[#111111]'
                    }`}
                  >
                    {holeCount > 0 ? (
                      <>
                        <div className="space-y-1 text-center leading-tight">
                          <div>{row1}</div>
                          {row2 && <div>{row2}</div>}
                        </div>
                        <span
                          className={`mt-2 font-sans text-[10px] font-normal tracking-normal ${
                            isExceeded ? 'text-red-600' : 'text-neutral-400'
                          }`}
                        >
                          {holeCount}/18 holes {isExceeded && '(Max 18 exceeded)'}
                        </span>
                      </>
                    ) : (
                      <span className="font-sans text-xs font-normal tracking-normal text-neutral-400">
                        Tap a par below to build the course
                      </span>
                    )}
                  </div>
                );
              })()}

              <div className="grid w-full grid-cols-5 gap-2">
                {[3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      triggerFeedback();
                      setNewCoursePars((prev) => prev + num + ' ');
                    }}
                    className="flex items-center justify-center rounded-xl bg-neutral-100 py-3.5 text-lg font-medium text-[#111111] transition active:scale-95 active:bg-neutral-200"
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    triggerFeedback();
                    setNewCoursePars((prev) => prev.slice(0, -2));
                  }}
                  className="flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition active:scale-95 active:bg-neutral-200"
                >
                  <Delete className="h-5 w-5" />
                </button>

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
                  className="flex items-center justify-center rounded-xl bg-[#111111] text-white transition active:scale-95 active:bg-black"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
