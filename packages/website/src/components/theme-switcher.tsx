import { useSyncExternalStore, type ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

const STORAGE_KEY = "tla-ts-theme";
const THEME_EVENT = "tla-ts-theme-change";

const subscribeToTheme = (onChange: () => void) => {
  addEventListener(THEME_EVENT, onChange);
  return () => removeEventListener(THEME_EVENT, onChange);
};

interface RootProps {
  children: ReactNode;
}

export const useTheme = () => ({
  theme: useSyncExternalStore(
    subscribeToTheme,
    () => localStorage.getItem(STORAGE_KEY) ?? "system",
    () => "system",
  ),
  setTheme: (nextTheme: string) => {
    if (nextTheme === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, nextTheme);
    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark" ||
        (nextTheme === "system" && matchMedia("(prefers-color-scheme: dark)").matches),
    );
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        getComputedStyle(document.documentElement).getPropertyValue("--background"),
      );
    dispatchEvent(new Event(THEME_EVENT));
  },
});

export const ThemeSwitcherRoot = (props: RootProps) => {
  const theme = useTheme();
  return (
    <ToggleGroup
      label="Theme"
      value={theme.theme}
      onValueChange={theme.setTheme}
      className="rounded-lg"
    >
      {props.children}
    </ToggleGroup>
  );
};

interface OptionProps {
  value: "system" | "light" | "dark";
  label: string;
  children: ReactNode;
}

export const ThemeSwitcherOption = (props: OptionProps) => (
  <ToggleGroupItem value={props.value} label={props.label} className="size-7 rounded-md">
    {props.children}
  </ToggleGroupItem>
);
