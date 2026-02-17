// Zustand store for popup state management

import { create } from 'zustand';
import type { Profile, KeyDisplay } from '@/types';

interface AppState {
  currentProfile: Profile | null;
  profiles: Profile[];
  keys: KeyDisplay[];
  loading: boolean;
  error: string | null;

  setCurrentProfile: (profile: Profile) => void;
  setProfiles: (profiles: Profile[]) => void;
  setKeys: (keys: KeyDisplay[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentProfile: null,
  profiles: [],
  keys: [],
  loading: false,
  error: null,

  setCurrentProfile: (profile) => set({ currentProfile: profile }),
  setProfiles: (profiles) => set({ profiles }),
  setKeys: (keys) => set({ keys }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
