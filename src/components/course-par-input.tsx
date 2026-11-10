"use client";

import { useId, useState } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function CourseParInput({ pars, onChange }: { pars: number[]; onChange: (pars: number[]) => void }) {
  const fieldId = useId();
  const [feedback, setFeedback] = useState('');
  const valid = pars.length === 9 || pars.length === 18;

  function addPar(par: number) {
    if (pars.length >= 18) return;
    const count = pars.length + 1;
    onChange([...pars, par]);
    setFeedback(`Hole ${count} set to par ${par}. ${count === 18 ? 'All 18 holes are ready to save.' : count === 9 ? '9 holes ready. Save now or continue to 18.' : `Next: hole ${count + 1}.`}`);
    if (navigator.vibrate) navigator.vibrate(12);
  }

  function undo() {
    const count = pars.length;
    if (!count) return;
    onChange(pars.slice(0, -1));
    setFeedback(`Hole ${count} removed. Set its par again using 3, 4, or 5.`);
    if (navigator.vibrate) navigator.vibrate(12);
  }

  return <fieldset className="min-w-0 space-y-3" aria-describedby={`${fieldId}-help ${fieldId}-feedback`}>
    <legend className="mb-2 text-sm font-semibold">Par for each hole</legend>
    <div className="min-h-24 rounded-2xl bg-[#0F172A] p-4 text-center">
      {pars.length ? <ol aria-label="Course pars" className="grid grid-cols-9 gap-x-1 gap-y-2 font-mono text-lg font-bold tabular-nums text-[#F59E0B]">
        {pars.map((par, index) => <li key={index} className={cn('rounded', index === pars.length - 1 && 'bg-white/10 text-white')}><span className="sr-only">Hole {index + 1}, par </span>{par}</li>)}
      </ol> : <p className="py-2 text-sm text-white/90">Tap 3, 4, or 5 to set hole 1.</p>}
      <p className="mt-2 text-xs text-white/80 tabular-nums">{pars.length}/18 holes · Total par {pars.reduce((total, par) => total + par, 0)}</p>
    </div>
    <div className="grid grid-cols-4 gap-2">
      {[3, 4, 5].map(par => <button key={par} type="button" aria-label={`Add par ${par}`} disabled={pars.length === 18} onClick={() => addPar(par)} className="min-h-12 rounded-xl border border-slate-200 bg-[#F4F6F9] text-xl font-bold text-[#1C1C1E] hover:bg-[#E8F5E9] active:bg-[#C8E6C9] disabled:opacity-50">{par}</button>)}
      <button type="button" aria-label="Undo last hole" disabled={!pars.length} onClick={undo} className="flex min-h-12 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#9A3412] hover:bg-[#FDE68A] disabled:opacity-50"><Delete aria-hidden="true" className="size-5" /></button>
    </div>
    <p id={`${fieldId}-feedback`} role="status" className="min-h-10 text-sm text-[#047857]">{feedback || (valid ? `${pars.length} holes ready to save.` : 'Tap the buttons in hole order. Each tap adds one hole.')}</p>
    <div className="flex items-center justify-between gap-3">
      <p id={`${fieldId}-help`} className="text-xs text-[#62626A]">{valid ? 'Save this layout, or use Undo to correct the last hole.' : `Add ${pars.length < 9 ? 9 - pars.length : 18 - pars.length} more hole${(pars.length < 9 ? 9 - pars.length : 18 - pars.length) === 1 ? '' : 's'} to save a ${pars.length < 9 ? 9 : 18}-hole course.`}</p>
      <button type="button" disabled={!pars.length} onClick={() => { onChange([]); setFeedback('Pars reset. Start again from hole 1.'); }} className="min-h-11 shrink-0 px-2 text-xs font-semibold text-[#62626A] underline disabled:opacity-50">Reset pars</button>
    </div>
  </fieldset>;
}
