import { create } from "zustand";

export type Theme = "light" | "dark";

interface ResolvedTheme {
  theme: Theme;
  toggleTheme: () => void;
}

const STORAGE_KEY = "tla-ts-theme";

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

// Stands in for next-themes: a class on the root element, so portaled menus share the theme.
const applyTheme = (theme: Theme): void => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

const useThemeStore = create<{ theme: Theme }>(() => ({ theme: getInitialTheme() }));

applyTheme(useThemeStore.getState().theme);
useThemeStore.subscribe((state) => applyTheme(state.theme));

export const useResolvedTheme = (): ResolvedTheme => {
  const theme = useThemeStore((state) => state.theme);
  return {
    theme,
    toggleTheme: () => {
      const next = theme === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      useThemeStore.setState({ theme: next });
    },
  };
};
