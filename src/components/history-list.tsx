"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Image as ImageIcon, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
import { useGolfStore } from '@/src/store/useGolfStore';
import { DeleteRecord, EditMatch, TemplateDialog } from '@/src/components/record-dialogs';
import { apiRequest } from '@/src/lib/golf-api';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Card } from '@/src/components/ui/card';
import { Skeleton } from '@/src/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';

export function HistoryList({ isSyncing }: { isSyncing: boolean }) {
  const { history, savedCourses, savedGroups, pendingPhotoCleanup } = useGolfStore();
  const [isCleaning, setIsCleaning] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [section, setSection] = useState<'matches' | 'courses' | 'groups'>('matches');
  const [visibleCount, setVisibleCount] = useState(5);
  const count = section === 'matches' ? history.length : section === 'courses' ? savedCourses.length : savedGroups.length;

  async function retryCleanup() {
    setIsCleaning(true); setPhotoError('');
    try {
      const result = await apiRequest<{ pendingPhotoCleanup: number }>('/api/upload', { method: 'DELETE' });
      if (result.pendingPhotoCleanup) setPhotoError('The old photo could not be removed from storage yet. Try again shortly.');
    } catch (error) { setPhotoError(error instanceof Error ? error.message : 'Photo cleanup failed.'); }
    finally { setIsCleaning(false); }
  }

  return <section className="space-y-3" aria-label="History and saved templates" aria-busy={isSyncing}>
    {!!pendingPhotoCleanup && <div className="text-sm text-muted-foreground" role="status">Your changes are saved. An old photo still needs to be removed from storage. <Button variant="link" disabled={isCleaning} onClick={retryCleanup}>{isCleaning ? 'Retrying…' : 'Retry photo cleanup'}</Button>{photoError && <p role="alert" className="text-destructive">{photoError}</p>}</div>}
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase text-muted-foreground">{section === 'matches' ? 'Saved Matches' : section === 'courses' ? 'Saved Courses' : 'Player Groups'}</h2>
      <Badge variant="secondary" className="tabular-nums">{count} {section === 'matches' ? `Round${count !== 1 ? 's' : ''}` : 'Saved'}</Badge>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-1">
      <ToggleGroup type="single" value={section} onValueChange={value => { if (value) setSection(value as typeof section); }} aria-label="Show saved records" className="gap-0 rounded-lg bg-muted p-1">
        {(['matches', 'courses', 'groups'] as const).map(value => <ToggleGroupItem key={value} value={value} className="min-h-11 px-2 text-xs capitalize data-[state=on]:bg-background data-[state=on]:text-primary">{value}</ToggleGroupItem>)}
      </ToggleGroup>
      {section === 'matches' ? <Button variant="ghost" asChild className="px-2 text-xs text-primary"><Link href="/setup"><Plus className="size-3.5" />New match</Link></Button>
        : <TemplateDialog entity={section === 'courses' ? 'course' : 'group'}><Button variant="ghost" className="px-2 text-xs text-primary"><Plus className="size-3.5" />Add {section === 'courses' ? 'course' : 'group'}</Button></TemplateDialog>}
    </div>
    {isSyncing && !count ? <div className="space-y-2" role="status"><span className="sr-only">Loading saved records…</span>{[1, 2, 3].map(n => <Card key={n} className="flex-row items-center gap-3 bg-muted p-3 ring-0"><Skeleton className="size-12 shrink-0 rounded-lg bg-border" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/3 bg-border" /><Skeleton className="h-2.5 w-1/3 bg-border" /></div></Card>)}</div>
    : !count ? <Card className="items-center gap-2 bg-muted p-6 text-center ring-0"><Trophy className="size-8 text-muted-foreground" /><p className="text-sm font-semibold text-muted-foreground">{section === 'matches' ? 'Your first round starts here.' : `No saved ${section} yet.`}</p><p className="text-xs text-muted-foreground">{section === 'matches' ? 'Start a match above to build your history.' : `Use Add ${section === 'courses' ? 'course' : 'group'} to save your first one.`}</p></Card>
    : section === 'matches' ? <>
      <ul className="space-y-2">{history.slice(0, visibleCount).map(game => {
        const totals = game.players.map((_, i) => Object.values(game.scoresJson).reduce((sum, scores) => sum + (scores[i] || 0), 0));
        const lowest = Math.min(...totals.filter(total => total > 0));
        return <li key={game.id}><Card className="flex-row items-center gap-1 bg-muted p-3 ring-0">
          <Link href={`/score/${game.id}`} className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg" aria-label={`View ${game.courseName}, ${new Date(game.date).toLocaleDateString()}`}>
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background text-muted-foreground">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {game.imageUrl ? <img src={game.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon className="size-4" />}
            </div>
            <div className="min-w-0 space-y-1.5"><p className="truncate text-sm font-semibold group-hover:underline underline-offset-4">{game.courseName}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground tabular-nums"><span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(game.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span><span>{game.totalHoles} holes</span>{Number.isFinite(lowest) && <span className="font-semibold text-primary">Lowest: {lowest}</span>}</div>
            </div>
          </Link>
          <div className="flex shrink-0 flex-col sm:flex-row">
            <EditMatch game={game}><Button variant="ghost" size="icon" aria-label={`Edit match at ${game.courseName}`}><Pencil className="size-4" /></Button></EditMatch>
            <DeleteRecord entity="game" id={game.id} name={`${game.courseName} · ${new Date(game.date).toLocaleDateString()}`}><Button variant="ghost" size="icon" aria-label={`Delete match at ${game.courseName}`} className="text-destructive"><Trash2 className="size-4" /></Button></DeleteRecord>
          </div>
        </Card></li>;
      })}</ul>
      {visibleCount < history.length && <Button variant="ghost" onClick={() => setVisibleCount(count => count + 5)} className="w-full text-primary">Show more matches</Button>}
    </> : <ul className="space-y-2">{(section === 'courses' ? savedCourses : savedGroups).map(record => <li key={record.id}><Card className="flex-row items-center gap-1 bg-muted p-3 ring-0">
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{record.name}</p><p className="mt-1 truncate text-xs text-muted-foreground tabular-nums">{'pars' in record ? `${record.pars.length} holes · Par ${record.pars.reduce((sum, par) => sum + par, 0)}` : record.players.join(', ')}</p></div>
      <TemplateDialog entity={section === 'courses' ? 'course' : 'group'} record={record}><Button variant="ghost" size="icon" aria-label={`Edit ${record.name}`}><Pencil className="size-4" /></Button></TemplateDialog>
      <DeleteRecord entity={section === 'courses' ? 'course' : 'group'} id={record.id} name={record.name}><Button variant="ghost" size="icon" aria-label={`Delete ${record.name}`} className="text-destructive"><Trash2 className="size-4" /></Button></DeleteRecord>
    </Card></li>)}</ul>}
  </section>;
}
