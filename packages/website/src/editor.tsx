import { Viewer } from "./components/editor/viewer";
import { TYPESCRIPT_EXAMPLES } from "./typescript-examples";

export const Editor = () => (
  <Viewer examples={TYPESCRIPT_EXAMPLES} defaultFileName="die-hard.ts">
    <title>Editor · tla-ts</title>
    <Viewer.Toolbar />
    <Viewer.Panes>
      <Viewer.Source />
      <Viewer.Output />
    </Viewer.Panes>
    <Viewer.Status />
  </Viewer>
);
