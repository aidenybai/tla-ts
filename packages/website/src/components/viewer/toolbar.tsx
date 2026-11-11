import type { ReactNode } from "react";
import { Check, ChevronDown, Play, Spline, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/lib/navigation";
import { getRouteHref } from "@/lib/route";
import { getFileTitle } from "@/lib/source";
import { cn } from "@/lib/utils";
import { isViewMode } from "@/lib/view-mode";
import { useViewerStore } from "@/store/viewer";
import { useViewer } from "./context";

// Model checks the module with its config. A check runs until it finishes or you stop it.
const Run = () => {
  const { view, runner, setResultOpen } = useViewer();
  if (runner.isRunning)
    return (
      <div className="flex shrink-0 items-center gap-1">
        <Spinner label="Checking" className="size-7" />
        <Button variant="ghost" onClick={runner.stop}>
          <Square />
          Stop
        </Button>
      </div>
    );
  return (
    <Button
      variant="ghost"
      onClick={() => {
        setResultOpen(true);
        runner.run({ kind: "check", source: view.module.source, config: view.config });
      }}
    >
      <Play />
      Run
    </Button>
  );
};

const Arrows = () => {
  const { mode } = useViewer();
  const isShowingAllArcs = useViewerStore((state) => state.isShowingAllArcs);
  const setShowingAllArcs = useViewerStore((state) => state.setShowingAllArcs);
  return (
    <button
      type="button"
      aria-pressed={isShowingAllArcs}
      disabled={mode !== "code"}
      onClick={() => setShowingAllArcs(!isShowingAllArcs)}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground",
      )}
    >
      <Spline />
      All arrows
    </button>
  );
};

const Modes = () => {
  const { mode, setMode } = useViewer();
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => isViewMode(value) && setMode(value)}
      className="max-sm:w-full sm:ml-1"
    >
      <TabsList aria-label="View" className="max-sm:w-full">
        <TabsTrigger value="code">Code</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

const FileMenu = () => {
  const { examples, name, mode, view } = useViewer();
  return (
    <div className="flex h-8 min-w-0 flex-1 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost" }), "min-w-0 font-mono text-foreground")}
        >
          <span className="truncate">{getFileTitle(view.file)}</span>
          <ChevronDown className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {examples.map((example) => (
            <DropdownMenuLinkItem
              key={example.name}
              render={<Link href={getRouteHref(example.name, mode)} />}
              aria-current={example.name === name ? "page" : undefined}
              className="font-mono"
            >
              <span className="flex-1">{getFileTitle(example.file)}</span>
              {example.name === name && <Check />}
            </DropdownMenuLinkItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const Logo = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="size-5">
    <path d="M6.5 1h3v5.5H15v3H9.5V15h-3V9.5H1v-3h5.5z" />
  </svg>
);

const Root = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b px-3 pt-2 pb-2.5 sm:h-12 sm:flex-nowrap sm:py-0">
    {children}
  </div>
);

const Brand = () => (
  <div className="flex h-8 shrink-0 items-center gap-2">
    <span className="flex items-center gap-2 px-1 text-[15px]/[20px] font-semibold tracking-[-0.02em] text-foreground">
      <Logo />
      tla-ts
    </span>
    <span className="h-4 w-px bg-border" />
  </div>
);

export const Toolbar = Object.assign(Root, { Brand, FileMenu, Run, Arrows, Modes });
