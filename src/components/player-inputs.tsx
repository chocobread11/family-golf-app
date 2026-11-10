"use client";

import { useId, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface PlayerInput { id: string; name: string }

export function playerInputs(names: string[]): PlayerInput[] {
  return names.map(name => ({ id: crypto.randomUUID(), name }));
}

export function PlayerInputs({ players, onChange, showErrors = false }: { players: PlayerInput[]; onChange: (players: PlayerInput[]) => void; showErrors?: boolean }) {
  const fieldId = useId();
  const addButton = useRef<HTMLButtonElement>(null);
  const [focusId, setFocusId] = useState('');
  const names = players.map(player => player.name.trim().toLowerCase());
  const invalid = (index: number) => !names[index] || names.filter(name => name === names[index]).length > 1;
  const validation = !showErrors ? '' : names.some(name => !name) ? 'Enter a name for each player.' : new Set(names).size !== names.length ? 'Each player needs a different name.' : '';

  function addPlayer() {
    if (players.length >= 8) return;
    const player = { id: crypto.randomUUID(), name: '' };
    setFocusId(player.id);
    onChange([...players, player]);
    if (navigator.vibrate) navigator.vibrate(12);
  }

  return <div className="space-y-3">
    {players.map((player, index) => <div key={player.id} className="flex items-center gap-2">
      <label htmlFor={`${fieldId}-${player.id}`} className="sr-only">Player {index + 1} name</label>
      <input id={`${fieldId}-${player.id}`} autoFocus={player.id === focusId} required maxLength={160} autoComplete="off" aria-invalid={showErrors && invalid(index)} aria-describedby={validation ? `${fieldId}-error` : `${fieldId}-help`} value={player.name} placeholder={`Player ${index + 1} name`} onChange={event => onChange(players.map(item => item.id === player.id ? { ...item, name: event.target.value } : item))} className="min-w-0 w-full rounded-xl border border-slate-200 bg-[#F4F6F9] px-3 py-3 text-base text-[#1C1C1E] aria-invalid:border-red-500" />
      <button type="button" aria-label={`Remove player ${index + 1}`} onClick={() => { onChange(players.filter(item => item.id !== player.id)); requestAnimationFrame(() => addButton.current?.focus()); }} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-red-700 hover:bg-red-50"><Trash2 aria-hidden="true" className="size-4" /></button>
    </div>)}
    <button ref={addButton} type="button" disabled={players.length >= 8} aria-describedby={`${fieldId}-help`} onClick={addPlayer} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-[#F4F6F9] px-4 py-3 text-sm font-semibold text-[#047857] hover:bg-[#E8F5E9] disabled:opacity-50"><Plus aria-hidden="true" className="size-4" />Add player</button>
    <p id={`${fieldId}-help`} role="status" className="text-xs text-[#62626A]">{players.length === 0 ? 'No players yet. Add your first player.' : players.length === 8 ? '8 of 8 players. Maximum reached.' : `${players.length} of 8 players. Each player needs a different name.`}</p>
    {validation && <p id={`${fieldId}-error`} role="alert" className="text-sm text-red-700">{validation}</p>}
  </div>;
}
