"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Trophy, ArrowLeft, Table2, Crown, Flag, Users, Target } from 'lucide-react';

export default function ScorePage() {
  const { id } = useParams();
  const router = useRouter();
  const { history } = useGolfStore();

  const game = history.find((g) => g.id === id);
  if (!game)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-8 text-center text-sm font-bold text-muted">
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
    { label: 'Birdies', hint: '(-1)', key: 'birdie' as const, dot: 'bg-[#34C759]', text: 'text-[#1B7A3A]' },
    { label: 'Pars', hint: '(E)', key: 'par' as const, dot: 'bg-[#007AFF]', text: 'text-[#0060C7]' },
    { label: 'Bogeys', hint: '(+1)', key: 'bogey' as const, dot: 'bg-[#FF9500]', text: 'text-[#B45309]' },
    { label: 'Double+', hint: '(2+)', key: 'double' as const, dot: 'bg-[#FF3B30]', text: 'text-[#C62828]' },
  ];

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col justify-between bg-background px-4 pb-6 pt-[calc(1rem+env(safe-area-inset-top))] font-sans text-foreground antialiased select-none md:max-w-3xl md:px-6">
      <div className="w-full">
        {/* --- DYNAMIC HEADER (WOODEN FRAME) --- */}
        <div className="w-full rounded-3xl bg-[linear-gradient(135deg,#C9A26B_0%,#8A5A2B_25%,#C9A26B_50%,#7A4A21_75%,#B07D46_100%)] p-2 shadow-[0_18px_38px_-26px_rgba(109,69,34,0.8)]">
          <div
            className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
              game.imageUrl
                ? 'h-72 md:h-80'
                : 'h-48 bg-gradient-to-br from-[#16452E] via-[#0B2A1C] to-[#071B12]'
            }`}
          >
            {/* Background Media Asset */}
            {game.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={game.imageUrl}
                  alt="Round Banner Background"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/80" />
              </>
            ) : (
              <>
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-white/10" />
                <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full border border-white/10" />
                <Trophy className="absolute -bottom-6 right-4 h-40 w-40 text-white/5" />
              </>
            )}

            {/* Interface Overlay */}
            <div className="relative z-10 flex h-full flex-col justify-between p-4 text-white">
              <div className="flex items-start justify-between">
                <button
                  onClick={() => {
                    triggerFeedback();
                    router.push('/');
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-black/25 backdrop-blur-md transition active:scale-95 active:bg-black/50"
                >
                  <ArrowLeft className="h-4 w-4 text-white" />
                </button>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
                  {game.imageUrl ? 'Round Memory' : 'Match Settled'}
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight">
                  {game.courseName}
                </h1>
                <p className="mt-1 text-xs font-medium text-white/70">
                  {new Date(game.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  • {game.totalHoles} Holes Played
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-line bg-surface p-3 text-center shadow-[0_1px_2px_rgba(28,28,30,0.03)]">
            <Flag className="mx-auto h-3.5 w-3.5 text-forest" />
            <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Holes</p>
            <p className="font-mono text-lg font-black text-foreground">{game.totalHoles}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-3 text-center shadow-[0_1px_2px_rgba(28,28,30,0.03)]">
            <Users className="mx-auto h-3.5 w-3.5 text-forest" />
            <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Players</p>
            <p className="font-mono text-lg font-black text-foreground">{game.players.length}</p>
          </div>
          <div className="rounded-2xl border border-[#D6E8DB] bg-[#EAF3EC] p-3 text-center shadow-[0_1px_2px_rgba(28,28,30,0.03)]">
            <Target className="mx-auto h-3.5 w-3.5 text-forest" />
            <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-forest/70">Par</p>
            <p className="font-mono text-lg font-black text-forest">{totalParPlayed}</p>
          </div>
        </div>

        {/* Clubhouse Leader */}
        {bestScore !== null && (
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#F3DDBB] bg-[#FEF7EC] px-4 py-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#FBE3BF] text-[#B45309]">
              <Crown className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#B45309]/70">
                Clubhouse leader
              </p>
              <p className="truncate text-sm font-bold text-[#7C3D06]">{leaders.join(' & ')}</p>
            </div>
            <span className="font-mono text-lg font-black text-[#B45309]">{bestScore}</span>
          </div>
        )}

        {/* Score Table Container */}
        <div className="mt-5">
          <h3 className="flex items-center gap-1.5 pb-2 pl-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
            <Table2 className="h-3.5 w-3.5 text-amber" /> Score Table
          </h3>
          <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_1px_2px_rgba(28,28,30,0.03)]">
            <div className="no-scrollbar block overflow-x-auto">
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr className="border-b border-line bg-[#F7F4EE] text-[10px] font-bold uppercase tracking-wider text-muted">
                    <th className="sticky left-0 z-10 bg-[#F7F4EE] p-3 text-left text-xs font-bold text-foreground shadow-[1px_0_3px_rgba(0,0,0,0.04)]">
                      Player
                    </th>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((hNum) =>
                      game.scoresJson[String(hNum)] ? (
                        <th key={hNum} className="min-w-[42px] p-3 font-mono text-xs">
                          H{hNum}
                        </th>
                      ) : null
                    )}
                    <th className="bg-[#DCEDE1] p-3 text-xs font-bold text-forest">Tot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70 text-sm font-semibold">
                  <tr className="bg-[#F7F4EE]/60 text-xs text-muted">
                    <td className="sticky left-0 z-10 bg-[#F7F4EE] p-3 text-left font-bold text-muted shadow-[1px_0_3px_rgba(0,0,0,0.04)]">
                      Par
                    </td>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((hNum) =>
                      game.scoresJson[String(hNum)] ? (
                        <td key={hNum} className="p-3 font-mono text-[11px] font-bold">
                          {game.coursePars[hNum - 1] || 4}
                        </td>
                      ) : null
                    )}
                    <td className="bg-[#EAF3EC]/60 p-3 font-mono text-xs font-bold text-forest">
                      {totalParPlayed}
                    </td>
                  </tr>

                  {game.players.map((name, pIdx) => (
                    <tr key={name} className="transition hover:bg-[#F7F4EE]/60">
                      <td className="sticky left-0 z-10 bg-surface p-3 text-left text-xs font-bold text-foreground shadow-[1px_0_3px_rgba(0,0,0,0.04)]">
                        {name}
                      </td>
                      {Array.from({ length: 18 }, (_, i) => i + 1).map((hNum) =>
                        game.scoresJson[String(hNum)] ? (
                          <td key={hNum} className="p-3 font-mono text-xs text-[#48484A]">
                            {game.scoresJson[String(hNum)][pIdx] &&
                            game.scoresJson[String(hNum)][pIdx] !== 0
                              ? game.scoresJson[String(hNum)][pIdx]
                              : '—'}
                          </td>
                        ) : null
                      )}
                      <td className="bg-[#EAF3EC]/60 p-3 font-mono text-sm font-bold text-forest">
                        {totals[pIdx]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="mt-5">
          <h3 className="flex items-center gap-1.5 pb-2 pl-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
            <Trophy className="h-3.5 w-3.5 text-amber" /> Performance Grid
          </h3>
          <div className="overflow-x-auto rounded-3xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(28,28,30,0.03)] no-scrollbar">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em]">Metric</th>
                  {game.players.map((p) => (
                    <th key={p} className="py-2 text-xs font-bold text-foreground">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium text-[#48484A]">
                {statRows.map((row) => (
                  <tr key={row.key}>
                    <td className="py-2.5 text-left">
                      <span className="flex items-center gap-2 font-bold text-[#3C3C40]">
                        <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                        {row.label}
                        <span className={`text-[10px] font-semibold ${row.text}`}>{row.hint}</span>
                      </span>
                    </td>
                    {stats.map((s, i) => (
                      <td key={i} className="font-mono font-bold text-foreground">
                        {s[row.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <button
          onClick={() => {
            triggerFeedback();
            router.push('/');
          }}
          className="w-full rounded-3xl bg-foreground py-4 text-sm font-bold text-white shadow-[0_16px_28px_-20px_rgba(28,28,30,0.9)] transition active:scale-[0.99] active:bg-black"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
