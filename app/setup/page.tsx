"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Plus, Camera, ArrowLeft, Trash2, X, RefreshCw, Delete } from 'lucide-react';

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
        console.error("Could not sync live database parameters", err);
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
      pars: [4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4] 
    };
    const group = savedGroups[selectedGroupIdx];

    startNewGame({
      courseId: course.id,
      courseName: course.name,
      totalHoles,
      startingLoop,
      players: group?.players || ['Ayah', 'Luqman', 'Abang', 'Umar'],
      coursePars: course.pars,
      imageUrl: imageUrl || undefined
    });
    router.push('/play');
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-[100dvh] bg-white text-black font-sans p-4 pb-14 subpixel-antialiased flex flex-col justify-between select-none pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
            
        {/* Top Header Navigation Panel */}
        <div className="relative flex items-center justify-center pt-4 px-1 min-h-[56px] flex-shrink-0 w-full">
        {/* Absolute aligned back button safely clears text space */}
        <button 
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
        <div className="px-1">
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
              className="w-full aspect-[4/3] flex flex-col items-center justify-center border border-dashed border-[#C7C7CC] bg-[#F4F6F9] rounded-3xl hover:bg-[#F1F5F9]/50 transition duration-150"
            >
              <Camera className="w-5 h-5 text-[#8E8E93] mb-1" />
              <span className="text-xs font-bold text-[#8E8E93]">
                {isUploading ? 'Uploading to R2...' : 'Drop image here / Tap to select'}
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
                  onClick={() => { triggerFeedback(); fileInputRef.current?.click(); }}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:bg-black/60 shadow-md transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button 
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

        {/* Selection Tab Section */}
        <div className="px-1 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-2 pl-0.5">Round Configuration</label>
            <div className="grid grid-cols-2 gap-1.5 bg-[#F4F6F9] p-1 rounded-2xl border border-[#F1F5F9]/30 text-xs">
              <button type="button" onClick={() => { triggerFeedback(); setTotalHoles(9); }} className={`py-2.5 rounded-xl font-bold transition ${totalHoles === 9 ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>9 Holes</button>
              <button type="button" onClick={() => { triggerFeedback(); setTotalHoles(18); }} className={`py-2.5 rounded-xl font-bold transition ${totalHoles === 18 ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>18 Holes</button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-2 pl-0.5">Starting Tee</label>
            <div className="grid grid-cols-2 gap-1.5 bg-[#F4F6F9] p-1 rounded-2xl border border-[#F1F5F9]/30 text-xs">
              <button type="button" onClick={() => { triggerFeedback(); setStartingLoop('Front'); }} className={`py-2.5 rounded-xl font-bold transition ${startingLoop === 'Front' ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>Front 9 (H1)</button>
              <button type="button" onClick={() => { triggerFeedback(); setStartingLoop('Back'); }} className={`py-2.5 rounded-xl font-bold transition ${startingLoop === 'Back' ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>Back 9 (H10)</button>
            </div>
          </div>
        </div>

        {/* Dropdown Selection Blocks */}
        <div className="px-1 space-y-5">
          <div className="space-y-2">
            <label className="text-base font-bold text-[#1C1C1E] block pl-0.5">Course Template</label>
            <div className="relative flex items-center bg-[#F4F6F9] rounded-2xl border border-transparent transition-all">
              <select 
                value={selectedCourseIdx} 
                onChange={(e) => setSelectedCourseIdx(Number(e.target.value))} 
                className="w-full bg-transparent font-medium text-[14px] text-[#1C1C1E] py-3.5 pl-4 pr-16 focus:outline-none appearance-none cursor-pointer truncate z-10"
              >
                {savedCourses.length === 0 ? (
                  <option value={0}>{isLoading ? 'Loading layouts...' : 'Default Layout (Par 36)'}</option>
                ) : (
                  savedCourses.map((c, idx) => <option key={c.id} value={idx}>{c.name} ({c.pars.length}H)</option>)
                )}
              </select>
              <div className="absolute right-3.5 flex items-center gap-2 z-20">
                <button 
                  type="button"
                  onClick={() => { triggerFeedback(); setIsModalOpen(true); }} 
                  className="p-1 text-[#007AFF] hover:bg-[#F1F5F9]/60 active:scale-95 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#8E8E93]/80 pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-base font-bold text-[#1C1C1E] block pl-0.5">Turn Group Flight</label>
            <div className="relative flex items-center bg-[#F4F6F9] rounded-2xl border border-transparent">
              <select 
                value={selectedGroupIdx} 
                onChange={(e) => setSelectedGroupIdx(Number(e.target.value))} 
                className="w-full bg-transparent font-medium text-[14px] text-[#1C1C1E] py-3.5 pl-4 pr-10 focus:outline-none appearance-none cursor-pointer truncate z-10"
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
              <div className="absolute right-3.5 z-20 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#8E8E93]/80"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Start Button */}
      <button onClick={handleStart} className="w-full bg-[#059669]  text-white font-bold py-4 rounded-3xl shadow-[0_8px_20px_rgba(52,199,89,0.15)] shrink-0 active:scale-[0.99] transition text-sm tracking-tight mb-2">
        Start Round
      </button>

      {/* Course Entry Modal */}
      {isModalOpen && (
        /* Centered Backdrop Wrapper via items-center */
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative shadow-2xl border border-[#CBD5E1] animate-scale-up">
            
            {/* 1. Top Right Discard Close Button Icon */}
            <button 
                type="button"
                onClick={() => { triggerFeedback(); setIsModalOpen(false); }}
                className="absolute top-4 right-4 p-1.5 text-[#475569] hover:bg-[#F1F5F9] rounded-xl transition"
            >
                <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* 2. Modal Header */}
            <h3 className="font-extrabold text-lg text-[#0F172A] mb-4 pr-8">
                New Course Layout
            </h3>
            
            <div className="space-y-4">
                {/* 3. Lighter weight, high-contrast text input */}
                <div>
                <input 
                    type="text" 
                    placeholder="Club / Course Name" 
                    value={newCourseName} 
                    onChange={(e) => setNewCourseName(e.target.value)} 
                    className="w-full p-3.5 bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] rounded-2xl font-medium text-sm focus:outline-none placeholder-[#475569]/60" 
                />
                </div>

                {/* 4. ✨ NEW LOOK: High-Contrast Premium Obsidian & Amber Gold Monitor */}
                <div className="bg-[#0F172A] text-[#F59E0B] p-4 rounded-2xl min-h-[56px] flex items-center justify-center font-mono font-black tracking-widest text-xl shadow-inner border border-black">
                {newCoursePars ? (
                    newCoursePars
                ) : (
                    <span className="text-white font-medium font-sans text-xs tracking-normal animate-pulse">
                    Tap sequence par from the button below...
                    </span>
                )}
                </div>

                {/* 5. Fluid Tactile Grid Action Matrix */}
                <div className="grid grid-cols-5 gap-2 w-full">
                {[3, 4, 5].map(num => (
                    <button 
                    key={num} 
                    type="button"
                    onClick={() => { triggerFeedback(); setNewCoursePars(prev => prev + num + ' '); }} 
                    className="bg-[#F1F5F9] active:bg-[#CBD5E1] border border-[#CBD5E1] py-3.5 font-black text-lg rounded-xl transition text-[#0F172A] flex items-center justify-center"
                    >
                    {num}
                    </button>
                ))}

                {/* Icon Button: Delete (Amber Highlight) */}
                <button 
                    type="button"
                    onClick={() => { triggerFeedback(); setNewCoursePars(prev => prev.slice(0, -2)); }} 
                    className="bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] rounded-xl flex items-center justify-center active:bg-[#FDE68A] transition"
                >
                    <Delete className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Icon Button: Save (Sport Emerald Green) */}
                <button 
                    type="button"
                    onClick={() => {
                    if(!newCourseName || !newCoursePars) return;
                    triggerFeedback();
                    const parsArray = newCoursePars.trim().split(' ').map(Number);
                    useGolfStore.setState(s => ({ savedCourses: [...s.savedCourses, { id: `c_${Date.now()}`, name: newCourseName, pars: parsArray }] }));
                    setIsModalOpen(false);
                    }} 
                    className="bg-[#059669] text-white rounded-xl flex items-center justify-center active:bg-[#047857] shadow-sm shadow-[#059669]/20 transition"
                >
                    <Plus className="w-5 h-5 stroke-3" />
                </button>
                </div>
            </div>

            </div>
        </div>
        )}
    </div>
  );
}