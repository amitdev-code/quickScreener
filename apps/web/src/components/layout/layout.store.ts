import { create } from "zustand";

interface LayoutState {
  title: string;
  subtitle?: string;
  sidebarCollapsed: boolean;
  setPageHeader: (title: string, subtitle?: string) => void;
  toggleSidebar: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  title: "Dashboard",
  subtitle: undefined,
  sidebarCollapsed: false,
  setPageHeader: (title, subtitle) => set({ title, subtitle }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
