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

const Page = () => (
  <PlaygroundRoot>
    <PlaygroundHeader>
      <PlaygroundSettings />
      <PlaygroundFiles />
      <PlaygroundRun />
    </PlaygroundHeader>
    <PlaygroundWorkspace>
      <PlaygroundResult />
      <PlaygroundArrows />
      <PlaygroundPanes source={<PlaygroundSource />} output={<PlaygroundOutput />} />
    </PlaygroundWorkspace>
  </PlaygroundRoot>
);

export default Page;
