"use client";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogFooter } from "@/src/components/ui/alert-dialog";
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
    <Input ref={input} type="file" accept={PHOTO_TYPES.join(',')} aria-label="Choose round photo" aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} aria-invalid={!!error} onChange={choose} className="hidden" />
    <div className="flex flex-wrap items-center gap-3">
      {image && <img src={image} alt="Round photo preview" className="size-20 rounded-xl object-cover" /> /* eslint-disable-line @next/next/no-img-element */}
      <Button variant="ghost" type="button" onClick={() => input.current?.click()} className="flex min-h-11 items-center gap-2 rounded-xl bg-[#F4F6F9] px-3 text-sm font-semibold"><Camera aria-hidden="true" className="size-4" />{image ? 'Replace photo' : 'Add photo'}</Button>
      {image && <AlertDialog>
        <AlertDialogTrigger asChild><Button variant="ghost" type="button" className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-700"><Trash2 aria-hidden="true" className="size-4" />Remove photo</Button></AlertDialogTrigger>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="text-lg font-bold text-balance">Remove round photo?</AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm text-[#62626A]">The photo will be removed from this match when you save changes. Its scores will be kept.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={remove}>Remove photo</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </div>
    <p id={`${id}-help`} className="text-xs text-[#62626A]">{value.file ? `${value.file.name} · ` : ''}Up to 10 MB. Photo changes apply when you save.</p>
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
