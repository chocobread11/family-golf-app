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
    <div className="w-full max-w-md mx-auto h-[100dvh] bg-white text-black font-sans p-4 pb-14 subpixel-antialiased flex flex-col justify-between overflow-hidden select-none pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
      
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

      {/* --- ADAPTIVE MID SNAP ZONE --- */}
      <div className="flex-1 flex flex-col justify-center min-h-0 space-y-4 py-2">
        {/* Input Monitor Block */}
        <div className="w-full text-center font-mono text-4xl font-black tracking-widest text-[#34C759] min-h-[48px] flex items-center justify-center flex-shrink-0">
          {rawString || (
            <span className="text-[#8E8E93] text-[16px] tracking-normal font-sans font-bold opacity-60">
              Fill the score..
            </span>
          )}
        </div>

        {/* Dynamic Compacted Roster List Container */}
        <div className="w-full px-6 divide-y divide-[#E5E5EA]/50 overflow-y-auto min-h-0 flex-1">
          {activeGame.players.map((p, idx) => (
            <div key={p} className="flex justify-between py-3 items-center border-transparent">
              <span className="text-sm font-bold text-[#1C1C1E] tracking-tight">{p}</span>
              <span className={`font-mono text-xl font-black tracking-tight transition duration-100 ${currentScores[idx] ? 'text-black' : 'text-[#8E8E93]/20'}`}>
                {currentScores[idx] || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* --- 100% RESPONSIVE ADAPTIVE DOCK KEYPAD PANEL --- */}
      <div className="w-full bg-[#F4F6F9] border border-[#E5E5EA]/40 p-4 rounded-3xl flex-shrink-0 shadow-[0_8px_25px_rgba(0,0,0,0.01)] mb-2">
        <div className="grid grid-cols-3 gap-x-4 gap-y-3 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button 
              key={n} 
              onClick={() => handleKeyPress(String(n))} 
              className="w-full aspect-[4/2.8] bg-white active:bg-[#E5E5EA]/60 text-[#1C1C1E] text-xl font-bold rounded-2xl flex items-center justify-center transition border border-[#E5E5EA]/30 shadow-xs"
            >
              {n}
            </button>
          ))}
          <button 
            onClick={() => handleKeyPress('SPACE')} 
            className="w-full aspect-[4/2.8] bg-[#E8F5E9] active:bg-[#C8E6C9] text-[#2E7D32] border border-[#C8E6C9]/40 rounded-2xl flex items-center justify-center shadow-xs transition"
          >
            <Space className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button 
            onClick={() => handleKeyPress('0')} 
            className="w-full aspect-[4/2.8] bg-white active:bg-[#E5E5EA]/60 text-[#1C1C1E] text-xl font-bold rounded-2xl flex items-center justify-center transition border border-[#E5E5EA]/30 shadow-xs"
          >
            0
          </button>
          <button 
            onClick={() => handleKeyPress('BACK')} 
            className="w-full aspect-[4/2.8] bg-[#FFEBEE] active:bg-[#FFCDD2] text-[#C62828] border border-[#FFCDD2]/40 rounded-2xl flex items-center justify-center shadow-xs transition"
          >
            <Delete className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

    </div>
  );
}