"use client";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Play, RotateCw } from 'lucide-react';
import { HistoryList } from '@/src/components/history-list';
import { refreshRecords } from '@/src/lib/golf-api';

export default function Dashboard() {
  const router = useRouter();
  const { activeGame } = useGolfStore();

  // Start isSyncing as true so the skeleton shows immediately on mount
  const [isSyncing, setIsSyncing] = useState(true);

  const [syncError, setSyncError] = useState('');

  const triggerFeedback = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
  };

  async function syncHistory() {
    try { await refreshRecords(); setSyncError(''); }
    catch (error) { setSyncError(error instanceof Error ? error.message : 'Could not load saved matches.'); }
    finally { setIsSyncing(false); }
  }

  useEffect(() => {
    const controller = new AbortController();
    refreshRecords(controller.signal)
      .catch(error => { if (!controller.signal.aborted) setSyncError(error instanceof Error ? error.message : 'Could not load saved matches.'); })
      .finally(() => { if (!controller.signal.aborted) setIsSyncing(false); });
    return () => controller.abort();
  }, []);

  // Dynamic Date Calculations
  const today = new Date();
  const stringDay = today.toLocaleDateString(undefined, { weekday: 'long' });
  const stringFullDate = today.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className="w-full max-w-3xl mx-auto min-h-[100dvh] bg-white text-black font-sans antialiased px-2 sm:px-4 md:px-6 py-0 md:py-6 flex flex-col justify-start pb-8">

      <div className="flex items-center justify-between px-1.5 py-4 mb-4 gap-4 shadow-[0_8px_25px_rgba(0,0,0,0.01)]">
        <div className="space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1E] tracking-tight">
            Guten Morgen
          </h1>
          <p className="text-base sm:text-lg font-bold text-[#48484A] tracking-tight">
            Up for a round today?
          </p>
        </div>

        <div className="size-24 sm:size-40 rounded-full overflow-hidden bg-[#F1F5F9] flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/golf-family.jpg"
            alt="Family golf illustration"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* --- SECTION 1: DYNAMIC HERO HEADER CARD --- */}
        <Card className="flex-row items-center justify-between gap-4 bg-muted p-4 ring-0">

          <div className="w-1/4 aspect-square rounded-2xl overflow-hidden flex-shrink-0 relative flex items-center justify-center ">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/golf-swing.png"
              alt=""
              className="w-full h-full object-cover scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-[#62626A] uppercase tracking-widest">Today</span>
            <h2 className="text-2xl font-extrabold text-[#1C1C1E] tracking-tight leading-tight mt-0.5">{stringDay}</h2>
            <p className="text-xs font-semibold text-[#62626A] mt-0.5 tracking-tight">{stringFullDate}</p>
          </div>

          {isSyncing && (
            <div role="status" aria-label="Loading saved matches" className="p-2 bg-white text-[#047857] rounded-full motion-safe:animate-spin flex-shrink-0 self-start shadow-xs">
              <RotateCw className="w-3.5 h-3.5" />
            </div>
          )}
        </Card>

        {/* --- ROUND LAUNCH PLATFORM ACTIONS TRIGGER --- */}
        <div>
          {activeGame ? (
            <Button
              onClick={() => { triggerFeedback(); router.push('/play'); }}
              className="w-full flex items-center justify-center gap-2 bg-[#047857] hover:bg-[#065F46] text-white font-bold py-4 px-6 rounded-3xl active:bg-[#065F46] shadow-sm transition text-sm tracking-tight"
            >
              <Play className="w-4 h-4 fill-current"/> Resume Active Match
            </Button>
          ) : (
            <Button asChild className="h-12 w-full"><Link
              href="/setup"
              onClick={triggerFeedback}
              className="w-full flex items-center justify-center bg-[#047857] hover:bg-[#065F46] active:bg-[#065F46] text-white font-bold py-4 px-6 rounded-3xl shadow-sm transition text-sm tracking-tight"
            >
              Start a match
            </Link></Button>
          )}
        </div>

        {syncError && <p role="alert" className="px-1 text-sm text-red-700">{syncError} <Button variant="ghost" disabled={isSyncing} onClick={() => { setIsSyncing(true); void syncHistory(); }} className="min-h-11 px-2 font-semibold underline">Retry</Button></p>}
        <HistoryList isSyncing={isSyncing} />
      </div>
    </main>
  );
}
