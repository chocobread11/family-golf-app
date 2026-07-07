"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { ChevronLeft, ChevronRight, Delete, Space } from 'lucide-react';

export default function PlayMatch() {
  const router = useRouter();
  const { activeGame, updateHoleScores, saveActiveToHistory } = useGolfStore();
  const [stepIdx, setStepIdx] = useState(0);
  const [rawString, setRawString] = useState('');

  // 1. Calculate values safely even if activeGame is temporarily null
  const totalSteps = activeGame?.totalHoles || 9;
  const loopOffset = activeGame?.startingLoop === 'Back' ? 10 : 1;
  const playedHoles = Array.from({ length: totalSteps }, (_, i) => {
    let num = i + loopOffset;
    if (num > 18) num -= 18;
    return num;
  });

  const activeHole = playedHoles[stepIdx];
  const parVal = activeGame?.coursePars[activeHole - 1] || 4;
  const currentScores = rawString.trim().split(/\s+/);

  // 2. State Sync Hook (MUST run before any conditional return statements!)
  useEffect(() => {
    if (!activeGame) return;

    const savedScoresForHole = activeGame.scoresJson[String(activeHole)];
    if (savedScoresForHole && savedScoresForHole.length > 0) {
      const reconstructedString = savedScoresForHole.join(' ') + ' ';
      setRawString(reconstructedString);
    } else {
      setRawString('');
    }
  }, [activeHole, activeGame]);

  // 3. Conditional Early Return (Placed safely after all Hooks are fully registered)
  if (!activeGame) {
    return (
      <div className="w-full max-w-md mx-auto h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-center antialiased">
        <p className="text-sm font-bold text-[#8E8E93]">No active round found.</p>
        <button 
          onClick={() => router.push('/setup')}
          className="mt-4 px-5 py-3 bg-[#1C1C1E] text-white rounded-2xl font-bold text-xs shadow-sm transition active:scale-[0.98]"
        >
          Setup Match
        </button>
      </div>
    );
  }

  const triggerFeedback = (type: 'tap' | 'error' | 'success') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'error') navigator.vibrate([40, 40, 40]);
      else if (type === 'success') navigator.vibrate([15, 30, 15]);
      else navigator.vibrate(12);
    }
  };

  const handleKeyPress = (val: string) => {
    triggerFeedback('tap');
    if (val === 'BACK') {
      setRawString(prev => prev.slice(0, -1));
    } else if (val === 'SPACE') {
      if (rawString.length > 0 && rawString[rawString.length - 1] !== ' ') {
        setRawString(prev => prev + ' ');
      }
    } else {
      setRawString(prev => prev + val);
    }
  };

  const handleSaveHoleState = () => {
    const cleanSegments = rawString.trim().split(/\s+/).filter(Boolean);
    const scoresArray = cleanSegments.map(Number);
    
    if (scoresArray.length === 0) {
      const emptyPlaceholderArray = Array(activeGame.players.length).fill(0);
      updateHoleScores(String(activeHole), emptyPlaceholderArray);
      return true;
    }
  
    const paddedScores = activeGame.players.map((_, idx) => {
      return scoresArray[idx] !== undefined ? scoresArray[idx] : 0;
    });
  
    updateHoleScores(String(activeHole), paddedScores);
    return true;
  };

  const handleFinishRound = () => {
    triggerFeedback('success');
    handleSaveHoleState();
    
    const finalSnapshot = saveActiveToHistory();
    if (finalSnapshot) {
      if (navigator.onLine) {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalSnapshot)
        }).catch(err => console.log("Sync server down. Saved locally inside cache."));
      }
      router.push(`/score/${finalSnapshot.id}`);
    }
  };

  const nextStep = () => {
    handleSaveHoleState();
    if (stepIdx < totalSteps - 1) {
      setStepIdx(p => p + 1);
    }
  };

  const prevStep = () => {
    handleSaveHoleState();
    if (stepIdx > 0) {
      setStepIdx(p => p - 1);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-[100dvh] bg-white text-black font-sans p-4 pb-6 flex flex-col justify-between antialiased overflow-hidden select-none">
      
      {/* iOS Top Bar Navigation */}
      <div className="flex items-center justify-between border-b border-[#E5E5EA]/40 pb-4 pt-2 flex-shrink-0">
        <button 
          onClick={prevStep} 
          disabled={stepIdx === 0} 
          className="p-3 bg-[#F4F6F9] border border-[#E5E5EA]/40 text-[#1C1C1E] active:bg-[#E5E5EA] rounded-2xl disabled:opacity-20 transition shadow-xs"
        >
          <ChevronLeft className="w-5 h-5"/>
        </button>
        <div className="text-center space-y-0.5">
          <h2 className="text-3xl font-extrabold text-[#1C1C1E] tracking-tight">Hole {activeHole}</h2>
          {/* ✨ UPDATED: Bigger Par Number Display Badge */}
          <span className="text-s font-bold uppercase tracking-widest text-[#48484A] bg-[#F4F6F9] border border-[#E5E5EA]/40 px-3.5 py-1 rounded-full inline-block">
            Par {parVal}
          </span>
        </div>
        {stepIdx === totalSteps - 1 ? (
          <button 
            onClick={handleFinishRound} 
            className="bg-[#34C759] text-white font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-2xl transition active:scale-[0.97] shadow-[0_4px_12px_rgba(52,199,89,0.2)]"
          >
            End Round
          </button>
        ) : (
          <button 
            onClick={nextStep} 
            className="p-3 bg-[#F4F6F9] border border-[#E5E5EA]/40 text-[#1C1C1E] active:bg-[#E5E5EA] rounded-2xl transition shadow-xs"
          >
            <ChevronRight className="w-5 h-5"/>
          </button>
        )}
      </div>

        {/* --- MINIMALIST OVERSIZED SCORING DISPLAY BLOCKS --- */}
        <div className="flex-1 flex flex-col justify-center space-y-6 my-4 max-h-[46dvh]">
        
        {/* Oversized Input Monitor Row */}
        <div className="w-full text-center font-mono text-5xl font-black tracking-widest text-[#34C759] min-h-[72px] flex items-center justify-center">
            {rawString || (
            <span className="text-[#8E8E93] text-[20px] tracking-normal font-sans font-bold opacity-60">
                Fill the score..
            </span>
            )}
        </div>

        {/* Borderless High-Contrast Player Roster Matrix */}
        <div className="w-full px-8 divide-y divide-[#E5E5EA]/50 overflow-y-auto">
            {activeGame.players.map((p, idx) => (
            <div key={p} className="flex justify-between py-4 items-center border-transparent">
                {/* Clean Left Aligned Name String */}
                <span className="text-base font-bold text-[#1C1C1E] tracking-tight">
                {p}
                </span>
                
                {/* Right Aligned Oversized Mono Score Text */}
                <span className={`font-mono text-2xl font-black tracking-tight transition duration-100 ${currentScores[idx] ? 'text-black' : 'text-[#8E8E93]/20'}`}>
                {currentScores[idx] || '—'}
                </span>
            </div>
            ))}
        </div>
      </div>

      {/* Tactile 3x4 iOS Circular Keyboard Grid */}
      <div className="bg-[#F4F6F9] border border-[#E5E5EA]/40 flex flex-col items-center justify-center p-5 rounded-3xl flex-shrink-0 mb-2 shadow-[0_8px_25px_rgba(0,0,0,0.01)]">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button 
              key={n} 
              onClick={() => handleKeyPress(String(n))} 
              className="w-28 h-20 bg-white active:bg-[#E5E5EA]/60 text-[#1C1C1E] text-2xl font-bold rounded-full flex items-center justify-center transition border border-[#E5E5EA]/30 shadow-xs"
            >
              {n}
            </button>
          ))}
          <button 
            onClick={() => handleKeyPress('SPACE')} 
            className="w-28 h-20 bg-[#E8F5E9] active:bg-[#C8E6C9] text-[#2E7D32] border border-[#C8E6C9]/40 rounded-full flex items-center justify-center shadow-xs transition"
          >
            <Space className="w-6 h-6 stroke-[2.5]" />
          </button>
          <button 
            onClick={() => handleKeyPress('0')} 
            className="w-28 h-20 bg-white active:bg-[#E5E5EA]/60 text-[#1C1C1E] text-2xl font-bold rounded-full flex items-center justify-center transition border border-[#E5E5EA]/30 shadow-xs"
          >
            0
          </button>
          <button 
            onClick={() => handleKeyPress('BACK')} 
            className="w-28 h-20 bg-[#FFEBEE] active:bg-[#FFCDD2] text-[#C62828] border border-[#FFCDD2]/40 rounded-full flex items-center justify-center shadow-xs transition"
          >
            <Delete className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      </div>

    </div>
  );
}