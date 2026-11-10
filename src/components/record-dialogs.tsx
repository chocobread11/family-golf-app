"use client";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/src/components/ui/table";

import { useId, useState, type ReactNode, type FormEvent } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/src/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogFooter } from "@/src/components/ui/alert-dialog";
import { Plus, Trash2 } from 'lucide-react';
import { useGolfStore, type Course, type GameState, type GroupTemplate } from '@/src/store/useGolfStore';
import { apiRequest, saveRecord, toGameState, type GameRecord } from '@/src/lib/golf-api';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/src/components/ui/select";
import { cn } from '@/src/lib/utils';
import { RoundPhotoPicker, type RoundPhoto } from '@/src/components/round-photo-picker';
import { CourseParInput } from '@/src/components/course-par-input';
import { PlayerInputs, playerInputs, type PlayerInput } from '@/src/components/player-inputs';

const panel = 'max-h-[90dvh] overflow-y-auto rounded-2xl p-4 sm:p-6 sm:max-w-md';
export const inputClass = 'min-w-0 w-full rounded-xl border border-slate-200 bg-[#F4F6F9] px-3 py-3 text-base text-[#1C1C1E]';
const primary = 'min-h-11 rounded-xl bg-[#047857] hover:bg-[#065F46] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50';

export function TemplateDialog({ entity, record, children, onSaved }: {
  entity: 'course' | 'group'; record?: Course | GroupTemplate; children: ReactNode;
  onSaved?: (record: Course | GroupTemplate) => void;
}) {
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [pars, setPars] = useState<number[]>([]);
  const [players, setPlayers] = useState<PlayerInput[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const noun = entity === 'course' ? 'course' : 'player group';

  function changeOpen(next: boolean) {
    if (busy) return;
    if (next) {
      setName(record?.name ?? '');
      setPars(record && 'pars' in record ? record.pars : []);
      setPlayers(playerInputs(record && 'players' in record ? record.players : []));
      setError('');
    }
    setOpen(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const payload = entity === 'course'
        ? { pars }
        : { players: players.map(player => player.name.trim()) };
      const result = await saveRecord<{ course?: Course; group?: GroupTemplate }>(entity, { id: record?.id, name, ...payload }, !!record);
      const saved = (result.course ?? result.group)!;
      useGolfStore.setState(state => entity === 'course'
        ? { savedCourses: [...state.savedCourses.filter(item => item.id !== saved.id), saved as Course].sort((a, b) => a.name.localeCompare(b.name)),
            history: state.history.map(game => game.courseId === saved.id ? { ...game, courseName: saved.name } : game) }
        : { savedGroups: [...state.savedGroups.filter(item => item.id !== saved.id), saved as GroupTemplate].sort((a, b) => a.name.localeCompare(b.name)) });
      onSaved?.(saved);
      setOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save changes.'); }
    finally { setBusy(false); }
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent className={panel} aria-busy={busy}>
      <DialogHeader><DialogTitle className="pr-10 text-lg font-bold text-balance">{record ? 'Edit' : 'Add'} {noun}</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-[#62626A] text-pretty">{entity === 'course' ? 'Save a course layout for future rounds. Existing match scores keep their original par values.' : 'Save a player lineup to use when starting a match.'}</DialogDescription></DialogHeader>
      <form onSubmit={submit} aria-describedby={error ? `${fieldId}-error` : undefined} className="min-w-0 space-y-4">
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <Label className="block text-sm font-semibold">{entity === 'course' ? 'Course name' : 'Group name'}<Input required maxLength={160} value={name} onChange={e => setName(e.target.value)} className={`${inputClass} mt-1.5`} /></Label>
          {entity === 'course' ? <CourseParInput pars={pars} onChange={setPars} /> : <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">Players</legend><PlayerInputs players={players} onChange={setPlayers} /></fieldset>}
        </fieldset>
        {error && <p id={`${fieldId}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
        <DialogFooter className="mx-0 mb-0 flex-row bg-transparent border-0 p-0"><DialogClose asChild><Button variant="secondary" type="button" disabled={busy}>Cancel</Button></DialogClose><Button type="submit" disabled={busy || (entity === 'course' ? ![9, 18].includes(pars.length) : players.length === 0)} className={primary}>{busy ? 'Saving…' : 'Save changes'}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

export function DeleteRecord({ entity, id, name, children, onDeleted }: {
  entity: 'game' | 'course' | 'group'; id: string; name: string; children: ReactNode; onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function remove(event: React.MouseEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      await apiRequest(`/api/sync?entity=${entity}&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      useGolfStore.setState(state => entity === 'game' ? { history: state.history.filter(item => item.id !== id) }
        : entity === 'course' ? { savedCourses: state.savedCourses.filter(item => item.id !== id) }
        : { savedGroups: state.savedGroups.filter(item => item.id !== id) });
      setOpen(false); onDeleted?.();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete this record.'); }
    finally { setBusy(false); }
  }
  return <AlertDialog open={open} onOpenChange={next => { if (!busy) { setOpen(next); setError(''); } }}>
    <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
    <AlertDialogContent className={panel} aria-busy={busy}>
      <AlertDialogHeader className="place-items-start text-left"><AlertDialogTitle className="text-lg font-bold text-balance">Delete {entity === 'game' ? 'match' : entity === 'group' ? 'player group' : 'course'}?</AlertDialogTitle>
      <AlertDialogDescription className="mt-2 text-sm text-[#62626A] text-pretty">“{name}” will be permanently removed. This cannot be undone.{entity === 'course' && ' Courses used by saved matches cannot be deleted.'}</AlertDialogDescription></AlertDialogHeader>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <AlertDialogFooter className="mx-0 mb-0 mt-2 flex-row border-0 bg-transparent p-0"><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete'}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}

function localDateTime(date: string) {
  const value = new Date(date);
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function EditMatch({ game, children }: { game: GameState; children: ReactNode }) {
  const fieldId = useId();
  const courses = useGolfStore(state => state.savedCourses);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(game);
  const [photo, setPhoto] = useState<RoundPhoto>({ url: game.imageUrl });
  const [date, setDate] = useState(localDateTime(game.date));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const holes = Array.from({ length: draft.totalHoles }, (_, i) => ((draft.startingLoop === 'Back' ? 9 : 0) + i) % 18 + 1);
  function changeOpen(next: boolean) {
    if (busy) return;
    if (next) { setDraft(game); setPhoto({ url: game.imageUrl }); setDate(localDateTime(game.date)); setError(''); }
    setOpen(next);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const scoresJson = Object.fromEntries(holes.map(hole => [String(hole), draft.players.map((_, i) => draft.scoresJson[String(hole)]?.[i] ?? 0)]));
      const { game: saved } = await saveRecord<{ game: GameRecord }>('game', { ...draft, date: new Date(date).toISOString(), scoresJson, imageUrl: photo.url ?? null }, true, photo.file);
      useGolfStore.setState(state => ({ history: state.history.map(item => item.id === saved.id ? toGameState(saved) : item).sort((a, b) => b.date.localeCompare(a.date)) }));
      setOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save this match.'); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent className={cn(panel, 'flex flex-col overflow-hidden sm:max-w-2xl')} aria-busy={busy}>
      <DialogHeader><DialogTitle className="pr-10 text-lg font-bold text-balance">Edit match</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-[#62626A] text-pretty">Update the round details, players, and scores. Changes are saved together.</DialogDescription></DialogHeader>
      <form onSubmit={submit} aria-describedby={error ? `${fieldId}-error` : undefined} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <div className="min-h-0 flex-1 overflow-y-auto">
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 min-w-0 sm:col-span-1"><Label htmlFor={`${fieldId}-date`} className="block text-sm font-semibold">Date and time</Label><Input id={`${fieldId}-date`} required type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className={`${inputClass} mt-1.5`} /></div>
            <div className="col-span-2 min-w-0 sm:col-span-1"><Label htmlFor={`${fieldId}-course`} className="block text-sm font-semibold">Course</Label><Select value={draft.courseId} onValueChange={value => { const course = courses.find(item => item.id === value); if (course) setDraft({ ...draft, courseId: course.id, courseName: course.name, coursePars: course.id === game.courseId ? game.coursePars : course.pars }); }}><SelectTrigger id={`${fieldId}-course`} className="mt-1.5 w-full bg-muted"><SelectValue /></SelectTrigger><SelectContent position="popper">
              {!courses.some(course => course.id === draft.courseId) && <SelectItem value={draft.courseId}>{draft.courseName}</SelectItem>}
              {courses.map(course => <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>)}
            </SelectContent></Select></div>
            <div className="min-w-0"><Label htmlFor={`${fieldId}-length`} className="block text-sm font-semibold">Round length</Label><Select value={String(draft.totalHoles)} onValueChange={value => setDraft({ ...draft, totalHoles: Number(value) })}><SelectTrigger id={`${fieldId}-length`} className="mt-1.5 w-full bg-muted"><SelectValue /></SelectTrigger><SelectContent position="popper"><SelectItem value="9">9 holes</SelectItem><SelectItem value="18">18 holes</SelectItem></SelectContent></Select></div>
            <div className="min-w-0"><Label htmlFor={`${fieldId}-loop`} className="block text-sm font-semibold">Starting nine</Label><Select value={draft.startingLoop} onValueChange={value => setDraft({ ...draft, startingLoop: value as 'Front' | 'Back' })}><SelectTrigger id={`${fieldId}-loop`} className="mt-1.5 w-full bg-muted"><SelectValue /></SelectTrigger><SelectContent position="popper"><SelectItem value="Front">Front</SelectItem><SelectItem value="Back">Back</SelectItem></SelectContent></Select></div>
          </div>
          <RoundPhotoPicker value={photo} onChange={setPhoto} />
          <p id={`${fieldId}-score-help`} className="text-xs text-[#62626A]">Scroll sideways to edit each hole. Use 0 for an unplayed hole. Player names must be different.</p>
            <Table containerProps={{ tabIndex: 0, role: 'region', 'aria-label': 'Editable match scores' }} className="w-full text-sm text-center tabular-nums"><TableCaption className="sr-only">Player names and scores by hole</TableCaption>
              <TableHeader><TableRow><TableHead scope="col" className="py-2 text-left">Player</TableHead>{holes.map(hole => <TableHead key={hole} scope="col" className="min-w-16 py-2">H{hole}</TableHead>)}<TableHead scope="col"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>{draft.players.map((player, i) => <TableRow key={i}>
                <TableCell className="py-1 pr-2"><Input aria-label={`Player ${i + 1} name`} required maxLength={160} value={player} onChange={e => setDraft({ ...draft, players: draft.players.map((name, j) => i === j ? e.target.value : name) })} className={`${inputClass} min-w-28`} /></TableCell>
                {holes.map(hole => <TableCell key={hole} className="p-1"><Input aria-label={`Player ${i + 1}, hole ${hole}`} aria-describedby={`${fieldId}-score-help`} type="number" inputMode="numeric" min={0} max={99} required value={draft.scoresJson[String(hole)]?.[i] ?? 0} onChange={e => setDraft({ ...draft, scoresJson: { ...draft.scoresJson, [String(hole)]: draft.players.map((_, j) => i === j ? Number(e.target.value) : draft.scoresJson[String(hole)]?.[j] ?? 0) } })} className={`${inputClass} min-w-14 px-2 text-center`} /></TableCell>)}
                <TableCell><Button variant="ghost" type="button" aria-label={`Remove player ${i + 1}`} disabled={draft.players.length === 1} onClick={() => setDraft({ ...draft, players: draft.players.filter((_, j) => j !== i), scoresJson: Object.fromEntries(Object.entries(draft.scoresJson).map(([hole, scores]) => [hole, scores.filter((_, j) => j !== i)])) })} className="flex size-11 items-center justify-center rounded-xl text-red-700 disabled:opacity-30"><Trash2 className="size-4" /></Button></TableCell>
              </TableRow>)}</TableBody>
            </Table>
          <Button variant="ghost" type="button" disabled={draft.players.length >= 8} onClick={() => setDraft({ ...draft, players: [...draft.players, ''], scoresJson: Object.fromEntries(Object.entries(draft.scoresJson).map(([hole, scores]) => [hole, [...scores, 0]])) })} className="flex items-center gap-1 py-2 text-sm font-semibold text-[#047857] disabled:opacity-50"><Plus className="size-4" />Add player</Button>
        </fieldset>
        </div>
        {error && <p id={`${fieldId}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
        <DialogFooter className="mx-0 mb-0 shrink-0 flex-row border-t bg-background px-0 pb-0 pt-3"><DialogClose asChild><Button variant="secondary" type="button" disabled={busy}>Cancel</Button></DialogClose><Button type="submit" disabled={busy} className={primary}>{busy ? photo.file ? 'Uploading photo…' : 'Saving…' : 'Save changes'}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
