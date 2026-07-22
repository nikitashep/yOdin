import { create } from 'zustand';

// Lightweight global toast: any screen calls show(message); a single <Toast/>
// mounted at the app root renders it and auto-dismisses after a couple seconds.
interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));
