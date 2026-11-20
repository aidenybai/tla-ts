import { PlaygroundRoot, PlaygroundWorkspace } from "./playground";
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

// Here and not beside PlaygroundRoot, whose file the other parts import.
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
