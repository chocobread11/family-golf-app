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
      else navigator.vibrate(12);
    }
  };

  if (!activeGame) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-canvas px-5 font-sans text-ink antialiased">
        <div className="w-full max-w-sm rounded-[30px] bg-white p-7 text-center shadow-float">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-canvas text-forest">
            <Flag className="h-6 w-6" />
          </span>
          <p className="mt-4 text-base font-semibold tracking-tight">No active round</p>
          <p className="mt-1 text-sm text-subtle">Set up a match to start scoring.</p>
          <button
            onClick={() => {
              triggerFeedback('tap');
              router.push('/setup');
            }}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-forest to-forest-deep py-3.5 text-sm font-semibold text-white transition active:scale-[0.99]"
          >
            Setup match
          </button>
        </div>
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

  return (
    <div className="min-h-[100dvh] w-full bg-canvas font-sans text-ink antialiased select-none">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-[calc(1.15rem+env(safe-area-inset-top))]">
        {/* Top navigation */}
        <div className="flex flex-shrink-0 items-center justify-between">
          <button
            onClick={prevStep}
            disabled={stepIdx === 0}
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-card transition active:scale-95 disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="glass-light rounded-full border border-white/60 px-4 py-2 shadow-card">
            <span className="text-[11px] font-semibold text-subtle">
              Hole <span className="text-ink">{stepIdx + 1}</span> / {totalSteps}
            </span>
          </div>

          <button
            onClick={nextStep}
            disabled={stepIdx === totalSteps - 1}
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-card transition active:scale-95 disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Segmented progress */}
        <div className="mt-4 flex flex-shrink-0 gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= stepIdx ? 'bg-forest' : 'bg-ink/10'
              }`}
            />
          ))}
        </div>

        {/* Hole hero */}
        <div className="hero-mesh relative mt-4 flex-shrink-0 overflow-hidden rounded-[28px] p-5 text-white shadow-hero">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-mint/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-forest/40 blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">
                Now playing
              </p>
              <h2 className="mt-1 text-[62px] font-semibold leading-none tracking-tight">
                {activeHole}
              </h2>
            </div>
            <div className="glass rounded-2xl px-3.5 py-2.5 text-center">
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/60">Par</p>
              <p className="mt-0.5 text-2xl font-semibold leading-none">{parVal}</p>
            </div>
          </div>

          {/* Player score chips */}
          <div className="no-scrollbar relative mt-4 flex gap-2 overflow-x-auto">
            {activeGame.players.map((player, idx) => {
              const val = currentScores[idx];
              return (
                <div
                  key={player}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5 backdrop-blur-sm"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[8px] font-semibold">
                    {player.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-[11px] text-white/75">{player}</span>
                  <span
                    className={`font-mono text-sm font-semibold ${
                      val ? 'text-mint' : 'text-white/35'
                    }`}
                  >
                    {val || '—'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Entry display */}
          <div className="glass relative mt-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <p className="shrink-0 text-[9px] font-medium uppercase tracking-[0.16em] text-white/50">
              Entry
            </p>
            <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto text-right font-mono text-xl font-medium tracking-[0.16em]">
              {rawString ? (
                <span className="whitespace-nowrap">{rawString}</span>
              ) : (
                <span className="font-sans text-[11px] font-normal tracking-normal text-white/40">
                  Tap the keypad
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Keypad */}
        <div className="mt-auto pt-4">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => handleKeyPress(String(n))}
                className="flex h-[52px] items-center justify-center rounded-[18px] bg-white text-lg font-semibold text-ink shadow-card transition active:scale-[0.96] active:bg-canvas"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => handleKeyPress('SPACE')}
              className="flex h-[52px] items-center justify-center rounded-[18px] bg-white text-subtle shadow-card transition active:scale-[0.96] active:bg-canvas"
            >
              <Space className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className="flex h-[52px] items-center justify-center rounded-[18px] bg-white text-lg font-semibold text-ink shadow-card transition active:scale-[0.96] active:bg-canvas"
            >
              0
            </button>
            <button
              onClick={() => handleKeyPress('BACK')}
              className="flex h-[52px] items-center justify-center rounded-[18px] bg-white text-subtle shadow-card transition active:scale-[0.96] active:bg-canvas"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Primary action */}
        <button
          onClick={stepIdx === totalSteps - 1 ? handleFinishRound : nextStep}
          className="mt-3 w-full flex-shrink-0 rounded-[20px] bg-gradient-to-r from-forest to-forest-deep py-4 text-sm font-semibold text-white shadow-lg shadow-forest/25 transition active:scale-[0.99]"
        >
          {stepIdx === totalSteps - 1 ? 'Save & finish' : 'Next hole'}
        </button>
      </div>
    </div>
  );
}
