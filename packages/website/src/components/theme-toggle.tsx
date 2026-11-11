import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "tla-ts-theme";

export const ThemeToggle = () => (
  <button
    type="button"
    aria-label="Toggle theme"
    title="Toggle theme"
    onClick={() => {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    }}
    className="group -my-0.5 -mr-2 flex size-9 cursor-pointer items-center justify-center rounded-lg outline-none hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-[0.94]"
  >
    <Sun className="hidden size-4.5 text-gray-1000 group-hover:text-gray-1200 dark:block" />
    <Moon className="size-4.5 text-gray-1000 group-hover:text-gray-1200 dark:hidden" />
  </button>
);
