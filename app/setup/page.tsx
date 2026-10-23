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
  Flag,
  Users,
  Check,
} from 'lucide-react';

const avatarTones = [
  'bg-forest text-white',
  'bg-mint text-[#08301f]',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
];

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

  const selectedCourse = savedCourses[selectedCourseIdx];
  const courseParTotal = selectedCourse?.pars.reduce((a, b) => a + b, 0) || 0;
  const selectedGroup = savedGroups[selectedGroupIdx];

  return (
    <div className="min-h-[100dvh] w-full bg-canvas pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-[calc(1.15rem+env(safe-area-inset-top))] font-sans text-ink antialiased select-none">
      <div className="mx-auto w-full max-w-md px-4">
        {/* Header */}
        <header className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              triggerFeedback();
              router.push('/');
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-card transition active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-subtle">
              New round
            </p>
            <h1 className="mt-1 text-xl font-semibold leading-none tracking-tight">Setup match</h1>
          </div>
        </header>

        <div className="mt-5 space-y-4">
          {/* Photo */}
          <div className="rounded-[28px] bg-white p-2 shadow-card">
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
                className="relative flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#EAF7EF_0%,#F7F6F1_100%)] transition disabled:opacity-50"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-forest shadow-card">
                  {isUploading ? (
                    <RotateCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </span>
                <span className="text-[13px] font-semibold text-ink">
                  {isUploading ? 'Uploading photo...' : 'Add a round photo'}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-subtle">
                  Optional · Tap to select
                </span>
              </button>
            ) : (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[22px] bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Round photo preview"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

                <div className="absolute right-3 top-3 z-10 flex gap-2">
                  <button
                    onClick={() => {
                      triggerFeedback();
                      fileInputRef.current?.click();
                    }}
                    className="glass grid h-9 w-9 place-items-center rounded-full text-white transition active:scale-95"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      triggerFeedback();
                      setImageUrl(null);
                    }}
                    className="glass grid h-9 w-9 place-items-center rounded-full text-white transition active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 z-10">
                  <span className="glass rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
                    Round photo
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Round details */}
          <section className="rounded-[28px] bg-white p-5 shadow-card">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-canvas text-forest">
                <Flag className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold tracking-tight">Round details</h2>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                Format
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-canvas p-1">
                {([9, 18] as const).map((holes) => (
                  <button
                    key={holes}
                    type="button"
                    onClick={() => {
                      triggerFeedback();
                      setTotalHoles(holes);
                    }}
                    className={`rounded-xl py-2.5 text-xs font-semibold transition ${
                      totalHoles === holes
                        ? 'bg-white text-ink shadow-card'
                        : 'text-subtle active:bg-white/60'
                    }`}
                  >
                    {holes} Holes
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                Starting tee
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-canvas p-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerFeedback();
                    setStartingLoop('Front');
                  }}
                  className={`rounded-xl py-2.5 text-xs font-semibold transition ${
                    startingLoop === 'Front'
                      ? 'bg-white text-ink shadow-card'
                      : 'text-subtle active:bg-white/60'
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
                  className={`rounded-xl py-2.5 text-xs font-semibold transition ${
                    startingLoop === 'Back'
                      ? 'bg-white text-ink shadow-card'
                      : 'text-subtle active:bg-white/60'
                  }`}
                >
                  Back 9 (H10)
                </button>
              </div>
            </div>
          </section>

          {/* Course */}
          <section className="rounded-[28px] bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-canvas text-forest">
                  <Flag className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold tracking-tight">Course</h2>
              </div>
              <button
                type="button"
                onClick={openCourseModal}
                className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-subtle transition active:scale-95 active:bg-line"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-4 flex items-center gap-3 rounded-2xl bg-canvas p-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest text-white">
                <Flag className="h-5 w-5" />
              </span>
              <div className="relative min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-subtle">
                  Course template
                </p>
                <select
                  value={selectedCourseIdx}
                  onChange={(e) => setSelectedCourseIdx(Number(e.target.value))}
                  className="z-10 mt-0.5 w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-[13px] font-semibold text-ink focus:outline-none"
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
                <p className="mt-0.5 text-[10px] text-subtle">
                  {selectedCourse ? `${selectedCourse.pars.length} holes · Par ${courseParTotal}` : 'Tap to choose a layout'}
                </p>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              </div>
            </div>
          </section>

          {/* Flight */}
          <section className="rounded-[28px] bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-canvas text-forest">
                  <Users className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold tracking-tight">Flight group</h2>
              </div>
              <span className="rounded-full bg-canvas px-2.5 py-1 text-[10px] font-semibold text-subtle">
                {selectedGroup?.players.length || 0} players
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {savedGroups.length === 0 ? (
                <div className="rounded-2xl bg-canvas px-4 py-4 text-center text-xs font-medium text-subtle">
                  {isLoading ? 'Loading groups...' : 'No groups available'}
                </div>
              ) : (
                savedGroups.map((group, idx) => {
                  const isSelected = selectedGroupIdx === idx;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        triggerFeedback();
                        setSelectedGroupIdx(idx);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                        isSelected
                          ? 'border-forest/30 bg-forest/5'
                          : 'border-line bg-white'
                      }`}
                    >
                      <div className="flex shrink-0 -space-x-2">
                        {group.players.slice(0, 3).map((player, pIdx) => (
                          <span
                            key={player}
                            className={`grid h-8 w-8 place-items-center rounded-full border-2 border-white text-[9px] font-semibold ${avatarTones[pIdx % avatarTones.length]}`}
                          >
                            {player.slice(0, 2).toUpperCase()}
                          </span>
                        ))}
                        {group.players.length > 3 && (
                          <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-canvas text-[9px] font-semibold text-subtle">
                            +{group.players.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">{group.name}</p>
                        <p className="mt-0.5 truncate text-[10px] text-subtle">
                          {group.players.join(' · ')}
                        </p>
                      </div>

                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition ${
                          isSelected ? 'bg-forest text-white' : 'bg-canvas text-transparent'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Sticky start action */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto w-full max-w-md px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))]">
          <div className="glass-light rounded-[26px] border border-white/60 p-2 shadow-float">
            <button
              onClick={handleStart}
              className="w-full rounded-[20px] bg-gradient-to-r from-forest to-forest-deep py-4 text-sm font-semibold text-white shadow-lg shadow-forest/25 transition active:scale-[0.99]"
            >
              Start round
            </button>
          </div>
        </div>
      </div>

      {/* Course Entry Modal */}
      {isModalOpen && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-md">
          <div className="animate-scale-up relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-[30px] bg-white p-5 shadow-float">
            <button
              type="button"
              onClick={closeCourseModal}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-canvas text-subtle transition active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 pr-10">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-subtle">
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
                className="w-full rounded-2xl bg-canvas px-4 py-3.5 text-sm font-medium text-ink placeholder:text-subtle/70 focus:outline-none"
              />

              {(() => {
                const parsList = newCoursePars.trim() ? newCoursePars.trim().split(' ') : [];
                const holeCount = parsList.length;
                const isExceeded = holeCount > 18;
                const row1 = parsList.slice(0, 9).join(' ');
                const row2 = parsList.slice(9).join(' ');

                return (
                  <div
                    className={`flex min-h-[62px] flex-col items-center justify-center rounded-2xl p-4 font-mono text-lg font-medium tracking-widest transition-colors ${
                      isExceeded ? 'bg-red-50 text-red-600' : 'bg-canvas text-ink'
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
                            isExceeded ? 'text-red-600' : 'text-subtle'
                          }`}
                        >
                          {holeCount}/18 holes {isExceeded && '(Max 18 exceeded)'}
                        </span>
                      </>
                    ) : (
                      <span className="font-sans text-xs font-normal tracking-normal text-subtle">
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
                    className="flex items-center justify-center rounded-2xl bg-canvas py-3.5 text-lg font-semibold text-ink transition active:scale-95 active:bg-line"
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
                  className="flex items-center justify-center rounded-2xl bg-canvas text-subtle transition active:scale-95 active:bg-line"
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
                  className="flex items-center justify-center rounded-2xl bg-forest text-white transition active:scale-95"
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
