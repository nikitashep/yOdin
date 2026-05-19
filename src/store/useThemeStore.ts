import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = '@yodin_theme';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  setPreference: async (preference) => {
    set({ preference });
    await AsyncStorage.setItem(STORAGE_KEY, preference);
  },
}));

export async function initTheme(): Promise<void> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    useThemeStore.setState({ preference: saved });
  }
}
