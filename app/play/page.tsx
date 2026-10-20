"use client";
import React, { useState, useEffect } from 'react';
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
      <div className="mx-auto flex h-[100dvh] w-full max-w-xl flex-col items-center justify-center bg-white px-6 text-center antialiased md:max-w-3xl">
        <p className="text-base font-semibold tracking-tight text-[#111111]">No active round</p>
        <p className="mt-1 text-sm font-normal text-neutral-500">Set up a match to start scoring.</p>
        <button
          onClick={() => {
            triggerFeedback('tap');
            router.push('/setup');
          }}
          className="mt-5 rounded-xl bg-[#111111] px-6 py-3 text-xs font-medium text-white transition active:scale-[0.98] active:bg-black"
        >
          Setup match
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
    <div className="mx-auto flex h-[100dvh] w-full max-w-xl flex-col overflow-hidden bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] font-sans text-[#111111] subpixel-antialiased select-none md:max-w-3xl md:px-8">
      {/* Top navigation */}
      <div className="flex flex-shrink-0 items-center justify-between">
        <button
          onClick={prevStep}
          disabled={stepIdx === 0}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition active:scale-95 active:bg-neutral-100 disabled:opacity-25"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
          {stepIdx + 1} / {totalSteps}
        </span>

        {stepIdx === totalSteps - 1 ? (
          <button
            onClick={handleFinishRound}
            className="-mr-1 rounded-full bg-[#111111] px-4 py-2 text-[11px] font-medium text-white transition active:scale-95 active:bg-black"
          >
            Finish
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition active:scale-95 active:bg-neutral-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Hairline progress */}
      <div className="mt-4 h-px w-full flex-shrink-0 bg-neutral-200">
        <div
          className="h-px bg-[#111111] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hole header */}
      <div className="mt-7 flex flex-shrink-0 items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Hole</p>
          <h2 className="mt-1 text-6xl font-semibold leading-none tracking-tight text-[#111111]">
            {activeHole}
          </h2>
        </div>
        <div className="pb-1 text-right">
          <p className="text-sm font-medium text-[#111111]">Par {parVal}</p>
          <p className="mt-0.5 text-[11px] font-normal text-neutral-400">Stroke play</p>
        </div>
      </div>

      {/* Score input — flat, no container */}
      <div className="mt-6 flex h-16 flex-shrink-0 items-center justify-center overflow-x-auto border-b border-neutral-100 px-2 font-mono text-4xl font-medium tracking-[0.12em] text-[#111111] no-scrollbar">
        {rawString ? (
          <span className="whitespace-nowrap">{rawString}</span>
        ) : (
          <span className="font-sans text-xs font-normal tracking-normal text-neutral-300">
            Enter scores
          </span>
        )}
      </div>

      {/* Players */}
      <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar">
        {activeGame.players.map((p, idx) => (
          <div
            key={p}
            className="flex items-center justify-between border-b border-neutral-100 py-3.5"
          >
            <span className="truncate text-sm font-medium text-[#111111]">{p}</span>
            <span
              className={`font-mono text-xl font-medium tracking-tight transition duration-100 ${
                currentScores[idx] ? 'text-[#111111]' : 'text-neutral-300'
              }`}
            >
              {currentScores[idx] || '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Keypad */}
      <div className="mx-auto mt-4 w-full max-w-md flex-shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleKeyPress(String(n))}
              className="flex h-14 items-center justify-center rounded-xl bg-neutral-100 text-lg font-medium text-[#111111] transition active:scale-[0.97] active:bg-neutral-200"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => handleKeyPress('SPACE')}
            className="flex h-14 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition active:scale-[0.97] active:bg-neutral-200"
          >
            <Space className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="flex h-14 items-center justify-center rounded-xl bg-neutral-100 text-lg font-medium text-[#111111] transition active:scale-[0.97] active:bg-neutral-200"
          >
            0
          </button>
          <button
            onClick={() => handleKeyPress('BACK')}
            className="flex h-14 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition active:scale-[0.97] active:bg-neutral-200"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
