import { PlaygroundRoot, PlaygroundWorkspace } from "@/components/playground/playground";
import {
  PlaygroundFiles,
  PlaygroundHeader,
  PlaygroundRun,
  PlaygroundSettings,
} from "@/components/playground/playground-header";
import {
  PlaygroundArrows,
  PlaygroundOutput,
  PlaygroundPanes,
  PlaygroundSource,
} from "@/components/playground/playground-panes";
import { PlaygroundResult } from "@/components/playground/playground-result";

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
