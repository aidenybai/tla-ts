import type { ReactNode } from "react";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import { usePlaygroundView } from "@/lib/playground-view";
import { playgroundContext, usePlayground, usePlaygroundState } from "./playground-context";
import {
  PlaygroundFiles,
  PlaygroundHeader,
  PlaygroundRun,
  PlaygroundSettings,
} from "./playground-header";
import {
  PlaygroundArrows,
  PlaygroundOutput,
  PlaygroundPanes,
  PlaygroundSource,
} from "./playground-panes";
import { PlaygroundResult } from "./playground-result";

// Runs as the page is parsed, before React loads. The page is built with one file, so a link to
// another hides the built one.
const SHARED_SCRIPT = `if (/[#&](file|code)=/.test(location.hash)) document.documentElement.dataset.shared = "";`;

interface PartProps {
  children: ReactNode;
}

const PlaygroundRoot = (props: PartProps) => {
  const isHydrated = useIsHydrated();
  return (
    <playgroundContext.PartsContext value={usePlaygroundState()}>
      <div className="flex h-dvh flex-col text-prose">
        {!isHydrated && <script dangerouslySetInnerHTML={{ __html: SHARED_SCRIPT }} />}
        {props.children}
      </div>
    </playgroundContext.PartsContext>
  );
};

const PlaygroundWorkspace = (props: PartProps) => {
  const playground = usePlayground();
  const isHoveringName = usePlaygroundView((view) => view.hoveredName !== undefined);
  return (
    <main
      ref={playground.workspaceRef}
      data-hovering-name={isHoveringName ? "" : undefined}
      className="relative min-h-0 flex-1 overflow-hidden"
    >
      {props.children}
    </main>
  );
};

export const Playground = {
  Root: PlaygroundRoot,
  Header: PlaygroundHeader,
  Settings: PlaygroundSettings,
  Files: PlaygroundFiles,
  Run: PlaygroundRun,
  Workspace: PlaygroundWorkspace,
  Result: PlaygroundResult,
  Arrows: PlaygroundArrows,
  Panes: PlaygroundPanes,
  Source: PlaygroundSource,
  Output: PlaygroundOutput,
};
