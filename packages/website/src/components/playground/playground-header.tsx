import { CaretDown, GearSix } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "cn";
import { PLAYGROUND_EXAMPLES } from "@/lib/playground-examples";
import { usePlaygroundView } from "@/lib/playground-view";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import { Logo } from "@/components/logo";
import { usePlayground } from "./playground-context";
import { RunIcon } from "@/components/run-icon";
import { useTheme } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger aria-label="Settings" className={cn(buttonVariants({ size: "icon" }))}>
        <GearSix />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item onClick={() => view.setIsArrowsShown(!view.isArrowsShown)}>
          {view.isArrowsShown ? "Hide arrows" : "Show arrows"}
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          <DropdownMenu.Label>Theme</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={theme.theme} onValueChange={theme.setTheme}>
            <DropdownMenu.RadioItem value="system">System</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="light">Light</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="dark">Dark</DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

// Runs right after the built file's name, and writes the name of the file a link carries in its
// place, so the name's button has its width from the first paint.
const SHARED_NAME_SCRIPT = `{const shared = new URLSearchParams(location.hash.slice(1)); const name = shared.get("file") ?? (shared.has("code") ? "example.ts" : null); if (name !== null) document.currentScript.previousElementSibling.textContent = name;}`;

export const PlaygroundFiles = () => {
  const playground = usePlayground();
  const isHydrated = useIsHydrated();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={cn(buttonVariants(), "min-w-0 shrink text-foreground")}>
        <span suppressHydrationWarning className="truncate">
          {playground.fileName}
        </span>
        {!isHydrated && <script dangerouslySetInnerHTML={{ __html: SHARED_NAME_SCRIPT }} />}
        <CaretDown className="size-3.5 text-faint" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.RadioGroup
          value={playground.fileName}
          onValueChange={(fileName) => playground.selectExample(String(fileName))}
        >
          {PLAYGROUND_EXAMPLES.map((example) => (
            <DropdownMenu.RadioItem key={example.fileName} value={example.fileName}>
              {example.fileName}
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
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
