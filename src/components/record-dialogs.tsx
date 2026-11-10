"use client";

import { useId, useState, type ReactNode, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { X, Plus, Trash2 } from 'lucide-react';
import { useGolfStore, type Course, type GameState, type GroupTemplate } from '@/src/store/useGolfStore';
import { apiRequest, saveRecord, toGameState, type GameRecord } from '@/src/lib/golf-api';
import { cn } from '@/src/lib/utils';
import { RoundPhotoPicker, type RoundPhoto } from '@/src/components/round-photo-picker';

const overlay = 'fixed inset-0 z-40 bg-black/40';
const panel = 'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-xl max-h-[85dvh] overflow-y-auto text-[#1C1C1E]';
export const inputClass = 'w-full rounded-xl border border-slate-200 bg-[#F4F6F9] px-3 py-3 text-base text-[#1C1C1E]';
const primary = 'rounded-xl bg-[#059669] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50';
const secondary = 'rounded-xl bg-[#F4F6F9] px-4 py-3 text-sm font-semibold text-[#48484A]';

function CloseButton() {
  return <Dialog.Close aria-label="Close dialog" className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-xl hover:bg-[#F4F6F9]"><X className="size-5" /></Dialog.Close>;
}

export function TemplateDialog({ entity, record, children, onSaved }: {
  entity: 'course' | 'group'; record?: Course | GroupTemplate; children: ReactNode;
  onSaved?: (record: Course | GroupTemplate) => void;
}) {
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [values, setValues] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const noun = entity === 'course' ? 'course' : 'player group';

  function changeOpen(next: boolean) {
    if (busy) return;
    if (next) {
      setName(record?.name ?? '');
      setValues(record ? ('pars' in record ? record.pars.join(' ') : record.players.join('\n')) : '');
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
        ? { pars: values.trim().split(/[\s,]+/).map(Number) }
        : { players: values.split('\n').map(value => value.trim()).filter(Boolean) };
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

  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger asChild>{children}</Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className={overlay} /><Dialog.Content className={panel} aria-busy={busy}>
      <CloseButton />
      <Dialog.Title className="pr-10 text-lg font-bold text-balance">{record ? 'Edit' : 'Add'} {noun}</Dialog.Title>
      <Dialog.Description className="mt-1 text-sm text-[#62626A] text-pretty">{entity === 'course' ? 'Save a course layout for future rounds. Existing match scores keep their original par values.' : 'Save a player lineup to use when starting a match.'}</Dialog.Description>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <label className="block text-sm font-semibold">{entity === 'course' ? 'Course name' : 'Group name'}<input required maxLength={160} value={name} onChange={e => setName(e.target.value)} className={`${inputClass} mt-1.5`} /></label>
          <div><label htmlFor={`${fieldId}-values`} className="block text-sm font-semibold">{entity === 'course' ? 'Par for each hole' : 'Players'}</label>
            <textarea id={`${fieldId}-values`} required rows={entity === 'course' ? 3 : 5} value={values} onChange={e => setValues(e.target.value)} aria-describedby={`${fieldId}-help`} className={cn(inputClass, 'mt-1.5', entity === 'course' && 'font-mono tabular-nums')} />
          </div>
          <p id={`${fieldId}-help`} className="text-xs text-[#62626A]">{entity === 'course' ? 'Enter 9 or 18 numbers separated by spaces. Each par must be 3, 4, or 5.' : 'One player per line. Add between 1 and 8 players with different names.'}</p>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><Dialog.Close disabled={busy} className={secondary}>Cancel</Dialog.Close><button disabled={busy} className={primary}>{busy ? 'Saving…' : 'Save changes'}</button></div>
      </form>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
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
  return <AlertDialog.Root open={open} onOpenChange={next => { if (!busy) { setOpen(next); setError(''); } }}>
    <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>
    <AlertDialog.Portal><AlertDialog.Overlay className={overlay} /><AlertDialog.Content className={panel} aria-busy={busy}>
      <AlertDialog.Title className="text-lg font-bold text-balance">Delete {entity === 'game' ? 'match' : entity === 'group' ? 'player group' : 'course'}?</AlertDialog.Title>
      <AlertDialog.Description className="mt-2 text-sm text-[#62626A] text-pretty">“{name}” will be permanently removed. This cannot be undone.{entity === 'course' && ' Courses used by saved matches cannot be deleted.'}</AlertDialog.Description>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-2"><AlertDialog.Cancel disabled={busy} className={secondary}>Cancel</AlertDialog.Cancel><AlertDialog.Action disabled={busy} onClick={remove} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Deleting…' : 'Delete'}</AlertDialog.Action></div>
    </AlertDialog.Content></AlertDialog.Portal>
  </AlertDialog.Root>;
}

function localDateTime(date: string) {
  const value = new Date(date);
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function EditMatch({ game, children }: { game: GameState; children: ReactNode }) {
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
  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger asChild>{children}</Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className={overlay} /><Dialog.Content className={cn(panel, 'max-w-2xl')} aria-busy={busy}>
      <CloseButton /><Dialog.Title className="pr-10 text-lg font-bold text-balance">Edit match</Dialog.Title>
      <Dialog.Description className="mt-1 text-sm text-[#62626A] text-pretty">Update the round details, players, and scores. Changes are saved together.</Dialog.Description>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Date and time<input required type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className={`${inputClass} mt-1.5`} /></label>
            <label className="block text-sm font-semibold">Course<select value={draft.courseId} onChange={e => { const course = courses.find(item => item.id === e.target.value); if (course) setDraft({ ...draft, courseId: course.id, courseName: course.name, coursePars: course.id === game.courseId ? game.coursePars : course.pars }); }} className={`${inputClass} mt-1.5`}>
              {!courses.some(course => course.id === draft.courseId) && <option value={draft.courseId}>{draft.courseName}</option>}
              {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select></label>
            <label className="block text-sm font-semibold">Round length<select value={draft.totalHoles} onChange={e => setDraft({ ...draft, totalHoles: Number(e.target.value) })} className={`${inputClass} mt-1.5`}><option value={9}>9 holes</option><option value={18}>18 holes</option></select></label>
            <label className="block text-sm font-semibold">Starting nine<select value={draft.startingLoop} onChange={e => setDraft({ ...draft, startingLoop: e.target.value as 'Front' | 'Back' })} className={`${inputClass} mt-1.5`}><option>Front</option><option>Back</option></select></label>
          </div>
          <RoundPhotoPicker value={photo} onChange={setPhoto} />
          <p id="score-help" className="text-xs text-[#62626A]">Scroll sideways to edit each hole. Use 0 for an unplayed hole. Player names must be different.</p>
          <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Editable match scores">
            <table className="w-full text-sm text-center tabular-nums"><caption className="sr-only">Player names and scores by hole</caption>
              <thead><tr><th scope="col" className="py-2 text-left">Player</th>{holes.map(hole => <th key={hole} scope="col" className="min-w-16 py-2">H{hole}</th>)}<th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{draft.players.map((player, i) => <tr key={i}>
                <td className="py-1 pr-2"><input aria-label={`Player ${i + 1} name`} required maxLength={160} value={player} onChange={e => setDraft({ ...draft, players: draft.players.map((name, j) => i === j ? e.target.value : name) })} className={`${inputClass} min-w-28`} /></td>
                {holes.map(hole => <td key={hole} className="p-1"><input aria-label={`Player ${i + 1}, hole ${hole}`} aria-describedby="score-help" type="number" min={0} max={99} required value={draft.scoresJson[String(hole)]?.[i] ?? 0} onChange={e => setDraft({ ...draft, scoresJson: { ...draft.scoresJson, [String(hole)]: draft.players.map((_, j) => i === j ? Number(e.target.value) : draft.scoresJson[String(hole)]?.[j] ?? 0) } })} className={`${inputClass} min-w-14 px-2 text-center`} /></td>)}
                <td><button type="button" aria-label={`Remove player ${i + 1}`} disabled={draft.players.length === 1} onClick={() => setDraft({ ...draft, players: draft.players.filter((_, j) => j !== i), scoresJson: Object.fromEntries(Object.entries(draft.scoresJson).map(([hole, scores]) => [hole, scores.filter((_, j) => j !== i)])) })} className="flex size-10 items-center justify-center rounded-xl text-red-700 disabled:opacity-30"><Trash2 className="size-4" /></button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <button type="button" disabled={draft.players.length >= 8} onClick={() => setDraft({ ...draft, players: [...draft.players, ''], scoresJson: Object.fromEntries(Object.entries(draft.scoresJson).map(([hole, scores]) => [hole, [...scores, 0]])) })} className="flex items-center gap-1 py-2 text-sm font-semibold text-[#059669] disabled:opacity-50"><Plus className="size-4" />Add player</button>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white py-3"><Dialog.Close disabled={busy} className={secondary}>Cancel</Dialog.Close><button disabled={busy} className={primary}>{busy ? photo.file ? 'Uploading photo…' : 'Saving…' : 'Save changes'}</button></div>
      </form>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
