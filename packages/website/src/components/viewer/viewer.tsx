import { Activity, type ComponentType, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useHighlighterWarmup } from "@/hooks/use-highlighter";
import { VIEW_MODES, type ViewMode } from "@/lib/view-mode";
import type { Example, ViewFile } from "@/model";
import { ViewerProvider, useViewer } from "./context";
import { JsonPane } from "./json-pane";
import { SourceMap } from "./source-map";
import { SourcePane } from "./source-pane";
import { Status } from "./status";
import { Toolbar } from "./toolbar";

const Shell = ({ children }: { children: ReactNode }) => {
  useHighlighterWarmup();
  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overscroll-none">
      {children}
    </div>
  );
};

interface RootProps {
  examples: Example[];
  name: string;
  view: ViewFile;
  json: string;
  children: ReactNode;
}

const Root = ({ children, ...props }: RootProps) => (
  <ViewerProvider key={props.name} {...props}>
    <Shell>{children}</Shell>
  </ViewerProvider>
);

const Crash = ({ error }: { error: unknown }) => (
  <pre className="h-full overflow-auto px-4 py-4 font-mono whitespace-pre-wrap text-destructive sm:px-5">
    {error instanceof Error ? (error.stack ?? error.message) : String(error)}
  </pre>
);

const CodePane = () => (
  <SourceMap>
    <SourcePane pane="code" />
    <SourcePane pane="module" />
  </SourceMap>
);

const PANES: Record<ViewMode, ComponentType> = {
  code: CodePane,
  json: JsonPane,
};

const Source = () => {
  const { mode } = useViewer();
  return (
    <main className="min-h-0">
      {VIEW_MODES.map((paneMode) => {
        const Pane = PANES[paneMode];
        return (
          <Activity key={paneMode} mode={paneMode === mode ? "visible" : "hidden"}>
            <ErrorBoundary FallbackComponent={Crash}>
              <Pane />
            </ErrorBoundary>
          </Activity>
        );
      })}
    </main>
  );
};

export const Viewer = Object.assign(Root, { Toolbar, Source, Status });
