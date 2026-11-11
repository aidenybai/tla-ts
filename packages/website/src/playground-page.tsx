import {
  PlaygroundHeader,
  PlaygroundPanes,
  PlaygroundRoot,
  PlaygroundStatus,
} from "./components/playground";

export const PlaygroundPage = () => (
  <PlaygroundRoot>
    <PlaygroundHeader />
    <PlaygroundPanes />
    <PlaygroundStatus />
  </PlaygroundRoot>
);
