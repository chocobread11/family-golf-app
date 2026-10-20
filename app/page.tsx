"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import {
  Calendar,
  ChevronRight,
  Play,
  Trophy,
  RotateCw,
  Image as ImageIcon,
  Crown,
  Flag,
} from 'lucide-react';

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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col justify-start bg-background px-4 pb-8 pt-[calc(1rem+env(safe-area-inset-top))] font-sans text-foreground antialiased select-none md:max-w-3xl md:px-6">
      <header className="flex items-center justify-between gap-4 pb-2 pt-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-forest">Family Golf</p>
          <h1 className="mt-1.5 text-[30px] font-extrabold leading-none tracking-tight text-foreground">
            Guten Morgen
          </h1>
          <p className="mt-2 text-sm font-medium text-muted">Up for a round today?</p>
        </div>

        <div className="relative h-[72px] w-[72px] shrink-0">
          <div className="h-full w-full overflow-hidden rounded-full bg-[#EDE9E0] ring-4 ring-white shadow-[0_10px_24px_-8px_rgba(28,28,30,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/golf-family.jpg"
              alt="User profile avatar snapshot"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-[#34C759] ring-2 ring-white" />
        </div>
      </header>

      <div className="space-y-5 pt-5">
        {/* --- SECTION 1: TODAY HERO CARD --- */}
        <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(28,28,30,0.04),0_14px_30px_-22px_rgba(28,28,30,0.45)]">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EFEAE0]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/golf-swing.png"
              alt="Live Golf Swing Action Profile"
              className="h-full w-full scale-105 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#EAF3EC] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-forest">
              <Calendar className="h-3 w-3" /> Today
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold leading-tight tracking-tight text-foreground">
              {stringDay}
            </h2>
            <p className="mt-0.5 text-xs font-semibold tracking-tight text-muted">{stringFullDate}</p>
          </div>

          {isSyncing && (
            <div className="flex shrink-0 items-center justify-center rounded-full bg-[#F3F0E9] p-2 text-forest">
              <RotateCw className="h-3.5 w-3.5 animate-spin" />
            </div>
          )}
        </div>

        {/* --- ROUND LAUNCH PLATFORM ACTIONS TRIGGER --- */}
        <div>
          {activeGame ? (
            <button
              onClick={() => {
                triggerFeedback();
                router.push('/play');
              }}
              className="group flex w-full items-center justify-between gap-3 rounded-3xl bg-foreground px-5 py-4 text-left text-white shadow-[0_20px_34px_-22px_rgba(28,28,30,0.85)] transition active:scale-[0.99] active:opacity-95"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#34C759] text-[#062B16]">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                    In progress
                  </span>
                  <span className="block text-sm font-bold tracking-tight">Resume Active Match</span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-white/50 transition group-hover:translate-x-0.5" />
            </button>
          ) : (
            <Link
              href="/setup"
              onClick={triggerFeedback}
              className="group flex w-full items-center justify-between gap-3 rounded-3xl bg-forest px-5 py-4 text-white shadow-[0_20px_34px_-22px_rgba(11,107,58,0.9)] transition active:scale-[0.99] active:bg-forest-dark"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                  <Flag className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
                    New round
                  </span>
                  <span className="block text-sm font-bold tracking-tight">Start a match</span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-white/60 transition group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        {/* --- SECTION 2: DYNAMIC LAZY SCROLLABLE HISTORICAL LIST --- */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              Saved Matches
            </h3>
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-bold text-[#6B6B70]">
              {history.length} Round{history.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* SKELETON RENDER BLOCK: Displays while database is fetching */}
          {isSyncing && history.length === 0 ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((skel) => (
                <div
                  key={skel}
                  className="flex animate-pulse items-center justify-between rounded-3xl border border-line/60 bg-surface p-3.5"
                >
                  <div className="flex flex-1 items-center gap-3.5">
                    <div className="h-16 w-16 shrink-0 rounded-2xl bg-[#EFEAE0]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-2/3 rounded-full bg-[#EFEAE0]" />
                      <div className="h-2.5 w-1/3 rounded-full bg-[#EFEAE0]" />
                    </div>
                  </div>
                  <div className="ml-2 h-7 w-7 rounded-full bg-[#EFEAE0]" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface/60 p-12 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F0E9]">
                <Trophy className="h-5 w-5 text-[#C0BAAE]" />
              </span>
              <p className="text-sm font-bold text-[#6B6B70]">No rounds yet</p>
              <p className="mt-1 text-xs font-medium text-muted">Your scorecards will show up here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
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
                    className="group flex items-center gap-3.5 rounded-3xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(28,28,30,0.03)] transition duration-150 hover:border-[#D8D2C6] hover:shadow-[0_10px_24px_-18px_rgba(28,28,30,0.4)] active:scale-[0.99]"
                  >
                    {game.imageUrl ? (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-line/60 bg-[#EFEAE0]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={game.imageUrl}
                          alt="Round summary thumbnail"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line/60 bg-[#F7F4EE] text-[#C0BAAE]">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}

                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <p className="truncate text-sm font-bold leading-snug tracking-tight text-foreground">
                        {game.courseName}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-muted">
                        <span className="flex items-center gap-1 text-[#5F5F64]">
                          <Calendar className="h-3 w-3 text-forest" />
                          {new Date(game.date).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-[#D8D2C6]" />
                        <span>{game.totalHoles} holes</span>
                        {hasWinner && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3E2] px-2 py-0.5 text-[10px] font-bold text-[#B45309]">
                            <Crown className="h-3 w-3" />
                            Best {winningScore}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-[#C7C2B8] transition group-hover:translate-x-0.5 group-hover:text-forest" />
                  </Link>
                );
              })}

              {visibleCount < history.length && (
                <div ref={loaderRef} className="flex w-full justify-center py-4 text-muted">
                  <RotateCw className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
