"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Trophy, ArrowLeft, Table2, Pencil, Trash2 } from 'lucide-react';

import { refreshRecords } from '@/src/lib/golf-api';
import { EditMatch, DeleteRecord } from '@/src/components/record-dialogs';
import { cn } from '@/src/lib/utils';

export default function ScorePage() {
  const { id } = useParams();
  const router = useRouter();
  const { history } = useGolfStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function loadHistory() {
    try { await refreshRecords(); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load this match.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    refreshRecords(controller.signal)
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load saved matches.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  const game = history.find(g => g.id === id);
  if (!game) return <main className="mx-auto flex w-full min-h-dvh max-w-xl md:max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
    <p role={error ? 'alert' : 'status'} className="text-sm text-[#62626A]">{error || (loading ? 'Loading scorecard…' : 'This match could not be found.')}</p>
    {error && <button onClick={() => { setLoading(true); void loadHistory(); }} className="rounded-xl bg-[#F4F6F9] px-4 py-3 text-sm font-semibold">Try again</button>}
    <Link href="/" className="py-3 text-sm font-semibold text-[#047857]">Back to dashboard</Link>
  </main>;

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
    if (holeWasPlayed?.some(score => score > 0)) {
      return acc + (game.coursePars[hNum - 1] || 4);
    }
    return acc;
  }, 0);

  const stats = game.players.map((_, pIdx) => {
    let birdie = 0, par = 0, bogey = 0, double = 0;
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

  return (
    <main className="w-full max-w-xl md:max-w-3xl mx-auto min-h-[100dvh] bg-white text-black font-sans flex flex-col justify-between pb-6 antialiased px-4 md:px-6">
      <div className="w-full">

        {error && <p role="alert" className="py-3 text-sm text-red-700">{error} <button onClick={() => { setLoading(true); void loadHistory(); }} className="px-2 py-2 underline">Retry</button></p>}
        {/* --- DYNAMIC iOS HEADER TRUNK --- */}
        <div className={cn('w-full relative mt-4 md:mt-6 rounded-3xl overflow-hidden', game.imageUrl ? 'h-100' : 'h-48 bg-[#1C1C1E]')}>

          {/* Background R2 Image Banner Asset */}
          {game.imageUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={game.imageUrl}
                alt="Round Banner Background"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80" />
            </>
          )}

          {/* Top Interface Controls Content Overlay */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between text-white z-10">
            <button
              aria-label="Back to dashboard"
              onClick={() => {
                triggerFeedback();
                router.push('/');
              }}
              className="p-3 bg-black/60 border border-white/10 active:bg-black/50 rounded-2xl size-11 flex items-center justify-center transition"
            >
              <ArrowLeft className="w-4 h-4 text-white"/>
            </button>

            <div>
              <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {game.imageUrl ? 'Round photo' : 'Saved round'}
              </span>
              <h1 className="text-xl font-extrabold tracking-tight mt-1">{game.courseName}</h1>
              <p className="text-xs text-white/90 mt-0.5 font-medium">
                {new Date(game.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} • {game.totalHoles}-hole round
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <EditMatch game={game}><button className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#48484A]"><Pencil className="size-4" />Edit</button></EditMatch>
          <DeleteRecord entity="game" id={game.id} name={game.courseName} onDeleted={() => router.push('/')}><button className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-red-700"><Trash2 className="size-4" />Delete</button></DeleteRecord>
        </div>
        {/* Score Table Container */}
        <div className="py-4 mt-2">
          <h2 className="text-xs font-bold text-[#62626A] uppercase tracking-wider pl-1.5 flex items-center gap-1 pb-2">
            <Table2 className="w-3.5 h-3.5 text-[#9A3412]"/>Score Table
          </h2>
          <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="relative overflow-x-auto block" tabIndex={0} role="region" aria-label="Round scorecard">
              <table className="w-full text-center border-collapse tabular-nums">
                <caption className="sr-only">Scores by player and hole</caption>
                <thead>
                  <tr className="bg-[#F4F6F9] text-[#62626A] font-bold text-xs uppercase tracking-wider border-b border-[#F1F5F9]">
                    <th scope="col" className="p-3 text-left font-bold text-xs bg-white text-black sticky left-0 shadow-[1px_0_3px_rgba(0,0,0,0.04)] z-10">Player</th>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(hNum => (
                      game.scoresJson[String(hNum)]?.some(score => score > 0) ? <th scope="col" key={hNum} className="p-3 font-mono min-w-[42px] text-xs">H{hNum}</th> : null
                    ))}
                    <th scope="col" className="p-3 bg-[#E8F5E9] text-[#2E7D32] font-bold text-xs">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-sm font-semibold">
                  <tr className="bg-[#F4F6F9]/40 text-[#62626A] text-xs">
                    <th scope="row" className="p-3 text-left font-bold bg-white text-[#62626A] sticky left-0 shadow-[1px_0_3px_rgba(0,0,0,0.04)] z-10">Par</th>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(hNum => (
                      game.scoresJson[String(hNum)]?.some(score => score > 0) ? (
                        <td key={hNum} className="p-3 font-mono text-xs font-bold">{game.coursePars[hNum - 1] || 4}</td>
                      ) : null
                    ))}
                    <td className="p-3 bg-[#E8F5E9]/30 text-[#2E7D32] font-mono text-xs font-bold">{totalParPlayed}</td>
                  </tr>

                  {game.players.map((name, pIdx) => (
                    <tr key={name} className="hover:bg-[#F4F6F9]/40 transition">
                      <th scope="row" title={name} className="p-3 text-left font-bold text-black max-w-36 truncate bg-white sticky left-0 shadow-[1px_0_3px_rgba(0,0,0,0.04)] z-10 text-sm">{name}</th>
                      {Array.from({ length: 18 }, (_, i) => i + 1).map(hNum => (
                        game.scoresJson[String(hNum)]?.some(score => score > 0) ? (
                          <td key={hNum} className="p-3 font-mono text-[#48484A] text-sm">
                            {game.scoresJson[String(hNum)][pIdx] && game.scoresJson[String(hNum)][pIdx] !== 0
                              ? game.scoresJson[String(hNum)][pIdx]
                              : '—'}
                          </td>
                        ) : null
                      ))}
                      <td className="p-3 bg-[#E8F5E9]/60 text-[#2E7D32] font-mono font-bold text-sm">{totals[pIdx]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="space-y-2 mt-2">
          <h2 className="text-xs font-bold text-[#62626A] uppercase tracking-wider pl-1.5 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-[#9A3412]"/> Performance Grid
          </h2>
          <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-3 relative overflow-x-auto">
            <table className="w-full text-sm border-collapse text-center tabular-nums">
              <caption className="sr-only">Scoring performance by player</caption>
              <thead>
                <tr className="text-[#62626A] font-bold border-b border-[#F1F5F9]">
                  <th scope="col" className="text-left py-2 font-medium">Metric</th>
                  {game.players.map(p => <th scope="col" key={p} className="py-2 font-bold text-black">{p}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]/60 font-medium text-[#48484A]">
                <tr><th scope="row" className="text-left py-2.5 font-semibold text-[#047857]">Birdies (−1)</th>{stats.map((s, i) => <td key={i} className="font-mono">{s.birdie}</td>)}</tr>
                <tr><th scope="row" className="text-left py-2.5 font-semibold text-[#1D4ED8]">Pars (E)</th>{stats.map((s, i) => <td key={i} className="font-mono">{s.par}</td>)}</tr>
                <tr><th scope="row" className="text-left py-2.5 font-semibold text-[#9A3412]">Bogeys (+1)</th>{stats.map((s, i) => <td key={i} className="font-mono">{s.bogey}</td>)}</tr>
                <tr><th scope="row" className="text-left py-2.5 font-semibold text-[#B91C1C]">Double+ (+2)</th>{stats.map((s, i) => <td key={i} className="font-mono">{s.double}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="py-6">
        <button
          onClick={() => { triggerFeedback(); router.push('/'); }}
          className="w-full bg-[#1C1C1E] active:bg-black text-white font-bold py-4 rounded-3xl shadow-sm transition text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    </main>
  );
}
