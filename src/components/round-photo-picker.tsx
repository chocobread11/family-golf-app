"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Camera, Trash2 } from 'lucide-react';
import { MAX_PHOTO_BYTES, PHOTO_TYPES } from '@/src/lib/photo-validation';

export interface RoundPhoto { url?: string; file?: File }

export function RoundPhotoPicker({ value, onChange }: { value: RoundPhoto; onChange: (photo: RoundPhoto) => void }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const blob = useRef<string | undefined>(undefined);
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState('');
  const image = value.file ? preview : value.url;
  useEffect(() => () => { if (blob.current) URL.revokeObjectURL(blob.current); }, []);

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type) || !file.size || file.size > MAX_PHOTO_BYTES) {
      setError('Choose a JPG, PNG, WebP, GIF, AVIF, or HEIC photo up to 10 MB.');
      return;
    }
    if (blob.current) URL.revokeObjectURL(blob.current);
    blob.current = URL.createObjectURL(file);
    setPreview(blob.current); setError('');
    onChange({ ...value, file });
  }

  function remove() {
    if (blob.current) URL.revokeObjectURL(blob.current);
    blob.current = undefined;
    setPreview(undefined); setError(''); onChange({});
  }

  return <div className="space-y-2">
    <p className="text-sm font-semibold">Round photo (optional)</p>
    <input ref={input} type="file" accept={PHOTO_TYPES.join(',')} aria-label="Choose round photo" aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} aria-invalid={!!error} onChange={choose} className="hidden" />
    <div className="flex flex-wrap items-center gap-3">
      {image && <img src={image} alt="Round photo preview" className="size-20 rounded-xl object-cover" /> /* eslint-disable-line @next/next/no-img-element */}
      <button type="button" onClick={() => input.current?.click()} className="flex min-h-11 items-center gap-2 rounded-xl bg-[#F4F6F9] px-3 text-sm font-semibold"><Camera aria-hidden="true" className="size-4" />{image ? 'Replace photo' : 'Add photo'}</button>
      {image && <AlertDialog.Root>
        <AlertDialog.Trigger asChild><button type="button" className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-700"><Trash2 aria-hidden="true" className="size-4" />Remove photo</button></AlertDialog.Trigger>
        <AlertDialog.Portal><AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" /><AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-[#1C1C1E] shadow-xl">
          <AlertDialog.Title className="text-lg font-bold text-balance">Remove round photo?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-[#62626A]">The photo will be removed from this match when you save changes. Its scores will be kept.</AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2"><AlertDialog.Cancel className="rounded-xl bg-[#F4F6F9] px-4 py-3 text-sm font-semibold">Cancel</AlertDialog.Cancel><AlertDialog.Action onClick={remove} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white">Remove photo</AlertDialog.Action></div>
        </AlertDialog.Content></AlertDialog.Portal>
      </AlertDialog.Root>}
    </div>
    <p id={`${id}-help`} className="text-xs text-[#62626A]">{value.file ? `${value.file.name} · ` : ''}Up to 10 MB. Photo changes apply when you save.</p>
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
