import { CaretDown, GearSix } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "cn";
import { PLAYGROUND_EXAMPLES } from "../playground-examples";
import { usePlaygroundView } from "../playground-view";
import { useIsHydrated } from "../use-is-hydrated";
import { Logo } from "./logo";
import { usePlayground } from "./playground";
import { RunIcon } from "./run-icon";
import { useTheme } from "./theme-switcher";
import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const APPLE_PLATFORM = /Mac|iPhone|iPad/;

// Runs as the page is parsed, before React loads. The page is built with the Mac shortcut, so
// other systems get their key before the first paint.
const SHORTCUT_SCRIPT = `if (!${APPLE_PLATFORM}.test(navigator.platform)) document.currentScript.previousElementSibling.querySelector("kbd").textContent = "Ctrl ↵";`;

interface HeaderProps {
  children: ReactNode;
}

export const PlaygroundHeader = (props: HeaderProps) => (
  <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
    <a
      href="/"
      className="group/logo -m-2 flex shrink-0 items-center gap-2 p-2 font-medium text-foreground"
    >
      <Logo />
      <span className="max-sm:sr-only">TLA-ts</span>
    </a>
    <span className="text-faint max-sm:hidden">Playground</span>
    <div className="ml-auto flex min-w-0 items-center gap-2">{props.children}</div>
  </header>
);

export const PlaygroundSettings = () => {
  const view = usePlaygroundView();
  const theme = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Settings" className={cn(buttonVariants({ size: "icon" }))}>
        <GearSix />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => view.setIsArrowsShown(!view.isArrowsShown)}
          className="max-md:hidden"
        >
          {view.isArrowsShown ? "Hide arrows" : "Show arrows"}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="max-md:hidden" />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme.theme} onValueChange={theme.setTheme}>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const PlaygroundFiles = () => {
  const playground = usePlayground();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants(), "min-w-0 shrink text-foreground")}>
        <span data-file-name className="truncate">
          {playground.fileName}
        </span>
        <CaretDown className="size-3.5 text-faint" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={playground.fileName}
          onValueChange={(fileName) => playground.selectExample(String(fileName))}
        >
          {PLAYGROUND_EXAMPLES.map((example) => (
            <DropdownMenuRadioItem key={example.fileName} value={example.fileName}>
              {example.fileName}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const PlaygroundRun = () => {
  const playground = usePlayground();
  const isHydrated = useIsHydrated();
  return (
    <>
      <Button
        ref={playground.runButtonRef}
        disabled={!playground.canRun && !playground.isRunning}
        aria-disabled={playground.isRunning}
        variant={playground.isRunning ? "outline" : "success"}
        onClick={playground.run}
      >
        <RunIcon isRunning={playground.isRunning} isDone={false} />
        Run
        <kbd
          suppressHydrationWarning
          className="font-sans opacity-65 max-sm:hidden pointer-coarse:hidden"
        >
          {isHydrated && !APPLE_PLATFORM.test(navigator.platform) ? "Ctrl ↵" : "⌘↵"}
        </kbd>
      </Button>
      {!isHydrated && <script dangerouslySetInnerHTML={{ __html: SHORTCUT_SCRIPT }} />}
    </>
  );
};
