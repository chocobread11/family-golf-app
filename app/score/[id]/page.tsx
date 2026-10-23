"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Table2, ArrowLeft, Crown, Flag } from 'lucide-react';

export default function ScorePage() {
  const { id } = useParams();
  const router = useRouter();
  const { history } = useGolfStore();

  const game = history.find((g) => g.id === id);
  if (!game)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-canvas p-6 font-sans text-ink antialiased">
        <div className="w-full max-w-sm rounded-[30px] bg-white p-8 text-center shadow-float">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-canvas text-subtle">
            <Table2 className="h-6 w-6" />
          </span>
          <p className="mt-4 text-base font-semibold tracking-tight">Scorecard missing</p>
          <p className="mt-1 text-sm text-subtle">This round could not be found in your history.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-forest to-forest-deep py-3.5 text-sm font-semibold text-white transition active:scale-[0.99]"
          >
            Return home
          </button>
        </div>
      </div>
    );

  const triggerFeedback = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
  };

  const totals = game.players.map((_, pIdx) => {
    return Object.values(game.scoresJson).reduce((acc, scores) => {
      const score = scores[pIdx] || 0;
      return acc + (score === 0 ? 0 : score);
    }, 0);
  });

  const totalParPlayed = Array.from({ length: 18 }, (_, i) => i + 1).reduce((acc, hNum) => {
    const holeWasPlayed = game.scoresJson[String(hNum)];
    if (holeWasPlayed) {
      return acc + (game.coursePars[hNum - 1] || 4);
    }
    return acc;
  }, 0);

  const stats = game.players.map((_, pIdx) => {
    let birdie = 0,
      par = 0,
      bogey = 0,
      double = 0;
    Object.entries(game.scoresJson).forEach(([holeNum, scores]) => {
      const score = scores[pIdx];
      const pVal = game.coursePars[Number(holeNum) - 1] || 4;
      if (!score || score === 0) return;
      const diff = score - pVal;
      if (diff === -1) birdie++;
      else if (diff === 0) par++;
      else if (diff === 1) bogey++;
      else if (diff >= 2) double++;
    });
    return { birdie, par, bogey, double };
  });

  const ranked = totals
    .map((total, idx) => ({ name: game.players[idx], total }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => a.total - b.total);
  const bestScore = ranked.length > 0 ? ranked[0].total : null;

  const statRows = [
    { label: 'Birdies', hint: '(-1)', key: 'birdie' as const, dot: 'bg-mint' },
    { label: 'Pars', hint: '(E)', key: 'par' as const, dot: 'bg-forest' },
    { label: 'Bogeys', hint: '(+1)', key: 'bogey' as const, dot: 'bg-amber' },
    { label: 'Double+', hint: '(2+)', key: 'double' as const, dot: 'bg-red-500' },
  ];

  const playedHoles = Array.from({ length: 18 }, (_, i) => i + 1).filter(
    (hNum) => game.scoresJson[String(hNum)]
  );

  return (
    <div className="min-h-[100dvh] w-full bg-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(1.15rem+env(safe-area-inset-top))] font-sans text-ink antialiased select-none">
      <div className="mx-auto w-full max-w-md px-4">
        {/* Header */}
        <header className="flex items-center gap-3 pb-4 pt-2">
          <button
            onClick={() => {
              triggerFeedback();
              router.push('/');
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-card transition active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-subtle">
              Family Golf
            </p>
            <h1 className="mt-1 text-lg font-semibold leading-none tracking-tight">Scorecard</h1>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-subtle shadow-card">
            Final
          </span>
        </header>

        {/* Round hero */}
        <div className="animate-rise relative overflow-hidden rounded-[30px] shadow-float">
          {game.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={game.imageUrl}
                alt="Round banner"
                className="h-60 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/25" />
            </>
          ) : (
            <>
              <div className="hero-mesh h-56 w-full" />
              <div className="absolute inset-0 flex items-center justify-center text-white/15">
                <Flag className="h-24 w-24" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            </>
          )}

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <span className="glass rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80">
              {new Date(game.date).toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight">
              {game.courseName}
            </h2>
            <p className="mt-1 text-[11px] text-white/65">
              {game.totalHoles} holes · {game.players.length} players · Par {totalParPlayed}
            </p>
          </div>
        </div>

        {/* Summary strip */}
        <div className="animate-rise mt-4 grid grid-cols-3 divide-x divide-line rounded-[26px] bg-white py-4 shadow-card">
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-subtle">Holes</p>
            <p className="mt-1 font-mono text-base font-semibold">{game.totalHoles}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-subtle">Par</p>
            <p className="mt-1 font-mono text-base font-semibold">{totalParPlayed}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-subtle">Best</p>
            <p className="mt-1 font-mono text-base font-semibold">{bestScore ?? '—'}</p>
          </div>
        </div>

        {/* Leaderboard */}
        <section className="animate-rise mt-4 rounded-[26px] bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber">
                <Crown className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold tracking-tight">Leaderboard</h2>
            </div>
            <span className="text-[10px] font-medium text-subtle">Stroke play</span>
          </div>

          <div className="mt-3 space-y-2">
            {ranked.length === 0 ? (
              <p className="rounded-2xl bg-canvas px-4 py-5 text-center text-xs text-subtle">
                No scores were recorded for this round.
              </p>
            ) : (
              ranked.map((entry) => {
                const rank = ranked.findIndex((e) => e.total === entry.total) + 1;
                const isLeader = rank === 1;
                return (
                  <div
                    key={entry.name}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                      isLeader ? 'bg-forest/5' : 'bg-canvas/70'
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                        isLeader ? 'bg-mint text-[#08301f]' : 'bg-white text-subtle shadow-card'
                      }`}
                    >
                      {rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                      {entry.name}
                    </span>
                    {isLeader && (
                      <span className="hidden rounded-full bg-white px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-forest shadow-card sm:inline">
                        Leader
                      </span>
                    )}
                    <span className="font-mono text-lg font-semibold leading-none">{entry.total}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Score table */}
        <section className="mt-4 overflow-hidden rounded-[26px] bg-white shadow-card">
          <div className="flex items-center justify-between px-4 pb-3 pt-4">
            <h2 className="text-sm font-semibold tracking-tight">Score by hole</h2>
            <Table2 className="h-4 w-4 text-subtle/70" />
          </div>

          <div className="no-scrollbar overflow-x-auto border-t border-line">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-wider text-subtle">
                  <th className="sticky left-0 z-20 bg-white px-4 py-3 text-left text-[11px] font-semibold text-ink shadow-[8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                    Player
                  </th>
                  {playedHoles.map((hNum) => (
                    <th key={hNum} className="min-w-[42px] px-2 py-3 font-mono text-[11px] font-normal">
                      H{hNum}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-[11px] font-semibold text-ink">Tot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr className="text-[11px] text-subtle">
                  <td className="sticky left-0 z-20 bg-white px-4 py-3 text-left font-semibold shadow-[8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                    Par
                  </td>
                  {playedHoles.map((hNum) => (
                    <td key={hNum} className="px-2 py-3 font-mono font-normal">
                      {game.coursePars[hNum - 1] || 4}
                    </td>
                  ))}
                  <td className="px-3 py-3 font-mono font-semibold">{totalParPlayed}</td>
                </tr>

                {game.players.map((name, pIdx) => (
                  <tr key={name}>
                    <td className="sticky left-0 z-20 bg-white px-4 py-3 text-left text-[11px] font-semibold text-ink shadow-[8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                      {name}
                    </td>
                    {playedHoles.map((hNum) => (
                      <td key={hNum} className="px-2 py-3 font-mono text-[11px] text-subtle">
                        {game.scoresJson[String(hNum)][pIdx] &&
                        game.scoresJson[String(hNum)][pIdx] !== 0
                          ? game.scoresJson[String(hNum)][pIdx]
                          : '—'}
                      </td>
                    ))}
                    <td className="px-3 py-3 font-mono text-[13px] font-semibold text-ink">
                      {totals[pIdx]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Performance */}
        <section className="mt-4 rounded-[26px] bg-white p-4 shadow-card">
          <h2 className="pb-1 text-sm font-semibold tracking-tight">Performance</h2>

          <div className="no-scrollbar mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-wider text-subtle">
                  <th className="py-3 text-left font-semibold">Metric</th>
                  {game.players.map((p) => (
                    <th key={p} className="px-1 py-3 text-[11px] font-semibold text-ink">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {statRows.map((row) => (
                  <tr key={row.key}>
                    <td className="py-3 text-left">
                      <span className="flex items-center gap-2 text-[11px] font-semibold text-subtle">
                        <span className={`h-1.5 w-1.5 rounded-full ${row.dot}`} />
                        {row.label}
                        <span className="text-[9px] font-normal text-subtle/70">{row.hint}</span>
                      </span>
                    </td>
                    {stats.map((s, i) => (
                      <td key={i} className="px-1 font-mono text-[13px] font-semibold text-ink">
                        {s[row.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Sticky return */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto w-full max-w-md px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))]">
          <div className="glass-light rounded-[26px] border border-white/60 p-2 shadow-float">
            <button
              onClick={() => {
                triggerFeedback();
                router.push('/');
              }}
              className="w-full rounded-[20px] bg-ink py-3.5 text-sm font-semibold text-white transition active:scale-[0.99]"
            >
              Return to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
