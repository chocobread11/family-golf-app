import { useGolfStore, type Course, type GameState, type GroupTemplate } from '@/src/store/useGolfStore';

export interface GameRecord {
  id: string;
  date: string;
  courseId: string;
  course: Course;
  totalHoles: number;
  startingLoop?: string;
  coursePars?: number[];
  players: string[];
  scoresJson: Record<string, number[]>;
  imageUrl?: string | null;
}

export function toGameState(game: GameRecord): GameState {
  return {
    id: game.id, date: game.date, courseId: game.courseId,
    courseName: game.course.name, totalHoles: game.totalHoles,
    startingLoop: game.startingLoop === 'Back' || (game.totalHoles === 9 && Object.keys(game.scoresJson).length > 0 && Object.keys(game.scoresJson).every(hole => Number(hole) >= 10)) ? 'Back' : 'Front',
    coursePars: game.coursePars?.length ? game.coursePars : game.course.pars,
    players: game.players, scoresJson: game.scoresJson, imageUrl: game.imageUrl ?? undefined,
  };
}

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not save changes. Try again.');
  if (typeof data.pendingPhotoCleanup === 'number') useGolfStore.setState({ pendingPhotoCleanup: data.pendingPhotoCleanup });
  return data;
}

export async function refreshRecords(signal?: AbortSignal) {
  const data = await apiRequest<{ games: GameRecord[]; courses: Course[]; groups: GroupTemplate[] }>('/api/sync', { signal });
  useGolfStore.setState({
    history: data.games.map(toGameState), savedCourses: data.courses, savedGroups: data.groups,
  });
}

export function saveRecord<T>(entity: 'game' | 'course' | 'group', record: object, editing: boolean, photo?: File) {
  const data = { ...record, entity };
  if (photo) {
    const form = new FormData();
    form.append('record', JSON.stringify(data));
    form.append('photo', photo);
    return apiRequest<T>('/api/sync', { method: editing ? 'PATCH' : 'POST', body: form });
  }
  return apiRequest<T>('/api/sync', {
    method: editing ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
