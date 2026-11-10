"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Image as ImageIcon, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
import { useGolfStore } from '@/src/store/useGolfStore';
import { DeleteRecord, EditMatch, TemplateDialog } from '@/src/components/record-dialogs';
import { cn } from '@/src/lib/utils';
import { apiRequest } from '@/src/lib/golf-api';

const iconButton = 'flex size-10 shrink-0 items-center justify-center rounded-xl text-[#62626A] hover:bg-white';

export function HistoryList({ isSyncing }: { isSyncing: boolean }) {
  const { history, savedCourses, savedGroups, pendingPhotoCleanup } = useGolfStore();
  const [isCleaning, setIsCleaning] = useState(false);
  const [photoError, setPhotoError] = useState('');
  async function retryCleanup() {
    setIsCleaning(true); setPhotoError('');
    try {
      const result = await apiRequest<{ pendingPhotoCleanup: number }>('/api/upload', { method: 'DELETE' });
      if (result.pendingPhotoCleanup) setPhotoError('The old photo could not be removed from storage yet. Try again shortly.');
    } catch (error) { setPhotoError(error instanceof Error ? error.message : 'Photo cleanup failed.'); }
    finally { setIsCleaning(false); }
  }
  const [section, setSection] = useState<'matches' | 'courses' | 'groups'>('matches');
  const [visibleCount, setVisibleCount] = useState(5);
  const count = section === 'matches' ? history.length : section === 'courses' ? savedCourses.length : savedGroups.length;

  return <section className="space-y-3" aria-label="History and saved templates" aria-busy={isSyncing}>
    {!!pendingPhotoCleanup && <div className="px-1 text-sm text-[#62626A]" role="status">Your changes are saved. An old photo still needs to be removed from storage. <button disabled={isCleaning} onClick={retryCleanup} className="min-h-11 font-semibold text-[#047857] underline">{isCleaning ? 'Retrying…' : 'Retry photo cleanup'}</button>{photoError && <p role="alert" className="text-red-700">{photoError}</p>}</div>}
    <div className="flex justify-between items-center px-1">
      <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#62626A]">{section === 'matches' ? 'Saved Matches' : section === 'courses' ? 'Saved Courses' : 'Player Groups'}</h3>
      <span className="text-[11px] font-bold bg-[#F4F6F9] border border-[#F1F5F9]/40 text-[#48484A] px-2.5 py-0.5 rounded-full tabular-nums">{count} {section === 'matches' ? `Round${count !== 1 ? 's' : ''}` : 'Saved'}</span>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F5F9]">
      <div className="flex gap-1" role="group" aria-label="Show saved records">
        {(['matches', 'courses', 'groups'] as const).map(value => <button key={value} type="button" aria-pressed={section === value} onClick={() => setSection(value)} className={cn('min-h-11 border-b-2 border-transparent px-2.5 text-xs font-semibold capitalize text-[#62626A]', section === value && 'border-[#059669] text-[#047857]')}>{value}</button>)}
      </div>
      {section === 'matches' ? <Link href="/setup" className="flex min-h-11 items-center gap-1 text-xs font-semibold text-[#047857]"><Plus className="size-3.5" />New match</Link>
        : <TemplateDialog entity={section === 'courses' ? 'course' : 'group'}><button className="flex min-h-11 items-center gap-1 text-xs font-semibold text-[#047857]"><Plus className="size-3.5" />Add {section === 'courses' ? 'course' : 'group'}</button></TemplateDialog>}
    </div>

    {isSyncing && !count ? <div className="space-y-2.5" role="status"><span className="sr-only">Loading saved records…</span>{[1, 2, 3].map(n => <div key={n} className="flex items-center gap-3.5 p-3.5 bg-[#F4F6F9]/60 rounded-3xl motion-safe:animate-pulse"><div className="size-14 rounded-2xl bg-[#E5E5EA] shrink-0" /><div className="flex-1 space-y-2"><div className="h-3.5 bg-[#E5E5EA] rounded-full w-2/3" /><div className="h-2.5 bg-[#E5E5EA] rounded-full w-1/3" /></div></div>)}</div>
    : !count ? <div className="flex flex-col items-center justify-center p-8 bg-[#F4F6F9] rounded-3xl border border-[#F1F5F9]/60 text-center"><Trophy className="size-8 text-[#8E8E93] mb-2.5" /><p className="text-sm font-semibold text-[#62626A]">{section === 'matches' ? 'Your first round starts here.' : `No saved ${section} yet.`}</p><p className="mt-1 text-xs text-[#62626A]">{section === 'matches' ? 'Start a match above to build your history.' : `Use Add ${section === 'courses' ? 'course' : 'group'} to save your first one.`}</p></div>
    : section === 'matches' ? <>
      <ul className="space-y-2.5">{history.slice(0, visibleCount).map(game => {
        const totals = game.players.map((_, i) => Object.values(game.scoresJson).reduce((sum, scores) => sum + (scores[i] || 0), 0));
        const lowest = Math.min(...totals.filter(total => total > 0));
        return <li key={game.id} className="flex items-center gap-1 rounded-3xl border border-[#F1F5F9]/50 bg-[#F4F6F9] p-3.5">
          <Link href={`/score/${game.id}`} className="flex flex-1 items-center gap-3 min-w-0 rounded-xl" aria-label={`View ${game.courseName}, ${new Date(game.date).toLocaleDateString()}`}>
            <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-[#8E8E93]">
              {/* Remote round photos are served directly from the configured storage domain. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {game.imageUrl ? <img src={game.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon className="size-4" />}
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-sm font-bold text-[#1C1C1E]">{game.courseName}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#62626A] tabular-nums"><span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(game.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span><span>{game.totalHoles} holes</span>{Number.isFinite(lowest) && <span className="font-semibold text-[#047857]">Lowest: {lowest}</span>}</div>
            </div>
          </Link>
          <div className="flex shrink-0 flex-col sm:flex-row">
            <EditMatch game={game}><button aria-label={`Edit match at ${game.courseName}`} className={iconButton}><Pencil className="size-4" /></button></EditMatch>
            <DeleteRecord entity="game" id={game.id} name={`${game.courseName} · ${new Date(game.date).toLocaleDateString()}`}><button aria-label={`Delete match at ${game.courseName}`} className={`${iconButton} hover:text-red-700`}><Trash2 className="size-4" /></button></DeleteRecord>
          </div>
        </li>;
      })}</ul>
      {visibleCount < history.length && <button onClick={() => setVisibleCount(count => count + 5)} className="w-full py-3 text-sm font-semibold text-[#047857]">Show more matches</button>}
    </> : <ul className="space-y-2.5">{(section === 'courses' ? savedCourses : savedGroups).map(record => <li key={record.id} className="flex items-center gap-2 rounded-3xl border border-[#F1F5F9]/50 bg-[#F4F6F9] p-3.5">
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#1C1C1E]">{record.name}</p><p className="mt-1 text-xs text-[#62626A] truncate tabular-nums">{'pars' in record ? `${record.pars.length} holes · Par ${record.pars.reduce((sum, par) => sum + par, 0)}` : record.players.join(', ')}</p></div>
      <TemplateDialog entity={section === 'courses' ? 'course' : 'group'} record={record}><button aria-label={`Edit ${record.name}`} className={iconButton}><Pencil className="size-4" /></button></TemplateDialog>
      <DeleteRecord entity={section === 'courses' ? 'course' : 'group'} id={record.id} name={record.name}><button aria-label={`Delete ${record.name}`} className={`${iconButton} hover:text-red-700`}><Trash2 className="size-4" /></button></DeleteRecord>
    </li>)}</ul>}
  </section>;
}
