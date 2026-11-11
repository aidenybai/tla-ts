import type { ReactNode } from "react";
import { Tabs } from "@/components/ui/tabs";
import type { TypeScriptExample } from "@/typescript-examples";
import { OutputPane } from "./output-pane";
import { SourcePane } from "./source-pane";
import { Toolbar } from "./toolbar";
import { type View, useHighlight, useViewer, ViewerProvider } from "./viewer-context";

const VIEWS = new Set<string>(["tla", "config", "outline"]);

const isView = (value: unknown): value is View => typeof value === "string" && VIEWS.has(value);

const Shell = ({ children }: { children: ReactNode }) => {
  const viewer = useViewer();
  return (
    <Tabs
      value={viewer.view}
      onValueChange={(value) => isView(value) && viewer.setView(value)}
      className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] bg-ground text-[13px]/[19px] text-ink"
    >
      {children}
    </Tabs>
  );
};

interface RootProps {
  examples: TypeScriptExample[];
  defaultFileName: string;
  children: ReactNode;
}

const Root = ({ examples, defaultFileName, children }: RootProps) => (
  <ViewerProvider examples={examples} defaultFileName={defaultFileName}>
    <Shell>{children}</Shell>
  </ViewerProvider>
);

const Panes = ({ children }: { children: ReactNode }) => (
  <main className="grid min-h-0 grid-rows-2 md:grid-cols-2 md:grid-rows-1">{children}</main>
);

const getLine = (text: string, offset: number) => text.slice(0, offset).split("\n").length;

const Hovered = () => {
  const compilation = useViewer().compilation;
  const hovered = useHighlight().hovered;
  const regions = compilation?.spec.regions.filter((region) => region.name === hovered) ?? [];
  const region =
    regions.find(
      (candidate) =>
        candidate.kind !== "read" && candidate.kind !== "write" && candidate.kind !== "next",
    ) ?? regions[0];
  if (compilation === undefined || region === undefined) return null;
  return (
    <span className="truncate">
      {region.kind} <span className="font-mono text-ink">{region.name}</span> · TypeScript line{" "}
      {getLine(compilation.input, region.source.start)} · TLA+ line{" "}
      {getLine(compilation.spec.source, region.output.start)}
    </span>
  );
};

const CompileStatus = () => {
  const viewer = useViewer();
  if (viewer.isCompiling) return <span className="shrink-0">Compiling…</span>;
  if (viewer.error !== undefined) return <span className="shrink-0 text-alarm">Compile error</span>;
  return (
    viewer.compilation !== undefined && (
      <span className="shrink-0">Compiled in {Math.round(viewer.compilation.elapsed)} ms</span>
    )
  );
};

const Status = () => {
  const viewer = useViewer();
  const outline = viewer.outline;
  return (
    <footer className="flex h-8 items-center gap-4 overflow-hidden border-t border-rule px-3 whitespace-nowrap text-muted tabular-nums">
      {outline !== undefined && (
        <span className="hidden shrink-0 sm:inline">
          {outline.variables.length} variables · {outline.actions.length} actions ·{" "}
          {outline.checks.length} checks
        </span>
      )}
      <span className="min-w-0 flex-1">
        <Hovered />
      </span>
      <CompileStatus />
    </footer>
  );
};

export const Viewer = Object.assign(Root, {
  Toolbar,
  Panes,
  Source: SourcePane,
  Output: OutputPane,
  Status,
});
