"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Plus, Camera, ArrowLeft, Trash2, RefreshCw } from 'lucide-react';

import { TemplateDialog } from '@/src/components/record-dialogs';

export default function GameSetup() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { savedCourses, savedGroups, startNewGame, syncTemplates } = useGolfStore();

  const [totalHoles, setTotalHoles] = useState<9 | 18>(9);
  const [startingLoop, setStartingLoop] = useState<'Front' | 'Back'>('Front');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- R2 Media Storage State Pipeline ---
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function fetchDatabaseTemplates() {
      try {
        const res = await fetch('/api/sync');
        if (!res.ok) throw new Error('Could not load courses and groups. Check the database and reload.');
        if (res.ok) {
          const payload = await res.json();

          const coursesFromDb = payload.courses || [];
          const groupsFromDb = payload.groups || [];

          syncTemplates(coursesFromDb, groupsFromDb);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load saved templates.');
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
      setUploadError('');
      triggerFeedback();

      const signRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      const signed = await signRes.json();
      if (!signRes.ok) throw new Error(signed.error || 'Could not upload this photo.');
      const { uploadUrl, publicUrl } = signed;

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('R2 cloud storage rejection');
      setImageUrl(publicUrl);
    } catch (err) {
      console.error('Upload operation failed:', err);
      setUploadError(err instanceof Error ? err.message : 'Could not attach this photo. Try again or start without it.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStart = () => {
    triggerFeedback();
    const course = savedCourses.find(item => item.id === selectedCourseId) ?? savedCourses[0];
    const group = savedGroups.find(item => item.id === selectedGroupId) ?? savedGroups[0];
    if (!course || !group) { setError('Add a course and player group before starting.'); return; }
    if ((totalHoles === 18 || startingLoop === 'Back') && course.pars.length < 18) {
      setError('Choose an 18-hole course for this round configuration.'); return;
    }

    startNewGame({
      courseId: course.id,
      courseName: course.name,
      totalHoles,
      startingLoop,
      players: group.players,
      coursePars: course.pars,
      imageUrl: imageUrl || undefined
    });
    router.push('/play');
  };

  return (
    <div className="w-full max-w-xl md:max-w-3xl mx-auto min-h-[100dvh] bg-white text-black font-sans p-0 md:p-4 pb-14 subpixel-antialiased flex flex-col justify-between pb-[calc(3.5rem+env(safe-area-inset-bottom))] px-4 md:px-6">

        {/* Top Header Navigation Panel */}
        <div className="relative flex items-center justify-center pt-4 px-1 min-h-[56px] flex-shrink-0 w-full">
        {/* Absolute aligned back button safely clears text space */}
        <button
            aria-label="Back to dashboard"
            onClick={() => { triggerFeedback(); router.push('/'); }}
            className="absolute left-1 p-3 bg-[#F4F6F9] border border-[#F1F5F9]/40 text-[#1C1C1E] active:bg-[#F1F5F9] rounded-2xl transition shadow-[0_4px_10px_rgba(0,0,0,0.01)] z-10"
        >
            <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Clean, centered text frame */}
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1C1E] text-center">
            Setup Match
        </h1>
        </div>

      {/* --- CENTERING MIDDLE WRAPPER ZONE --- */}
      <div className="flex-1 flex flex-col justify-center space-y-6 py-6 min-h-0">

        {/* Media Context Container */}
        <div className="px-1 mx-auto w-full">
          <input
            aria-label="Round photo"
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
              className="w-full aspect-[4/3] flex flex-col items-center justify-center border border-dashed border-[#C7C7CC] bg-[#F4F6F9] rounded-3xl hover:bg-[#F1F5F9]/50 transition duration-150"
            >
              <Camera className="w-5 h-5 text-[#8E8E93] mb-1" />
              <span className="text-xs font-bold text-[#8E8E93]">
                {isUploading ? 'Uploading photo…' : 'Add a round photo (optional)'}
              </span>
            </button>
          ) : (
            <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden relative border border-[#F1F5F9]/40 shadow-xs bg-[#F4F6F9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Active Snapshot Selection Layout Preview"
                className="w-full h-full object-cover"
              />

              <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                <button
                  aria-label="Replace round photo"
                  onClick={() => { triggerFeedback(); fileInputRef.current?.click(); }}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:bg-black/60 shadow-md transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  aria-label="Remove round photo"
                  onClick={() => { triggerFeedback(); setImageUrl(null); }}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-[#FF3B30] active:bg-black/60 shadow-md transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-3 left-3 bg-black/60 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full backdrop-blur-xs uppercase tracking-wider">
                Preview Image
              </div>
            </div>
          )}
        </div>

        {uploadError && <p role="alert" className="px-1 text-sm text-red-700">{uploadError}</p>}

        {/* Selection Tab Section */}
        <div className="px-1 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-2 pl-0.5">Round Configuration</label>
            <div className="grid grid-cols-2 gap-1.5 bg-[#F4F6F9] p-1 rounded-2xl border border-[#F1F5F9]/30 text-xs">
              <button type="button" aria-pressed={totalHoles === 9} onClick={() => { triggerFeedback(); setTotalHoles(9); }} className={`py-2.5 rounded-xl font-bold transition ${totalHoles === 9 ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>9 Holes</button>
              <button type="button" aria-pressed={totalHoles === 18} onClick={() => { triggerFeedback(); setTotalHoles(18); }} className={`py-2.5 rounded-xl font-bold transition ${totalHoles === 18 ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>18 Holes</button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-2 pl-0.5">Starting Tee</label>
            <div className="grid grid-cols-2 gap-1.5 bg-[#F4F6F9] p-1 rounded-2xl border border-[#F1F5F9]/30 text-xs">
              <button type="button" aria-pressed={startingLoop === 'Front'} onClick={() => { triggerFeedback(); setStartingLoop('Front'); }} className={`py-2.5 rounded-xl font-bold transition ${startingLoop === 'Front' ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>Front 9 (H1)</button>
              <button type="button" aria-pressed={startingLoop === 'Back'} onClick={() => { triggerFeedback(); setStartingLoop('Back'); }} className={`py-2.5 rounded-xl font-bold transition ${startingLoop === 'Back' ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>Back 9 (H10)</button>
            </div>
          </div>
        </div>

        {/* Dropdown Selection Blocks */}
        <div className="px-1 space-y-5">
          <div className="space-y-2">
            <label htmlFor="course" className="text-base font-bold text-[#1C1C1E] block pl-0.5">Course Template</label>
            <div className="relative flex items-center bg-[#F4F6F9] rounded-2xl border border-transparent transition-all">
              <select
                id="course" disabled={isLoading}
                value={selectedCourseId || savedCourses[0]?.id || ''}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-transparent font-medium text-[14px] text-[#1C1C1E] py-3.5 pl-4 pr-24 focus:outline-none appearance-none cursor-pointer truncate z-10"
              >
                {savedCourses.length === 0 ? (
                  <option value={0}>{isLoading ? 'Loading layouts...' : 'No saved courses yet'}</option>
                ) : (
                  savedCourses.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.pars.length}H)</option>)
                )}
              </select>
              <div className="absolute right-3.5 flex items-center gap-2 z-20">
                <TemplateDialog entity="course" onSaved={course => setSelectedCourseId(course.id)}>
                  <button type="button" aria-label="Add course" className="flex size-10 items-center justify-center text-[#047857] rounded-lg"><Plus className="size-4" /></button>
                </TemplateDialog>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#8E8E93]/80 pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="group" className="text-base font-bold text-[#1C1C1E] block pl-0.5">Player Group</label>
            <div className="relative flex items-center bg-[#F4F6F9] rounded-2xl border border-transparent">
              <select
                id="group" disabled={isLoading}
                value={selectedGroupId || savedGroups[0]?.id || ''}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-transparent font-medium text-[14px] text-[#1C1C1E] py-3.5 pl-4 pr-24 focus:outline-none appearance-none cursor-pointer truncate z-10"
              >
                {savedGroups.length === 0 ? (
                  <option value={0}>No groups available</option>
                ) : (
                  savedGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — ({g.players.join(', ')})
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-3.5 z-20 flex items-center gap-2">
                <TemplateDialog entity="group" onSaved={group => setSelectedGroupId(group.id)}>
                  <button type="button" aria-label="Add player group" className="flex size-10 items-center justify-center text-[#047857] rounded-lg"><Plus className="size-4" /></button>
                </TemplateDialog>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#8E8E93]/80"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
        </div>

      </div>

      {error && <p role="alert" className="mb-3 px-1 text-sm text-red-700">{error}</p>}
      {/* Start Button */}
      <button disabled={isLoading || isUploading || !savedCourses.length || !savedGroups.length} onClick={handleStart} className="w-full bg-[#059669]  text-white font-bold py-4 rounded-3xl shadow-[0_8px_20px_rgba(52,199,89,0.15)] shrink-0 active:scale-[0.99] transition text-sm tracking-tight mb-2">
        {isLoading ? 'Loading courses…' : isUploading ? 'Uploading photo…' : 'Start Round'}
      </button>

    </div>
  );
}
