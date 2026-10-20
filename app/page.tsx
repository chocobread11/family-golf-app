"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { ChevronRight, Play, RotateCw, Image as ImageIcon, Flag } from 'lucide-react';

interface SyncGame {
  id: string;
  date: string;
  courseId: string;
  courseName?: string;
  course?: { name?: string; pars?: number[] };
  totalHoles: number;
  players: string[];
  scoresJson: Record<string, number[]>;
  imageUrl?: string;
}

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

          const formattedHistory = gamesList.map((g: SyncGame) => ({
            id: g.id,
            date: g.date,
            courseId: g.courseId,
            courseName: g.course?.name || 'Unknown Course Layout',
            totalHoles: g.totalHoles,
            players: g.players,
            scoresJson: g.scoresJson,
            coursePars: g.course?.pars || [],
            imageUrl: g.imageUrl,
          }));

          useGolfStore.setState({ history: formattedHistory });
          if (payload.courses) useGolfStore.setState({ savedCourses: payload.courses });
        }
      } catch (err) {
        console.error('Failed background dashboard handshake:', err);
      } finally {
        setIsSyncing(false);
      }
    }
    pullCloudHistory();
  }, []);

  // 2. Unlimited Lazy Loading Intersection Observer Implementation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < history.length) {
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 5, history.length));
          }, 200);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [visibleCount, history.length]);

  // Dynamic Date Calculations
  const today = new Date();
  const stringDay = today.toLocaleDateString(undefined, { weekday: 'long' });
  const stringFullDate = today.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col bg-white px-5 pb-10 pt-[calc(1rem+env(safe-area-inset-top))] font-sans text-[#111111] antialiased select-none md:max-w-3xl md:px-8">
      {/* Header — intentionally part of the page canvas, no card */}
      <header className="flex items-center justify-between gap-5 pt-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">
            Family Golf
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[#111111]">
            Guten Morgen
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-normal text-neutral-500">
            {stringDay} · {stringFullDate}
            {isSyncing && <RotateCw className="h-3 w-3 animate-spin text-neutral-400" />}
          </p>
        </div>

        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/golf-family.jpg"
            alt="User profile avatar snapshot"
            className="h-full w-full object-cover"
          />
        </div>
      </header>

      {/* Primary action — sits directly on the canvas */}
      <div className="mt-8">
        {activeGame ? (
          <button
            onClick={() => {
              triggerFeedback();
              router.push('/play');
            }}
            className="flex w-full items-center justify-between rounded-2xl bg-[#111111] px-5 py-4 text-white transition active:scale-[0.99] active:bg-black"
          >
            <span className="flex items-center gap-3">
              <Play className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">Resume active match</span>
            </span>
            <ChevronRight className="h-4 w-4 text-white/40" />
          </button>
        ) : (
          <Link
            href="/setup"
            onClick={triggerFeedback}
            className="flex w-full items-center justify-between rounded-2xl bg-[#111111] px-5 py-4 text-white transition active:scale-[0.99] active:bg-black"
          >
            <span className="flex items-center gap-3">
              <Flag className="h-4 w-4" />
              <span className="text-sm font-medium">Start a match</span>
            </span>
            <ChevronRight className="h-4 w-4 text-white/40" />
          </Link>
        )}
      </div>

      {/* Saved matches */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Saved matches
          </h2>
          <span className="text-[10px] font-medium text-neutral-400">{history.length}</span>
        </div>

        {isSyncing && history.length === 0 ? (
          <div className="mt-2 divide-y divide-neutral-100">
            {[1, 2, 3].map((skel) => (
              <div key={skel} className="flex animate-pulse items-center gap-4 py-4">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-neutral-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded-full bg-neutral-100" />
                  <div className="h-2.5 w-1/3 rounded-full bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-neutral-500">No rounds yet</p>
            <p className="mt-1 text-xs text-neutral-400">Your scorecards will show up here.</p>
          </div>
        ) : (
          <div className="mt-2 divide-y divide-neutral-100">
            {history.slice(0, visibleCount).map((game) => {
              const playerTotals = game.players.map((_, pIdx) =>
                Object.values(game.scoresJson).reduce(
                  (acc: number, scores: number[]) => acc + (scores[pIdx] || 0),
                  0
                )
              );
              const winningScore = Math.min(...playerTotals.filter((t) => t > 0));
              const hasWinner = winningScore !== Infinity && winningScore > 0;

              return (
                <Link
                  key={game.id}
                  href={`/score/${game.id}`}
                  onClick={triggerFeedback}
                  className="group flex items-center gap-4 py-4 transition active:opacity-60"
                >
                  {game.imageUrl ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={game.imageUrl}
                        alt="Round summary thumbnail"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-snug text-[#111111]">
                      {game.courseName}
                    </p>
                    <p className="mt-1 text-[11px] font-normal text-neutral-400">
                      {new Date(game.date).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                      })}
                      {' · '}
                      {game.totalHoles} holes
                      {hasWinner && ` · best ${winningScore}`}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-500" />
                </Link>
              );
            })}

            {visibleCount < history.length && (
              <div ref={loaderRef} className="flex w-full justify-center py-4 text-neutral-400">
                <RotateCw className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
