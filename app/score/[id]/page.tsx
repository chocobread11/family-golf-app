"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Trophy, ArrowLeft, Table2 } from 'lucide-react';

export default function ScorePage() {
  const { id } = useParams();
  const router = useRouter();
  const { history } = useGolfStore();

  const game = history.find(g => g.id === id);
  if (!game) return <div className="p-8 text-center text-sm font-medium text-[#8E8E93]">Scorecard missing.</div>;

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
    <div className="w-full max-w-md mx-auto min-h-[100dvh] bg-white text-black font-sans flex flex-col justify-between pb-6 antialiased select-none">
      <div className="w-full">
        
        {/* --- DYNAMIC iOS HEADER TRUNK --- */}
        <div className={`w-full relative transition-all duration-300 overflow-hidden ${game.imageUrl ? 'h-100' : 'h-40 bg-gradient-to-b from-[#1C1C1E] to-[#2C2C2E]'}`}>
          
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
              onClick={() => { 
                triggerFeedback();
                router.push('/'); 
              }} 
              className="p-3 bg-black/30 backdrop-blur-md border border-white/10 active:bg-black/50 rounded-2xl w-10 h-10 flex items-center justify-center transition"
            >
              <ArrowLeft className="w-4 h-4 text-white"/>
            </button>
            
            <div>
              <span className="bg-white/20 backdrop-blur-xs text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {game.imageUrl ? 'OOTD Memory' : 'Match Settled'}
              </span>
              <h1 className="text-xl font-extrabold tracking-tight mt-1">{game.courseName}</h1>
              <p className="text-xs text-white/70 mt-0.5 font-medium">
                {new Date(game.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} • {game.totalHoles} Holes Played
              </p>
            </div>
          </div>
        </div>

        {/* Score Table Container */}
        <div className="p-3 mt-2">
          <h3 className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider pl-1.5 flex items-center gap-1 pb-2">
            <Table2 className="w-3.5 h-3.5 text-[#FF9500]"/>Score Table
          </h3>
          <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="overflow-x-auto block">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-[#F4F6F9] text-[#8E8E93] font-bold text-[10px] uppercase tracking-wider border-b border-[#F1F5F9]">
                    <th className="p-3 text-left font-bold text-xs bg-white text-black sticky left-0 shadow-[1px_0_3px_rgba(0,0,0,0.04)] z-10">Player</th>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(hNum => (
                      game.scoresJson[String(hNum)] ? <th key={hNum} className="p-3 font-mono min-w-[42px] text-xs">H{hNum}</th> : null
                    ))}
                    <th className="p-3 bg-[#E8F5E9] text-[#2E7D32] font-bold text-xs">Tot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-sm font-semibold">
                  <tr className="bg-[#F4F6F9]/40 text-[#8E8E93] text-xs">
                    <td className="p-3 text-left font-bold bg-white text-[#8E8E93] sticky left-0 shadow-[1px_0_3px_rgba(0,0,0,0.04)] z-10">Par</td>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(hNum => (
                      game.scoresJson[String(hNum)] ? (
                        <td key={hNum} className="p-3 font-mono text-[11px] font-bold">{game.coursePars[hNum - 1] || 4}</td>
                      ) : null
                    ))}
                    <td className="p-3 bg-[#E8F5E9]/30 text-[#2E7D32] font-mono text-xs font-bold">{totalParPlayed}</td>
                  </tr>

                  {game.players.map((name, pIdx) => (
                    <tr key={name} className="hover:bg-[#F4F6F9]/40 transition">
                      <td className="p-3 text-left font-bold text-black bg-white sticky left-0 shadow-[1px_0_3px_rgba(0,0,0,0.04)] z-10 text-xs">{name}</td>
                      {Array.from({ length: 18 }, (_, i) => i + 1).map(hNum => (
                        game.scoresJson[String(hNum)] ? (
                          <td key={hNum} className="p-3 font-mono text-[#48484A] text-xs">
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
        <div className="px-3 space-y-1.5 mt-2">
          <h3 className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider pl-1.5 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-[#FF9500]"/> Performance Grid
          </h3>
          <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse text-center">
              <thead>
                <tr className="text-[#8E8E93] font-bold border-b border-[#F1F5F9]">
                  <th className="text-left py-2 font-medium">Metric</th>
                  {game.players.map(p => <th key={p} className="py-2 font-bold text-black">{p}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]/60 font-medium text-[#48484A]">
                <tr><td className="text-left py-2.5 font-bold text-[#34C759]">Birdies ( -1 )</td>{stats.map((s, i) => <td key={i} className="font-mono">{s.birdie}</td>)}</tr>
                <tr><td className="text-left py-2.5 font-bold text-[#007AFF]">Pars ( E )</td>{stats.map((s, i) => <td key={i} className="font-mono">{s.par}</td>)}</tr>
                <tr><td className="text-left py-2.5 font-bold text-[#FF9500]">Bogeys ( +1 )</td>{stats.map((s, i) => <td key={i} className="font-mono">{s.bogey}</td>)}</tr>
                <tr><td className="text-left py-2.5 font-bold text-[#FF3B30]">Double+ ( 2+ )</td>{stats.map((s, i) => <td key={i} className="font-mono">{s.double}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="p-4">
        <button 
          onClick={() => { triggerFeedback(); router.push('/'); }} 
          className="w-full bg-[#1C1C1E] active:bg-black text-white font-bold py-4 rounded-3xl shadow-sm transition text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}