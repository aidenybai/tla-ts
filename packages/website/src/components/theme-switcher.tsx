import { m } from "motion/react";
import { useId, useState, type ReactNode } from "react";
import { createPartsContext } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

const STORAGE_KEY = "tla-ts-theme";

interface ThemeSwitcherState {
  theme: string;
  indicatorId: string;
}

const themeSwitcherContext = createPartsContext<ThemeSwitcherState>("ThemeSwitcher.Root");

interface RootProps {
  children: ReactNode;
}

export const ThemeSwitcherRoot = (props: RootProps) => {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "system");
  const indicatorId = useId();
  return (
    <themeSwitcherContext.PartsContext value={{ theme, indicatorId }}>
      <ToggleGroup
        label="Theme"
        value={theme}
        onValueChange={(nextTheme) => {
          if (nextTheme === "system") localStorage.removeItem(STORAGE_KEY);
          else localStorage.setItem(STORAGE_KEY, nextTheme);
          document.documentElement.classList.toggle(
            "dark",
            nextTheme === "dark" ||
              (nextTheme === "system" && matchMedia("(prefers-color-scheme: dark)").matches),
          );
          setTheme(nextTheme);
        }}
        className="rounded-full"
      >
        {props.children}
      </ToggleGroup>
    </themeSwitcherContext.PartsContext>
  );
};

interface OptionProps {
  value: "system" | "light" | "dark";
  label: string;
  children: ReactNode;
}

export const ThemeSwitcherOption = (props: OptionProps) => {
  const switcher = themeSwitcherContext.useParts();
  return (
    <ToggleGroupItem value={props.value} label={props.label} className="size-7 rounded-full">
      {switcher.theme === props.value && (
        <m.span
          layoutId={switcher.indicatorId}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          className="absolute inset-0 rounded-full bg-raised shadow-raised"
        />
      )}
      <span className="relative flex">{props.children}</span>
    </ToggleGroupItem>
  );
};
