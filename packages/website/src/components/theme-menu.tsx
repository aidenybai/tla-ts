import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { ThemeSwitcherOption, ThemeSwitcherRoot } from "./theme-switcher";

export const ThemeMenu = () => (
  <ThemeSwitcherRoot>
    <ThemeSwitcherOption value="system" label="System theme">
      <Monitor className="size-4" />
    </ThemeSwitcherOption>
    <ThemeSwitcherOption value="light" label="Light theme">
      <Sun className="size-4" />
    </ThemeSwitcherOption>
    <ThemeSwitcherOption value="dark" label="Dark theme">
      <Moon className="size-4" />
    </ThemeSwitcherOption>
  </ThemeSwitcherRoot>
);
