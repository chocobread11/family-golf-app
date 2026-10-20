"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { ChevronLeft, ChevronRight, Delete, Space, Flag } from 'lucide-react';

export default function PlayMatch() {
  const router = useRouter();
  const { activeGame, updateHoleScores, saveActiveToHistory } = useGolfStore();
  const [stepIdx, setStepIdx] = useState(0);
  const [rawString, setRawString] = useState('');

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
      if (num > 18) num -= num > 18 ? 18 : 0;
    }
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted scores when navigating holes
      setRawString(reconstructedString);
    } else {
      setRawString('');
    }
  }, [activeHole, activeGame]);

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
      <div className="mx-auto flex h-[100dvh] w-full max-w-xl flex-col items-center justify-center bg-background px-6 text-center antialiased md:max-w-3xl">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF3EC] text-forest">
          <Flag className="h-6 w-6" />
        </span>
        <p className="text-base font-extrabold tracking-tight text-foreground">No active round</p>
        <p className="mt-1 text-sm font-medium text-muted">Set up a match to start scoring.</p>
        <button
          onClick={() => {
            triggerFeedback('tap');
            router.push('/setup');
          }}
          className="mt-5 rounded-2xl bg-forest px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_14px_24px_-16px_rgba(11,107,58,0.9)] transition active:scale-[0.98] active:bg-forest-dark"
        >
          Setup Match
        </button>
      </div>
    );
  }

  const handleKeyPress = (val: string) => {
    triggerFeedback('tap');
    if (val === 'BACK') {
      setRawString((prev) => prev.slice(0, -1));
    } else if (val === 'SPACE') {
      if (rawString.length > 0 && rawString[rawString.length - 1] !== ' ') {
        setRawString((prev) => prev + ' ');
      }
    } else {
      setRawString((prev) => prev + val);
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
          body: JSON.stringify(finalSnapshot),
        }).catch(() => console.log('Sync server down. Saved locally inside cache.'));
      }
      router.push(`/score/${finalSnapshot.id}`);
    }
  };

  const nextStep = () => {
    triggerFeedback('tap');
    handleSaveHoleState();
    if (stepIdx < totalSteps - 1) {
      setStepIdx((p) => p + 1);
    }
  };

  const prevStep = () => {
    triggerFeedback('tap');
    handleSaveHoleState();
    if (stepIdx > 0) {
      setStepIdx((p) => p - 1);
    }
  };

  const progress = ((stepIdx + 1) / totalSteps) * 100;

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-xl flex-col overflow-hidden bg-background px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] font-sans text-foreground subpixel-antialiased select-none md:max-w-3xl md:px-6">
      {/* iOS Top Bar Navigation */}
      <div className="flex flex-shrink-0 items-center justify-between gap-3">
        <button
          onClick={prevStep}
          disabled={stepIdx === 0}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface text-foreground shadow-[0_2px_8px_rgba(28,28,30,0.05)] transition active:scale-95 active:bg-[#F3F0E9] disabled:opacity-25"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Hole {stepIdx + 1} of {totalSteps}
          </p>
          <div className="mx-auto mt-1.5 h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-[#E7E2D8]">
            <div
              className="h-full rounded-full bg-forest transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {stepIdx === totalSteps - 1 ? (
          <button
            onClick={handleFinishRound}
            className="h-11 rounded-2xl bg-forest px-4 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_12px_22px_-14px_rgba(11,107,58,0.9)] transition active:scale-95 active:bg-forest-dark"
          >
            Finish
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface text-foreground shadow-[0_2px_8px_rgba(28,28,30,0.05)] transition active:scale-95 active:bg-[#F3F0E9]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Hole header */}
      <div className="mt-4 flex flex-shrink-0 items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Hole</p>
          <h2 className="text-6xl font-black leading-none tracking-tighter text-foreground">
            {activeHole}
          </h2>
        </div>
        <div className="h-12 w-px bg-line" />
        <div className="flex flex-col items-start gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F3DDBB] bg-[#FEF3E2] px-3 py-1 text-xs font-bold text-[#B45309]">
            <Flag className="h-3 w-3" />
            Par {parVal}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Stroke play
          </span>
        </div>
      </div>

      {/* --- MID ZONE --- */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
        {/* Input Monitor Block */}
        <div className="flex h-14 w-full flex-shrink-0 items-center justify-center overflow-x-auto rounded-2xl border border-line bg-surface px-3 font-mono text-3xl font-black tracking-[0.15em] text-forest shadow-[inset_0_1px_3px_rgba(28,28,30,0.04)] no-scrollbar">
          {rawString ? (
            <span className="whitespace-nowrap">{rawString}</span>
          ) : (
            <span className="animate-pulse font-sans text-xs font-semibold tracking-normal text-[#B0AAA0]">
              Tap the keypad to enter scores
            </span>
          )}
        </div>

        {/* Dynamic Stable Roster List Container */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_1px_2px_rgba(28,28,30,0.03)]">
          <div className="h-full divide-y divide-line/70 overflow-y-auto no-scrollbar">
            {activeGame.players.map((p, idx) => (
              <div key={p} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#EAF3EC] text-xs font-extrabold text-forest">
                    {p.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate text-base font-bold tracking-tight text-foreground">
                    {p}
                  </span>
                </div>
                <span
                  className={`font-mono text-xl font-black tracking-tight transition duration-100 ${
                    currentScores[idx] ? 'text-foreground' : 'text-[#D5D0C6]'
                  }`}
                >
                  {currentScores[idx] || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- RESPONSIVE ADAPTIVE DOCK KEYPAD PANEL --- */}
      <div className="mx-auto mt-3 w-full max-w-md flex-shrink-0">
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleKeyPress(String(n))}
              className="flex h-14 items-center justify-center rounded-2xl border border-line bg-surface text-xl font-bold text-foreground shadow-[0_1px_2px_rgba(28,28,30,0.04)] transition active:scale-[0.97] active:bg-[#F3F0E9]"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => handleKeyPress('SPACE')}
            className="flex h-14 items-center justify-center rounded-2xl border border-[#D6E8DB] bg-[#EAF3EC] text-forest transition active:scale-[0.97] active:bg-[#DCEDE1]"
          >
            <Space className="h-5 w-5 stroke-[2.5]" />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="flex h-14 items-center justify-center rounded-2xl border border-line bg-surface text-xl font-bold text-foreground shadow-[0_1px_2px_rgba(28,28,30,0.04)] transition active:scale-[0.97] active:bg-[#F3F0E9]"
          >
            0
          </button>
          <button
            onClick={() => handleKeyPress('BACK')}
            className="flex h-14 items-center justify-center rounded-2xl border border-[#F8D7D7] bg-[#FDECEC] text-[#C62828] transition active:scale-[0.97] active:bg-[#FADDDD]"
          >
            <Delete className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
