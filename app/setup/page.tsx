"use client";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGolfStore } from '@/src/store/useGolfStore';
import { Plus, Camera, ArrowLeft, Trash2, RefreshCw } from 'lucide-react';

import { TemplateDialog } from '@/src/components/record-dialogs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/src/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { PlayerInputs, playerInputs, type PlayerInput } from '@/src/components/player-inputs';

export default function GameSetup() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { savedCourses, savedGroups, startNewGame, syncTemplates } = useGolfStore();

  const [totalHoles, setTotalHoles] = useState<9 | 18>(9);
  const [startingLoop, setStartingLoop] = useState<'Front' | 'Back'>('Front');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [players, setPlayers] = useState<PlayerInput[]>([]);
  const [validatePlayers, setValidatePlayers] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- R2 Media Storage State Pipeline ---
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function fetchDatabaseTemplates() {
      try {
        const res = await fetch('/api/sync');
        if (!res.ok) throw new Error('Could not load courses and groups. Check the database and reload.');
        if (res.ok) {
          const payload = await res.json();

          const coursesFromDb = payload.courses || [];
          const groupsFromDb = payload.groups || [];

          syncTemplates(coursesFromDb, groupsFromDb);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load saved templates.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDatabaseTemplates();
  }, [syncTemplates]);

  const triggerFeedback = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError('');
      triggerFeedback();

      const signRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      const signed = await signRes.json();
      if (!signRes.ok) throw new Error(signed.error || 'Could not upload this photo.');
      const { uploadUrl, publicUrl } = signed;

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('R2 cloud storage rejection');
      setImageUrl(publicUrl);
    } catch (err) {
      console.error('Upload operation failed:', err);
      setUploadError(err instanceof Error ? err.message : 'Could not attach this photo. Try again or start without it.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStart = () => {
    triggerFeedback();
    setValidatePlayers(true);
    setError('');
    const course = savedCourses.find(item => item.id === selectedCourseId) ?? savedCourses[0];
    const names = players.map(player => player.name.trim());
    if (!course) { setError('Add a course before starting.'); return; }
    if (!names.length || names.some(name => !name) || new Set(names.map(name => name.toLowerCase())).size !== names.length) return;
    if ((totalHoles === 18 || startingLoop === 'Back') && course.pars.length < 18) {
      setError('Choose an 18-hole course for this round configuration.'); return;
    }

    startNewGame({
      courseId: course.id,
      courseName: course.name,
      totalHoles,
      startingLoop,
      players: names,
      coursePars: course.pars,
      imageUrl: imageUrl || undefined
    });
    router.push('/play');
  };

  return (
    <main className="w-full max-w-3xl mx-auto min-h-[100dvh] bg-white text-black font-sans pt-0 md:pt-6 subpixel-antialiased flex flex-col justify-between pb-[calc(3.5rem+env(safe-area-inset-bottom))] px-2 sm:px-4 md:px-6">

        {/* Top Header Navigation Panel */}
        <div className="relative flex items-center justify-center pt-4 px-1 min-h-[56px] flex-shrink-0 w-full">
        {/* Absolute aligned back button safely clears text space */}
        <Button variant="ghost"
            aria-label="Back to dashboard"
            onClick={() => { triggerFeedback(); router.push('/'); }}
            className="absolute left-1 p-3 bg-[#F4F6F9] border border-[#F1F5F9]/40 text-[#1C1C1E] active:bg-[#F1F5F9] rounded-2xl transition shadow-[0_4px_10px_rgba(0,0,0,0.01)] z-10"
        >
            <ArrowLeft className="w-4 h-4" />
        </Button>

        {/* Clean, centered text frame */}
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1C1E] text-center">
            Setup Match
        </h1>
        </div>

      {/* --- CENTERING MIDDLE WRAPPER ZONE --- */}
      <div className="flex-1 flex flex-col justify-center space-y-6 py-6 min-h-0">

        {/* Media Context Container */}
        <div className="mx-auto w-full">
          <Input
            aria-label="Round photo"
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />

          {!imageUrl ? (
            <Button variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-auto aspect-[4/3] flex flex-col items-center justify-center border border-dashed border-[#C7C7CC] bg-[#F4F6F9] rounded-3xl hover:bg-[#F1F5F9]/50 transition duration-150"
            >
              <Camera className="w-5 h-5 text-[#62626A] mb-1" />
              <span className="text-xs font-bold text-[#62626A]">
                {isUploading ? 'Uploading photo…' : 'Add a round photo (optional)'}
              </span>
            </Button>
          ) : (
            <div className="w-full h-auto aspect-[4/3] rounded-3xl overflow-hidden relative border border-[#F1F5F9]/40 shadow-xs bg-[#F4F6F9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Active Snapshot Selection Layout Preview"
                className="w-full h-full object-cover"
              />

              <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                <Button variant="ghost"
                  aria-label="Replace round photo"
                  onClick={() => { triggerFeedback(); fileInputRef.current?.click(); }}
                  className="size-11 rounded-full bg-black/70 flex items-center justify-center text-white active:bg-black/60 shadow-md transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost"
                  aria-label="Remove round photo"
                  onClick={() => { triggerFeedback(); setImageUrl(null); }}
                  className="size-11 rounded-full bg-black/70 flex items-center justify-center text-white active:bg-black/60 shadow-md transition"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="absolute bottom-3 left-3 bg-black/60 text-white font-semibold text-xs px-2.5 py-0.5 rounded-full backdrop-blur-xs uppercase tracking-wider">
                Preview Image
              </div>
            </div>
          )}
        </div>

        {uploadError && <p role="alert" className="px-1 text-sm text-red-700">{uploadError}</p>}

        {/* Selection Tab Section */}
        <div className="space-y-4">
          <fieldset>
            <legend className="text-xs font-semibold text-[#62626A] uppercase tracking-widest block mb-2 pl-0.5">Round Configuration</legend>
            <ToggleGroup type="single" value={String(totalHoles)} onValueChange={value => { if (value) { triggerFeedback(); setTotalHoles(Number(value) as 9 | 18); } }} className="grid w-full grid-cols-2 rounded-xl bg-muted p-1" aria-label="Round length">
              <ToggleGroupItem value="9" className="min-h-11 data-[state=on]:bg-foreground data-[state=on]:text-background">9 Holes</ToggleGroupItem>
              <ToggleGroupItem value="18" className="min-h-11 data-[state=on]:bg-foreground data-[state=on]:text-background">18 Holes</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-[#62626A] uppercase tracking-widest block mb-2 pl-0.5">Starting Tee</legend>
            <ToggleGroup type="single" value={startingLoop} onValueChange={value => { if (value) { triggerFeedback(); setStartingLoop(value as 'Front' | 'Back'); } }} className="grid w-full grid-cols-2 rounded-xl bg-muted p-1" aria-label="Starting nine">
              <ToggleGroupItem value="Front" className="min-h-11 data-[state=on]:bg-foreground data-[state=on]:text-background">Front 9 (H1)</ToggleGroupItem>
              <ToggleGroupItem value="Back" className="min-h-11 data-[state=on]:bg-foreground data-[state=on]:text-background">Back 9 (H10)</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>
        </div>

        {/* Dropdown Selection Blocks */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="course" className="text-sm font-semibold text-[#1C1C1E] block pl-0.5">Course Template</Label>
            <div className="flex min-w-0 items-center gap-2">
              <Select disabled={isLoading || !savedCourses.length} value={selectedCourseId || savedCourses[0]?.id || ''} onValueChange={setSelectedCourseId}>
                <SelectTrigger id="course" className="min-w-0 flex-1 bg-muted"><SelectValue placeholder={isLoading ? 'Loading courses…' : 'Choose a course'} /></SelectTrigger>
                <SelectContent position="popper">{savedCourses.map(course => <SelectItem key={course.id} value={course.id}>{course.name} ({course.pars.length}H)</SelectItem>)}</SelectContent>
              </Select>
              <TemplateDialog entity="course" onSaved={course => setSelectedCourseId(course.id)}><Button variant="outline" size="icon" type="button" aria-label="Add course"><Plus className="size-4" /></Button></TemplateDialog>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group" className="text-sm font-semibold text-[#1C1C1E] block pl-0.5">Player Group</Label>
            <div className="flex min-w-0 items-center gap-2">
              <Select disabled={isLoading} value={selectedGroupId || 'custom'} onValueChange={value => { const id = value === 'custom' ? '' : value; setSelectedGroupId(id); setPlayers(playerInputs(savedGroups.find(group => group.id === id)?.players ?? [])); setValidatePlayers(false); }}>
                <SelectTrigger id="group" className="min-w-0 flex-1 bg-muted"><SelectValue placeholder="Choose a saved group (optional)" /></SelectTrigger>
                <SelectContent position="popper"><SelectItem value="custom">Choose a saved group (optional)</SelectItem>{savedGroups.map(group => <SelectItem key={group.id} value={group.id}>{group.name} — ({group.players.join(', ')})</SelectItem>)}</SelectContent>
              </Select>
              <TemplateDialog entity="group" onSaved={group => { setSelectedGroupId(group.id); if ('players' in group) setPlayers(playerInputs(group.players)); }}><Button variant="outline" size="icon" type="button" aria-label="Add player group"><Plus className="size-4" /></Button></TemplateDialog>
            </div>
            <PlayerInputs players={players} onChange={setPlayers} showErrors={validatePlayers} />
          </div>
        </div>

      </div>

      {error && <p role="alert" className="mb-3 px-1 text-sm text-red-700">{error}</p>}
      {!isLoading && (!savedCourses.length || !players.length) && <p id="start-help" role="status" className="mb-3 text-sm text-[#62626A]">Choose a course and add at least one player to start a round.</p>}
      {/* Start Button */}
      <Button aria-describedby={!isLoading && (!savedCourses.length || !players.length) ? 'start-help' : undefined} disabled={isLoading || isUploading || !savedCourses.length || !players.length} onClick={handleStart} className="w-full bg-[#047857] hover:bg-[#065F46] text-white font-bold py-4 rounded-3xl shadow-sm shrink-0 transition text-sm tracking-tight mb-2">
        {isLoading ? 'Loading courses…' : isUploading ? 'Uploading photo…' : 'Start Round'}
      </Button>

    </main>
  );
}
