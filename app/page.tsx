"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import {
  ChevronRight,
  Play,
  RotateCw,
  Image as ImageIcon,
  Flag,
  Plus,
  ArrowUpRight,
  Home,
  History,
  Users,
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

const avatarTones = [
  'bg-forest text-white',
  'bg-mint text-[#08301f]',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
];

function ProgressRing({ value }: { value: number }) {
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="5"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="#A8EE7D"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (safeValue / 100) * circumference}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-white">
        {Math.round(safeValue)}%
      </span>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { history, activeGame, savedGroups } = useGolfStore();

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
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const stringDay = today.toLocaleDateString(undefined, { weekday: 'long' });
  const stringFullDate = today.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const primaryGroup = savedGroups[0];
  const flightPlayers = primaryGroup?.players || [];

  const seasonBest = (() => {
    const totals = history.flatMap((game) =>
      game.players.map((_, pIdx) =>
        Object.values(game.scoresJson).reduce(
          (acc: number, scores: number[]) => acc + (scores[pIdx] || 0),
          0
        )
      )
    );
    const valid = totals.filter((t) => t > 0);
    return valid.length > 0 ? Math.min(...valid) : null;
  })();

  const holesPlayed = activeGame
    ? Object.values(activeGame.scoresJson).filter(
        (scores) => Array.isArray(scores) && scores.some((score) => score > 0)
      ).length
    : 0;
  const activeProgress = activeGame ? (holesPlayed / activeGame.totalHoles) * 100 : 0;

  return (
    <div className="min-h-[100dvh] w-full bg-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(1.15rem+env(safe-area-inset-top))] font-sans text-ink antialiased select-none">
      <div className="mx-auto w-full max-w-md px-4">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 pt-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-subtle">
              Family Golf
            </p>
            <h1
              className="mt-2 text-[26px] font-semibold leading-none tracking-tight"
              suppressHydrationWarning
            >
              {greeting}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle" suppressHydrationWarning>
              {stringDay} · {stringFullDate}
            </p>
          </div>

          <div className="relative shrink-0 pt-1">
            <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/golf-family.jpg"
                alt="User profile avatar"
                className="h-full w-full object-cover"
              />
            </div>
            {isSyncing && (
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-canvas bg-white text-subtle shadow-card">
                <RotateCw className="h-3 w-3 animate-spin" />
              </span>
            )}
          </div>
        </header>

        {/* Hero card */}
        <section className="hero-mesh animate-rise relative mt-6 overflow-hidden rounded-[30px] p-5 text-white shadow-hero">
          <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-mint/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-forest/40 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">
                {activeGame ? 'Round in progress' : 'Family Golf Club'}
              </p>
              <h2 className="mt-2 truncate text-[22px] font-semibold leading-tight tracking-tight">
                {activeGame ? activeGame.courseName : 'Ready to tee off?'}
              </h2>
              <p className="mt-1 text-[12px] leading-snug text-white/60">
                {activeGame
                  ? `${activeGame.totalHoles} holes · ${activeGame.players.length} players`
                  : 'Track every stroke. Share every round.'}
              </p>
            </div>
            <span className="glass grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
              <Flag className="h-5 w-5 text-white/80" />
            </span>
          </div>

          {activeGame ? (
            <div className="relative mt-5 flex items-center gap-4">
              <ProgressRing value={activeProgress} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                  Through
                </p>
                <p className="mt-1 text-lg font-semibold leading-none">
                  {holesPlayed} <span className="text-sm font-normal text-white/50">of {activeGame.totalHoles} holes</span>
                </p>
                <div className="mt-2 flex gap-1.5 overflow-hidden">
                  {activeGame.players.slice(0, 4).map((player, idx) => (
                    <span
                      key={player}
                      className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-medium text-white/70"
                    >
                      {player}
                      {idx === 3 && activeGame.players.length > 4 ? '…' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative mt-6 flex items-end gap-6">
              <div>
                <p className="text-[46px] font-semibold leading-none tracking-tight">
                  {history.length}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/50">
                  Rounds logged
                </p>
              </div>
              <span className="mb-1 h-9 w-px bg-white/15" />
              <div>
                <p className="text-[26px] font-semibold leading-none tracking-tight">
                  {seasonBest ?? '—'}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/50">
                  Best score
                </p>
              </div>
            </div>
          )}

          {activeGame ? (
            <button
              onClick={() => {
                triggerFeedback();
                router.push('/play');
              }}
              className="relative mt-5 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-ink shadow-lg shadow-black/20 transition active:scale-[0.99]"
            >
              <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                <Play className="h-4 w-4 fill-current" />
                Resume round
              </span>
              <ArrowUpRight className="h-4 w-4 text-subtle" />
            </button>
          ) : (
            <Link
              href="/setup"
              onClick={triggerFeedback}
              className="relative mt-5 flex w-full items-center justify-between rounded-2xl bg-mint px-4 py-3.5 text-[#08301f] shadow-lg shadow-black/20 transition active:scale-[0.99]"
            >
              <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                <Flag className="h-4 w-4" />
                Start a round
              </span>
              <ArrowUpRight className="h-4 w-4 opacity-60" />
            </Link>
          )}
        </section>

        {/* Flight card */}
        {primaryGroup && (
          <section
            className="animate-rise mt-4 rounded-[26px] bg-white p-4 shadow-card"
            style={{ animationDelay: '60ms' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-subtle">
                  Your flight
                </p>
                <p className="mt-1 truncate text-sm font-semibold">{primaryGroup.name}</p>
              </div>
              <Link
                href="/setup"
                onClick={triggerFeedback}
                className="shrink-0 rounded-full bg-canvas px-3 py-1.5 text-[10px] font-semibold text-subtle transition active:bg-line"
              >
                Manage
              </Link>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex -space-x-2">
                {flightPlayers.slice(0, 4).map((player, idx) => (
                  <span
                    key={player}
                    className={`grid h-9 w-9 place-items-center rounded-full border-2 border-white text-[10px] font-semibold ${avatarTones[idx % avatarTones.length]}`}
                  >
                    {player.slice(0, 2).toUpperCase()}
                  </span>
                ))}
                {flightPlayers.length > 4 && (
                  <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-canvas text-[10px] font-semibold text-subtle">
                    +{flightPlayers.length - 4}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-subtle">
                <Users className="h-3.5 w-3.5" />
                {flightPlayers.length} players
              </span>
            </div>
          </section>
        )}

        {/* Recent rounds */}
        <section id="recent" className="mt-7 scroll-mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Recent rounds</h2>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-subtle shadow-card">
              {history.length}
            </span>
          </div>

          {isSyncing && history.length === 0 ? (
            <div className="mt-3 space-y-3">
              {[1, 2, 3].map((skel) => (
                <div key={skel} className="flex animate-pulse items-center gap-3 rounded-[24px] bg-white p-3 shadow-card">
                  <div className="h-14 w-14 shrink-0 rounded-[18px] bg-canvas" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded-full bg-canvas" />
                    <div className="h-2.5 w-1/3 rounded-full bg-canvas" />
                  </div>
                  <div className="h-8 w-10 rounded-xl bg-canvas" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="mt-3 rounded-[26px] bg-white px-6 py-10 text-center shadow-card">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-canvas text-subtle">
                <History className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold">No rounds yet</p>
              <p className="mt-1 text-xs text-subtle">Your scorecards will show up here.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {history.slice(0, visibleCount).map((game, idx) => {
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
                    className="animate-rise flex items-center gap-3 rounded-[24px] bg-white p-3 shadow-card transition active:scale-[0.99]"
                    style={{ animationDelay: `${Math.min(idx, 5) * 40}ms` }}
                  >
                    {game.imageUrl ? (
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[18px] bg-canvas">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={game.imageUrl}
                          alt="Round thumbnail"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="hero-mesh flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] text-white/70">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold leading-snug">
                        {game.courseName}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-subtle">
                        {new Date(game.date).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {' · '}
                        {game.totalHoles} holes · {game.players.length} players
                      </p>
                    </div>

                    {hasWinner ? (
                      <div className="shrink-0 rounded-xl bg-canvas px-2.5 py-1.5 text-center">
                        <p className="font-mono text-base font-semibold leading-none">{winningScore}</p>
                        <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-subtle">
                          Best
                        </p>
                      </div>
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-subtle/60" />
                    )}
                  </Link>
                );
              })}

              {visibleCount < history.length && (
                <div ref={loaderRef} className="flex w-full justify-center py-4 text-subtle">
                  <RotateCw className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Floating glass nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))]">
        <div className="glass-light flex items-center gap-1 rounded-full border border-white/60 p-1.5 shadow-float">
          <Link
            href="/"
            onClick={triggerFeedback}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-3 py-3 text-[11px] font-semibold text-white"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/setup"
            onClick={triggerFeedback}
            className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-3 text-[11px] font-semibold text-subtle transition active:bg-white/60"
          >
            <Plus className="h-4 w-4" />
            New round
          </Link>
          <a
            href="#recent"
            className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-3 text-[11px] font-semibold text-subtle transition active:bg-white/60"
          >
            <History className="h-4 w-4" />
            Rounds
          </a>
        </div>
      </nav>
    </div>
  );
}
