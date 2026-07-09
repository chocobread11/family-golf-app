"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Calendar, ChevronRight, Play, Trophy, RotateCw, Image as ImageIcon } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { history, activeGame } = useGolfStore();
  
  // Start isSyncing as true so the skeleton shows immediately on mount
  const [isSyncing, setIsSyncing] = useState(true);
  
  // --- Lazy Loading Pagination State ---
  const [visibleCount, setVisibleCount] = useState(5);
  const loaderRef = useRef<HTMLDivElement>(null);

  const triggerFeedback = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
  };

  // 1. Data Hydration from PostgreSQL Backend Engine
  useEffect(() => {
    async function pullCloudHistory() {
      try {
        setIsSyncing(true);
        const res = await fetch('/api/sync');
        if (res.ok) {
          const payload = await res.json();
          const gamesList = payload.games || [];
          
          const formattedHistory = gamesList.map((g: any) => ({
            id: g.id,
            date: g.date,
            courseId: g.courseId,
            courseName: g.course?.name || "Unknown Course Layout",
            totalHoles: g.totalHoles,
            players: g.players,
            scoresJson: g.scoresJson,
            coursePars: g.course?.pars || [],
            imageUrl: g.imageUrl
          }));

          useGolfStore.setState({ history: formattedHistory });
          if (payload.courses) useGolfStore.setState({ savedCourses: payload.courses });
        }
      } catch (err) {
        console.error("Failed background dashboard handshake:", err);
      } finally {
        setIsSyncing(false);
      }
    }
    pullCloudHistory();
  }, []);

  // 2. Unlimited Lazy Loading Intersection Observer Implementation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < history.length) {
        setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + 5, history.length));
        }, 200);
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [visibleCount, history.length]);

  // Dynamic Date Calculations
  const today = new Date();
  const stringDay = today.toLocaleDateString(undefined, { weekday: 'long' });
  const stringFullDate = today.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="w-full max-w-md mx-auto min-h-[100dvh] bg-white text-black font-sans antialiased p-4 pb-6 flex flex-col justify-start select-none">
      
      <div className="flex items-center justify-between px-1.5 py-4 p-5 mb-4 shadow-[0_8px_25px_rgba(0,0,0,0.01)]">
        <div className="space-y-0.5">
          <h1 className="text-3xl font-extrabold text-[#1C1C1E] tracking-tight">
            Guten Morgen
          </h1>
          <p className="text-lg font-bold text-[#48484A] tracking-tight">
            Up for a golf today?
          </p>
        </div>
        
        <div className="w-40 h-40 rounded-full overflow-hidden bg-[#F1F5F9] flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/golf-family.jpg" 
            alt="User profile avatar snapshot" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* --- SECTION 1: DYNAMIC HERO HEADER CARD --- */}
        <div className="bg-[#F4F6F9] rounded-3xl p-5 border border-[#F1F5F9]/50 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex items-center justify-between gap-4">
          
          <div className="w-1/4 aspect-square rounded-2xl overflow-hidden flex-shrink-0 relative flex items-center justify-center ">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/golf-swing.png" 
              alt="Live Golf Swing Action Profile" 
              className="w-full h-full object-cover scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Today</span>
            <h2 className="text-2xl font-extrabold text-[#1C1C1E] tracking-tight leading-tight mt-0.5">{stringDay}</h2>
            <p className="text-xs font-semibold text-[#8E8E93] mt-0.5 tracking-tight">{stringFullDate}</p>
          </div>

          {isSyncing && (
            <div className="p-2 bg-white text-[#007AFF] rounded-full animate-spin flex-shrink-0 self-start shadow-xs">
              <RotateCw className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* --- ROUND LAUNCH PLATFORM ACTIONS TRIGGER --- */}
        <div>
          {activeGame ? (
            <button 
              onClick={() => { triggerFeedback(); router.push('/play'); }}
              className="w-full flex items-center justify-center gap-2 bg-[#FF9500] text-white font-bold py-4 px-6 rounded-3xl active:scale-[0.98] active:opacity-90 shadow-[0_8px_20px_rgba(255,149,0,0.15)] transition text-sm tracking-tight"
            >
              <Play className="w-4 h-4 fill-current"/> Resume Active Match
            </button>
          ) : (
            <Link 
              href="/setup" 
              onClick={triggerFeedback}
              className="w-full flex items-center justify-center bg-[#059669] active:bg-black text-white font-bold py-4 px-6 rounded-3xl active:scale-[0.98] shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition text-sm tracking-tight"
            >
              Start a match
            </Link>
          )}
        </div>

        {/* --- SECTION 2: DYNAMIC LAZY SCROLLABLE HISTORICAL LIST --- */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93]">Saved Matches</h3>
            <span className="text-[11px] font-bold bg-[#F4F6F9] border border-[#F1F5F9]/40 text-[#48484A] px-2.5 py-0.5 rounded-full">
              {history.length} Saved Round{history.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* SKELETON RENDER BLOCK: Displays while database is fetching */}
          {isSyncing && history.length === 0 ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((skel) => (
                <div key={skel} className="flex items-center justify-between p-3.5 bg-[#F4F6F9]/60 border border-[#F1F5F9]/30 rounded-3xl animate-pulse">
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-[#E5E5EA] flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-[#E5E5EA] rounded-full w-2/3"></div>
                      <div className="h-2.5 bg-[#E5E5EA] rounded-full w-1/3"></div>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#E5E5EA] ml-2"></div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-[#F4F6F9] rounded-3xl border border-[#F1F5F9]/60 text-center">
              <Trophy className="w-8 h-8 text-[#C7C7CC] mb-2.5" />
              <p className="text-xs font-semibold text-[#8E8E93]">
                No golf logs found
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.slice(0, visibleCount).map((game) => {
                const playerTotals = game.players.map((_, pIdx) =>
                  Object.values(game.scoresJson).reduce((acc: number, scores: any) => acc + (scores[pIdx] || 0), 0)
                );
                const winningScore = Math.min(...playerTotals.filter(t => t > 0));

                return (
                  <Link 
                    key={game.id} 
                    href={`/score/${game.id}`} 
                    onClick={triggerFeedback}
                    className="flex items-center justify-between p-3.5 bg-[#F4F6F9] border border-[#F1F5F9]/50 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.005)] active:bg-[#F1F5F9]/50 active:scale-[0.99] transition duration-150 items-stretch"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {game.imageUrl ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#F1F5F9]/40 bg-white flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={game.imageUrl} alt="Round Summary thumb" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl border border-[#F1F5F9]/40 bg-white text-[#C7C7CC] flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <p className="font-bold text-sm text-[#1C1C1E] tracking-tight truncate leading-snug">
                          {game.courseName}
                        </p>
                        
                        <div className="flex items-center gap-2.5 text-[11px] text-[#8E8E93] font-medium">
                          <span className="flex items-center gap-1 text-black/70">
                            <Calendar className="w-3 h-3 text-[#007AFF]"/> 
                            {new Date(game.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="px-1.5 py-0.5 bg-white text-[#48484A] rounded-md font-bold text-[9px] border border-[#F1F5F9]/40">
                            {game.totalHoles} Holes
                          </span>
                          {winningScore !== Infinity && winningScore > 0 && (
                            <span className="text-[#34C759] font-mono font-extrabold">
                              Lowest: {winningScore}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center pl-2">
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#8E8E93] border border-[#F1F5F9]/30 shadow-xs">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}

              {visibleCount < history.length && (
                <div ref={loaderRef} className="w-full flex justify-center py-4 text-[#8E8E93]">
                  <RotateCw className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}