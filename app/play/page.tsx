"use client";
import { Button } from "@/src/components/ui/button";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { ChevronLeft, ChevronRight, Delete, Space } from 'lucide-react';
import { saveRecord, toGameState, type GameRecord } from '@/src/lib/golf-api';
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { cn } from '@/src/lib/utils';

export default function PlayMatch() {
  const router = useRouter();
  const { activeGame, updateHoleScores } = useGolfStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const [entry, setEntry] = useState<{ hole: number; value: string } | null>(null);

  const totalSteps = activeGame?.totalHoles || 9;
  const loopOffset = activeGame?.startingLoop === 'Back' ? 10 : 1;
  const playedHoles = Array.from({ length: totalSteps }, (_, i) => {
    let num = i + loopOffset;
    if (activeGame?.totalHoles === 9 && activeGame?.startingLoop === 'Back') {
      // If playing 9 holes starting from Back, holes are 10-18
      num = 10 + i;
    } else {
      // Standard calculation
      num = i + loopOffset;
      if (num > 18) num -= (num > 18 ? 18 : 0);
    }
    return num;
  });

  const activeHole = playedHoles[stepIdx];
  const parVal = activeGame?.coursePars[activeHole - 1] || 4;
  const savedScores = activeGame?.scoresJson[String(activeHole)];
  const rawString = entry?.hole === activeHole ? entry.value : savedScores?.length ? savedScores.join(' ') + ' ' : '';
  const setRawString = (next: React.SetStateAction<string>) => {
    setEntry({ hole: activeHole, value: typeof next === 'function' ? next(rawString) : next });
  };
  const currentScores = rawString.trim().split(/\s+/);

  // --- Haptic Feedback Engine ---
  const triggerFeedback = (type: 'tap' | 'error' | 'success') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'error') navigator.vibrate([40, 40, 40]);
      else if (type === 'success') navigator.vibrate([15, 30, 15]);
      else navigator.vibrate(12); // Standard tap for dials and navigation
    }
  };

  if (!activeGame) {
    return (
      <main className="w-full max-w-3xl mx-auto h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-center antialiased">
        <p className="text-sm font-bold text-[#62626A]">No active round found.</p>
        <Button variant="ghost"
          onClick={() => {
            triggerFeedback('tap');
            router.push('/setup');
          }}
          className="mt-4 px-5 py-3 bg-[#1C1C1E] text-white rounded-2xl font-bold text-xs shadow-sm transition active:scale-[0.98]"
        >
          Setup Match
        </Button>
      </main>
    );
  }

  const handleKeyPress = (val: string) => {
    triggerFeedback('tap'); // <--- Haptics fire on every dial press here
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
    if (scoresArray.length > activeGame.players.length || scoresArray.some(score => !Number.isInteger(score) || score < 0 || score > 99)) {
      setSaveError('Enter one score per player, from 0 to 99. Use Space between players.');
      return false;
    }
    setSaveError('');

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

  const handleFinishRound = async () => {
    if (isSaving || !handleSaveHoleState()) return;
    const snapshot = useGolfStore.getState().activeGame;
    if (!snapshot) return;
    setIsSaving(true);
    try {
      const { game } = await saveRecord<{ game: GameRecord }>('game', snapshot, false);
      useGolfStore.setState(state => ({ history: [toGameState(game), ...state.history.filter(item => item.id !== game.id)], activeGame: null }));
      triggerFeedback('success');
      router.push(`/score/${game.id}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this round. Your scores are kept on this device. Try again.');
    } finally { setIsSaving(false); }
  };

  const nextStep = () => {
    triggerFeedback('tap'); // Added haptics for navigation
    if (!handleSaveHoleState()) return;
    if (stepIdx < totalSteps - 1) {
      setEntry(null);
      setStepIdx(p => p + 1);
    }
  };

  const prevStep = () => {
    triggerFeedback('tap'); // Added haptics for navigation
    if (!handleSaveHoleState()) return;
    if (stepIdx > 0) {
      setEntry(null);
      setStepIdx(p => p - 1);
    }
  };

  return (
    <main className="w-full max-w-3xl mx-auto h-dvh bg-white text-black font-sans px-2 sm:px-4 md:px-6 pt-4 md:pt-6 subpixel-antialiased flex flex-col justify-between overflow-x-hidden overflow-y-auto select-none pb-[calc(0.5rem+env(safe-area-inset-bottom))]">

      {/* iOS Top Bar Navigation */}
      <div className="flex items-center justify-between pb-3 pt-1 flex-shrink-0">
        <Button variant="ghost"
          aria-label="Previous hole"
          onClick={prevStep}
          disabled={stepIdx === 0 || isSaving}
          className="p-3 bg-[#F4F6F9] border border-[#F1F5F9]/40 text-[#1C1C1E] active:bg-[#F1F5F9] rounded-2xl disabled:opacity-20 transition shadow-xs"
        >
          <ChevronLeft className="w-5 h-5"/>
        </Button>
        <div className="text-center space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1E] tracking-tight">Hole {activeHole}</h1>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="h-auto bg-[#FFF3E0] px-3 py-1 text-sm text-[#9A3412]">Par {parVal}</Badge>
            <span role="status" className="text-xs text-[#62626A] tabular-nums">{stepIdx + 1} of {totalSteps}</span>
          </div>
          <Progress value={stepIdx + 1} max={totalSteps} aria-label="Round progress" aria-valuetext={`${stepIdx + 1} of ${totalSteps} holes. Playing hole ${activeHole}.`} className="mx-auto my-1 h-1.5 w-36 rounded-full" />
          <Button variant="ghost" disabled={isSaving} onClick={() => { if (handleSaveHoleState()) router.push('/'); }} className="block mx-auto min-h-11 px-3 py-2 text-sm font-semibold text-[#62626A]">Save & exit</Button>
        </div>
        {stepIdx === totalSteps - 1 ? (
          <Button
            onClick={handleFinishRound}
            disabled={isSaving}
            className="bg-[#047857] text-white font-bold text-xs uppercase h-12 tracking-wider px-4 py-3 rounded-2xl transition shadow-sm"
          >
            {isSaving ? 'Saving…' : 'Finish'}
          </Button>
        ) : (
          <Button variant="ghost"
            aria-label="Next hole"
            disabled={isSaving}
            onClick={nextStep}
            className="p-3 bg-[#F4F6F9] border border-[#F1F5F9]/40 text-[#1C1C1E] active:bg-[#F1F5F9] rounded-2xl transition shadow-xs"
          >
            <ChevronRight className="w-5 h-5"/>
          </Button>
        )}
      </div>

      {/* --- STANDARDIZED MID ZONE CONTAINER --- */}
      <div className="flex-1 grid grid-rows-[auto_1fr] min-h-40 py-2">

        {/* Row 1: Input Monitor Block */}
        <div className="w-full text-center font-mono text-3xl font-bold tracking-widest tabular-nums text-[#047857] h-10 flex items-center justify-center">
            {rawString || (
            <span className="text-[#62626A] text-[16px] tracking-normal font-sans font-medium">
                Enter scores below
            </span>
            )}
        </div>

        {/* Row 2: Dynamic Stable Roster List Container */}
        <div className="w-full px-0 sm:px-2 divide-y divide-[#F1F5F9]/50 overflow-y-auto min-h-0">
            {activeGame.players.map((p, idx) => (
            <div key={p} className="flex justify-between py-2 items-center border-transparent">
                <span className="text-xl font-bold text-[#1C1C1E] tracking-tight">{p}</span>
                <span className={cn('font-mono text-xl font-bold tracking-tight tabular-nums', currentScores[idx] ? 'text-black' : 'text-[#62626A]')}>
                {currentScores[idx] || '—'}
                </span>
            </div>
            ))}
        </div>

      </div>

      {/* --- 100% RESPONSIVE ADAPTIVE DOCK KEYPAD PANEL --- */}
      <div className="w-full max-w-md mx-auto bg-white px-0 py-2 sm:p-4 [@media(max-height:700px)]:py-1 rounded-3xl shrink-0 mb-1">
        {saveError && <p role="alert" className="mb-3 text-sm text-red-700">{saveError}</p>}
        <p className="mb-3 text-center text-xs text-[#62626A]">Use Space between each player’s score.</p>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3 w-full [@media(max-height:700px)]:gap-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <Button variant="ghost"
              key={n}
              disabled={isSaving}
              onClick={() => handleKeyPress(String(n))}
              className="w-full min-h-11 h-auto aspect-[4/2.4] [@media(max-height:700px)]:h-11 [@media(max-height:700px)]:aspect-auto bg-[#F4F6F9] active:bg-[#F1F5F9]/60 text-[#1C1C1E] text-xl font-bold rounded-2xl flex items-center justify-center transition border border-[#F1F5F9]/30"
            >
              {n}
            </Button>
          ))}
          <Button variant="ghost"
            aria-label="Next player's score (space)"
            disabled={isSaving}
            onClick={() => handleKeyPress('SPACE')}
            className="w-full min-h-11 h-auto aspect-[4/2.4] [@media(max-height:700px)]:h-11 [@media(max-height:700px)]:aspect-auto bg-[#E8F5E9] active:bg-[#C8E6C9] text-[#2E7D32] rounded-2xl flex items-center justify-center shadow-xs transition"
          >
            <Space className="w-5 h-5 stroke-[2.5]" />
          </Button>
          <Button variant="ghost"
            disabled={isSaving}
            onClick={() => handleKeyPress('0')}
            className="w-full min-h-11 h-auto aspect-[4/2.4] [@media(max-height:700px)]:h-11 [@media(max-height:700px)]:aspect-auto bg-[#F4F6F9] active:bg-[#F1F5F9]/60 text-[#1C1C1E] text-xl font-bold rounded-2xl flex items-center justify-center transition border border-[#F1F5F9]/30 shadow-xs"
          >
            0
          </Button>
          <Button variant="ghost"
            aria-label="Delete last digit"
            disabled={isSaving}
            onClick={() => handleKeyPress('BACK')}
            className="w-full min-h-11 h-auto aspect-[4/2.4] [@media(max-height:700px)]:h-11 [@media(max-height:700px)]:aspect-auto bg-[#FFEBEE] active:bg-[#FFCDD2] text-[#C62828] rounded-2xl flex items-center justify-center shadow-xs transition"
          >
            <Delete className="w-5 h-5 stroke-[2.5]" />
          </Button>
        </div>
      </div>

    </main>
  );
}
