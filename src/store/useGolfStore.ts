import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Course {
  id: string;
  name: string;
  pars: number[];
}

export interface GroupTemplate {
  id: string;
  name: string;
  players: string[];
}

export interface GameState {
  id: string;
  date: string;
  courseId: string;
  courseName: string;
  totalHoles: number;
  startingLoop: 'Front' | 'Back';
  players: string[];
  imageUrl?: string;
  scoresJson: Record<string, number[]>; // "1": [4, 5, 3]
  coursePars: number[];
}

interface GolfStore {
  history: GameState[];
  savedCourses: Course[];
  savedGroups: GroupTemplate[];
  activeGame: GameState | null;
  startNewGame: (config: Omit<GameState, 'scoresJson' | 'id' | 'date'>) => void;
  updateHoleScores: (holeNumber: string, scores: number[]) => void;
  saveActiveToHistory: () => GameState | null;
  clearActiveGame: () => void;
  syncTemplates: (courses: Course[], groups: GroupTemplate[]) => void;
}

export const useGolfStore = create<GolfStore>()(
  persist(
    (set, get) => ({
      history: [],
      savedCourses: [],
      savedGroups: [{ id: 'g1', name: 'Full Flight', players: ['Ayah', 'Luqman', 'Umar', 'Abang'] }],
      activeGame: null,

      startNewGame: (config) => set({
        activeGame: {
          ...config,
          id: `game_${Date.now()}`,
          date: new Date().toISOString(),
          scoresJson: {}
        }
      }),

      updateHoleScores: (holeNumber, scores) => set((state) => {
        if (!state.activeGame) return state;
        return {
          activeGame: {
            ...state.activeGame,
            scoresJson: {
              ...state.activeGame.scoresJson,
              [holeNumber]: scores
            }
          }
        };
      }),

      saveActiveToHistory: () => {
        const { activeGame } = get();
        if (!activeGame) return null;
        set((state) => ({
          history: [activeGame, ...state.history],
          activeGame: null
        }));
        return activeGame;
      },

      clearActiveGame: () => set({ activeGame: null }),
      
      syncTemplates: (courses, groups) => set((state) => ({
        savedCourses: courses.length > 0 ? courses : state.savedCourses,
        savedGroups: groups.length > 0 ? groups : state.savedGroups,
      }))
    }),
    {
      name: 'family-golf-local-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);