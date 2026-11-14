import { PlaygroundHeader, PlaygroundPanes, PlaygroundRoot } from "./components/playground";

export const PlaygroundPage = () => (
  <PlaygroundRoot>
    <PlaygroundHeader />
    <PlaygroundPanes />
  </PlaygroundRoot>
);
