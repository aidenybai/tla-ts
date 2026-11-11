import type { Example, ViewFile } from "@/model";
import { Status } from "./status";
import { Toolbar } from "./toolbar";
import { Viewer } from "./viewer";

export interface AppProps {
  examples: Example[];
  name: string;
  view: ViewFile;
}

export const App = (props: AppProps) => (
  <Viewer {...props}>
    <Viewer.Toolbar>
      <Toolbar.Brand />
      <Toolbar.FileMenu />
      <Toolbar.Run />
      <Toolbar.Arrows />
    </Viewer.Toolbar>
    <Viewer.Source />
    <Viewer.Status>
      <Status.Hover />
      <Status.Key />
      <Status.Controls />
    </Viewer.Status>
  </Viewer>
);
