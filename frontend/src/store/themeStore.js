import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: "dark", // 'light', 'dark', 'midnight', 'sepia'
      setTheme: (theme) => set({ theme }),
    }),
    { name: "pulse-theme" }
  )
);
