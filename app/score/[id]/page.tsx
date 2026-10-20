"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Table2, ArrowLeft, Crown } from 'lucide-react';

export default function ScorePage() {
  const { id } = useParams();
  const router = useRouter();
  const { history } = useGolfStore();

  const game = history.find((g) => g.id === id);
  if (!game)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white p-8 text-center text-sm font-medium text-neutral-500">
        Scorecard missing.
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
  const leaders = ranked.filter((entry) => entry.total === bestScore).map((entry) => entry.name);

  const statRows = [
    { label: 'Birdies', hint: '(-1)', key: 'birdie' as const, dot: 'bg-[#34C759]' },
    { label: 'Pars', hint: '(E)', key: 'par' as const, dot: 'bg-[#007AFF]' },
    { label: 'Bogeys', hint: '(+1)', key: 'bogey' as const, dot: 'bg-[#FF9500]' },
    { label: 'Double+', hint: '(2+)', key: 'double' as const, dot: 'bg-[#FF3B30]' },
  ];

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col justify-between bg-white px-5 pb-8 pt-[calc(1rem+env(safe-area-inset-top))] font-sans text-[#111111] antialiased select-none md:max-w-3xl md:px-8">
      <div className="w-full">
        {/* Round photo — wooden frame kept as the single warm accent */}
        <div className="w-full rounded-2xl bg-[linear-gradient(135deg,#C9A26B_0%,#8A5A2B_25%,#C9A26B_50%,#7A4A21_75%,#B07D46_100%)] p-1.5">
          <div
            className={`relative overflow-hidden rounded-xl ${
              game.imageUrl
                ? 'h-64 md:h-72'
                : 'h-44 bg-gradient-to-br from-neutral-800 to-neutral-950'
            }`}
          >
            {game.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={game.imageUrl}
                  alt="Round Banner Background"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
                  Match settled
                </span>
              </div>
            )}

            <div className="relative z-10 flex h-full flex-col justify-between p-4 text-white">
              <button
                onClick={() => {
                  triggerFeedback();
                  router.push('/');
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm transition active:scale-95 active:bg-black/50"
              >
                <ArrowLeft className="h-4 w-4 text-white" />
              </button>

              <div>
                <h1 className="text-xl font-semibold leading-tight tracking-tight">
                  {game.courseName}
                </h1>
                <p className="mt-1 text-xs font-normal text-white/60">
                  {new Date(game.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  · {game.totalHoles} holes played
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats — flat typography only */}
        <div className="mt-7 grid grid-cols-3 border-y border-neutral-100 py-4">
          <div className="border-r border-neutral-100 text-center">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-400">Holes</p>
            <p className="mt-1 font-mono text-base font-medium text-[#111111]">{game.totalHoles}</p>
          </div>
          <div className="border-r border-neutral-100 text-center">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-400">
              Players
            </p>
            <p className="mt-1 font-mono text-base font-medium text-[#111111]">{game.players.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-400">Par</p>
            <p className="mt-1 font-mono text-base font-medium text-[#111111]">{totalParPlayed}</p>
          </div>
        </div>

        {/* Clubhouse leader */}
        {bestScore !== null && (
          <div className="flex items-center justify-between gap-4 border-b border-neutral-100 py-4">
            <span className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-neutral-400">
              <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              Clubhouse leader
            </span>
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-[#111111]">
              <span className="truncate">{leaders.join(' & ')}</span>
              <span className="font-mono text-neutral-400">{bestScore}</span>
            </span>
          </div>
        )}

        {/* Score table */}
        <section className="mt-7">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Score table
            </h3>
            <Table2 className="h-3.5 w-3.5 text-neutral-300" />
          </div>
          <div className="no-scrollbar overflow-x-auto border-t border-neutral-200">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="border-b border-neutral-100 text-[10px] uppercase tracking-wider text-neutral-400">
                  <th className="sticky left-0 z-10 bg-white p-3 text-left text-xs font-medium text-[#111111]">
                    Player
                  </th>
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((hNum) =>
                    game.scoresJson[String(hNum)] ? (
                      <th key={hNum} className="min-w-[42px] p-3 font-mono text-xs font-normal">
                        H{hNum}
                      </th>
                    ) : null
                  )}
                  <th className="p-3 text-xs font-medium text-[#111111]">Tot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                <tr className="text-xs text-neutral-400">
                  <td className="sticky left-0 z-10 bg-white p-3 text-left font-medium">Par</td>
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((hNum) =>
                    game.scoresJson[String(hNum)] ? (
                      <td key={hNum} className="p-3 font-mono text-[11px] font-normal">
                        {game.coursePars[hNum - 1] || 4}
                      </td>
                    ) : null
                  )}
                  <td className="p-3 font-mono text-xs font-medium">{totalParPlayed}</td>
                </tr>

                {game.players.map((name, pIdx) => (
                  <tr key={name}>
                    <td className="sticky left-0 z-10 bg-white p-3 text-left text-xs font-medium text-[#111111]">
                      {name}
                    </td>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((hNum) =>
                      game.scoresJson[String(hNum)] ? (
                        <td key={hNum} className="p-3 font-mono text-xs font-normal text-neutral-600">
                          {game.scoresJson[String(hNum)][pIdx] &&
                          game.scoresJson[String(hNum)][pIdx] !== 0
                            ? game.scoresJson[String(hNum)][pIdx]
                            : '—'}
                        </td>
                      ) : null
                    )}
                    <td className="p-3 font-mono text-sm font-medium text-[#111111]">
                      {totals[pIdx]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Performance grid */}
        <section className="mt-7">
          <h3 className="pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Performance
          </h3>
          <div className="no-scrollbar overflow-x-auto border-t border-neutral-200">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-[10px] uppercase tracking-wider text-neutral-400">
                  <th className="py-3 text-left font-medium">Metric</th>
                  {game.players.map((p) => (
                    <th key={p} className="py-3 text-xs font-medium text-[#111111]">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {statRows.map((row) => (
                  <tr key={row.key}>
                    <td className="py-3 text-left">
                      <span className="flex items-center gap-2 font-medium text-neutral-600">
                        <span className={`h-1.5 w-1.5 rounded-full ${row.dot}`} />
                        {row.label}
                        <span className="text-[10px] font-normal text-neutral-400">{row.hint}</span>
                      </span>
                    </td>
                    {stats.map((s, i) => (
                      <td key={i} className="font-mono font-medium text-[#111111]">
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

      <div className="pt-8">
        <button
          onClick={() => {
            triggerFeedback();
            router.push('/');
          }}
          className="w-full rounded-2xl bg-[#111111] py-4 text-sm font-medium text-white transition active:scale-[0.99] active:bg-black"
        >
          Return to dashboard
        </button>
      </div>
    </div>
  );
}
