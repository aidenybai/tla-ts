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

// The playground's parts, apart from the home page's, so that its page loads none of the home
// page's examples.
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
