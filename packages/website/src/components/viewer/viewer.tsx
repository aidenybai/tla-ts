import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useHighlighterWarmup } from "@/hooks/use-highlighter";
import type { Example, ViewFile } from "@/model";
import { ViewerProvider } from "./context";
import { RunPanel } from "./run-panel";
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

const Source = () => (
  <main className="flex min-h-0 flex-col">
    <div className="min-h-0 flex-1">
      <ErrorBoundary FallbackComponent={Crash}>
        <div className="grid h-full min-h-0 grid-rows-2 max-sm:divide-y sm:grid-cols-2 sm:grid-rows-1 sm:divide-x">
          <SourcePane pane="code" />
          <SourcePane pane="module" />
        </div>
      </ErrorBoundary>
    </div>
    <ErrorBoundary FallbackComponent={Crash}>
      <RunPanel />
    </ErrorBoundary>
  </main>
);

export const Viewer = Object.assign(Root, { Toolbar, Source, Status });
