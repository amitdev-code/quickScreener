import { create } from "zustand";

interface LayoutState {
  title: string;
  subtitle?: string;
  setPageHeader: (title: string, subtitle?: string) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  title: "Dashboard",
  subtitle: undefined,
  setPageHeader: (title, subtitle) => set({ title, subtitle }),
}));
