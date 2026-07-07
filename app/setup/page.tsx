"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Plus, Camera, ArrowLeft, Trash2, X, RefreshCw } from 'lucide-react';

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
          const groupsFromDb = payload.groups || []; // ✨ Captured from backend database
  
          // Sync with your Zustand cache
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
    <div className="w-full max-w-md mx-auto min-h-[100dvh] bg-white text-black font-sans p-4 pb-6 flex flex-col justify-between antialiased select-none">
      <div className="space-y-6">
        
        {/* Top Header Navigation Panel */}
        <div className="flex items-center gap-20 pt-4 px-1">
          <button 
            onClick={() => { triggerFeedback(); router.push('/'); }}
            className="p-3 bg-[#F4F6F9] border border-[#E5E5EA]/40 text-[#1C1C1E] active:bg-[#E5E5EA] rounded-2xl transition shadow-[0_4px_10px_rgba(0,0,0,0.01)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1C1E]">Setup Match</h1>
        </div>

        {/* --- TOP ZONE: MINIMAL LOW-PADDING MEDIA CONTEXT CONTAINER --- */}
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
              className="w-full aspect-[4/3] flex flex-col items-center justify-center border border-dashed border-[#C7C7CC] bg-[#F4F6F9] rounded-3xl hover:bg-[#E5E5EA]/50 transition duration-150"
            >
              <Camera className="w-5 h-5 text-[#8E8E93] mb-1" />
              <span className="text-xs font-bold text-[#8E8E93]">
                {isUploading ? 'Uploading to R2...' : 'Drop image here / Tap to select'}
              </span>
            </button>
          ) : (
            // Dedicated 4:3 Resolution Frame Layer with Dual Floating Actions
            <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden relative border border-[#E5E5EA]/40 shadow-xs bg-[#F4F6F9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt="Active Snapshot Selection Layout Preview" 
                className="w-full h-full object-cover"
              />
              
              {/* Stacked Floating Circular Control Buttons */}
              <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                {/* Button A: Retake / Swap Input */}
                <button 
                  onClick={() => { triggerFeedback(); fileInputRef.current?.click(); }}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:bg-black/60 shadow-md transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                {/* Button B: Clear / Delete Image Link */}
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

        {/* --- STRIPPED SELECTION TAB SECTION (No Background Layer Wrap) --- */}
        <div className="px-1 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-2 pl-0.5">Round Configuration</label>
            <div className="grid grid-cols-2 gap-1.5 bg-[#F4F6F9] p-1 rounded-2xl border border-[#E5E5EA]/30 text-xs">
              <button onClick={() => { triggerFeedback(); setTotalHoles(9); }} className={`py-2.5 rounded-xl font-bold transition ${totalHoles === 9 ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>9 Holes</button>
              <button onClick={() => { triggerFeedback(); setTotalHoles(18); }} className={`py-2.5 rounded-xl font-bold transition ${totalHoles === 18 ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>18 Holes</button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest block mb-2 pl-0.5">Starting Tee</label>
            <div className="grid grid-cols-2 gap-1.5 bg-[#F4F6F9] p-1 rounded-2xl border border-[#E5E5EA]/30 text-xs">
              <button onClick={() => { triggerFeedback(); setStartingLoop('Front'); }} className={`py-2.5 rounded-xl font-bold transition ${startingLoop === 'Front' ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>Front 9 (H1)</button>
              <button onClick={() => { triggerFeedback(); setStartingLoop('Back'); }} className={`py-2.5 rounded-xl font-bold transition ${startingLoop === 'Back' ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:bg-white/60'}`}>Back 9 (H10)</button>
            </div>
          </div>
        </div>

        {/* --- UPDATED DROPDOWN SELECTION FIELD BLOCKS --- */}
        <div className="px-1 space-y-5">
        
        {/* Course Template Input Field */}
        <div className="space-y-2">
            <label className="text-base font-bold text-[#1C1C1E] block pl-0.5">
            Course Template
            </label>
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
            
            {/* Dynamic Action Buttons Stack inside the selection pill */}
            <div className="absolute right-3.5 flex items-center gap-2 z-20">
                <button 
                type="button"
                onClick={() => { triggerFeedback(); setIsModalOpen(true); }} 
                className="p-1 text-[#007AFF] hover:bg-[#E5E5EA]/60 active:scale-95 rounded-lg transition"
                >
                <Plus className="w-4 h-4" />
                </button>
                {/* Fintech Native Styled Dropdown Chevron Arrow Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#8E8E93]/80 pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            </div>
        </div>

        {/* Turn Group Flight Input Field */}
        <div className="space-y-2">
            <label className="text-base font-bold text-[#1C1C1E] block pl-0.5">
            Turn Group Flight
            </label>
            <div className="relative flex items-center bg-[#F4F6F9] rounded-2xl border border-transparent">
            <select 
                value={selectedGroupIdx} 
                onChange={(e) => setSelectedGroupIdx(Number(e.target.value))} 
                className="w-full bg-transparent font-medium text-[14px] text-[#1C1C1E] py-3.5 pl-4 pr-10 focus:outline-none appearance-none cursor-pointer truncate z-10"
            >
                {savedGroups.length === 0 ? (
                <option value={0}>No groups available</option>
                ) : (
                // ✨ Dynamic flight row text mapping straight from your database columns!
                savedGroups.map((g, idx) => (
                    <option key={g.id} value={idx}>
                    {g.name} — ({g.players.join(', ')})
                    </option>
                ))
                )}
            </select>
            
            {/* Fintech Native Styled Dropdown Chevron Arrow Icon */}
            <div className="absolute right-3.5 z-20 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#8E8E93]/80"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            </div>
        </div>

        </div>
      </div>

      <button onClick={handleStart} className="w-full bg-[#34C759] text-white font-bold py-4 rounded-3xl shadow-[0_8px_20px_rgba(52,199,89,0.15)] mt-6 active:scale-[0.99] transition text-sm tracking-tight">
        Start Round
      </button>

      {/* Course Entry Action Sheet Pop-up Modal Layout */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-[#E5E5EA]/30 transform translate-y-0 transition-transform">
            <h3 className="font-extrabold text-base text-center text-[#1C1C1E]">New Course Layout</h3>
            <input type="text" placeholder="Club / Course Name" value={newCourseName} onChange={(e)=>setNewCourseName(e.target.value)} className="w-full p-3.5 bg-[#F4F6F9] border border-[#E5E5EA]/20 rounded-2xl font-bold text-sm focus:outline-none placeholder-[#8E8E93]" />
            <div className="bg-[#1C1C1E] text-[#34C759] p-3.5 rounded-2xl min-h-[46px] text-center font-mono font-bold tracking-widest text-base shadow-inner">
              {newCoursePars || <span className="text-[#8E8E93] font-normal font-sans text-xs tracking-normal">Tap sequence below</span>}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[3,4,5].map(num => (
                <button key={num} onClick={() => { triggerFeedback(); setNewCoursePars(prev => prev + num + ' '); }} className="bg-[#F4F6F9] active:bg-[#E5E5EA] border border-[#E5E5EA]/20 py-3.5 font-extrabold text-base rounded-2xl transition text-[#1C1C1E]">{num}</button>
              ))}
              <button onClick={() => { triggerFeedback(); setNewCoursePars(prev => prev.slice(0, -2)); }} className="bg-[#FFE0B2] border border-[#FFE0B2] text-[#E65100] font-bold text-xs uppercase rounded-2xl">Del</button>
              <button onClick={() => {
                if(!newCourseName || !newCoursePars) return;
                triggerFeedback();
                const parsArray = newCoursePars.trim().split(' ').map(Number);
                useGolfStore.setState(s => ({ savedCourses: [...s.savedCourses, { id: `c_${Date.now()}`, name: newCourseName, pars: parsArray }] }));
                setIsModalOpen(false);
              }} className="bg-[#34C759] text-white font-bold text-xs uppercase rounded-2xl">Save</button>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="w-full text-center text-xs text-[#FF3B30] font-bold pt-1">Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}