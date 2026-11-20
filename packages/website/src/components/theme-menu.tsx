import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { ThemeSwitcher } from "./theme-switcher";

export const ThemeMenu = () => (
  <ThemeSwitcher.Root>
    <ThemeSwitcher.Option value="system" label="System theme">
      <Monitor className="size-4" />
    </ThemeSwitcher.Option>
    <ThemeSwitcher.Option value="light" label="Light theme">
      <Sun className="size-4" />
    </ThemeSwitcher.Option>
    <ThemeSwitcher.Option value="dark" label="Dark theme">
      <Moon className="size-4" />
    </ThemeSwitcher.Option>
  </ThemeSwitcher.Root>
);
