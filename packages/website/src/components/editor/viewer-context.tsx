import { createContext, use, useMemo, useState, type ReactNode } from "react";
import { getOutline, type Outline } from "@/lib/outline";
import { getColors, getNameLinks, type Link } from "@/lib/regions";
import { getTokens } from "@/lib/syntax";
import type { Region, Span } from "../../../../tla-ts/src/typescript/emit";
import type { TypeScriptExample } from "@/typescript-examples";
import { type Compilation, useCompile } from "@/use-compile";
import { type Theme, useTheme } from "@/use-theme";

export type View = "tla" | "config" | "outline";

export type Pane = "source" | "output" | "outline";

interface Selection {
  name: string;
  // The pane the selection came from, which doesn't scroll to it.
  origin: Pane;
}

interface ViewerState {
  examples: TypeScriptExample[];
  example: TypeScriptExample;
  setExample: (example: TypeScriptExample) => void;
  source: string;
  setSource: (source: string) => void;
  compilation: Compilation | undefined;
  error: string | undefined;
  isCompiling: boolean;
  // The TypeScript has links only while it is the text that compiled.
  sourceLinks: Link[];
  outputLinks: Link[];
  configLinks: Link[];
  colors: ReadonlyMap<string, string>;
  outline: Outline | undefined;
  view: View;
  setView: (view: View) => void;
  isWrapped: boolean;
  setWrapped: (isWrapped: boolean) => void;
  theme: Theme;
  toggleTheme: () => void;
}

interface HighlightState {
  hovered: string | undefined;
  setHovered: (name: string | undefined) => void;
  selection: Selection | undefined;
  select: (selection: Selection | undefined) => void;
}

const ViewerContext = createContext<ViewerState | undefined>(undefined);

const HighlightContext = createContext<HighlightState | undefined>(undefined);

const getExampleFromUrl = (examples: TypeScriptExample[], defaultFileName: string) => {
  const fileName = new URLSearchParams(location.search).get("example") ?? defaultFileName;
  return examples.find((example) => example.fileName === fileName) ?? examples[0];
};

const getLink = (region: Region, span: Span): Link => ({
  name: region.name,
  kind: region.kind,
  start: span.start,
  end: span.end,
});

const getLinks = (compilation: Compilation | undefined, source: string) => {
  if (compilation === undefined) return { sourceLinks: [], outputLinks: [], configLinks: [] };
  const spec = compilation.spec;
  const variables = spec.regions.filter((region) => region.kind === "variable");
  const declared = new Set(variables.map((region) => region.output.start));
  return {
    sourceLinks:
      compilation.input === source
        ? spec.regions.map((region) => getLink(region, region.source))
        : [],
    // A read or write region's output is the declaration, so the module's own uses come from its text.
    outputLinks: [
      ...spec.regions
        .filter((region) => region.kind !== "read" && region.kind !== "write")
        .map((region) => getLink(region, region.output)),
      ...getNameLinks(
        spec.source,
        getTokens(spec.source, "tla"),
        new Map(variables.map((region) => [region.name, "read" as const])),
      ).filter((link) => !declared.has(link.start)),
    ],
    configLinks: getNameLinks(
      spec.config,
      getTokens(spec.config, "tla"),
      new Map(spec.regions.map((region) => [region.name, region.kind])),
    ),
  };
};

const HighlightProvider = ({ children }: { children: ReactNode }) => {
  const [hovered, setHovered] = useState<string | undefined>(undefined);
  const [selection, select] = useState<Selection | undefined>(undefined);
  return (
    <HighlightContext value={{ hovered, setHovered, selection, select }}>
      {children}
    </HighlightContext>
  );
};

interface ViewerProviderProps {
  examples: TypeScriptExample[];
  defaultFileName: string;
  children: ReactNode;
}

export const ViewerProvider = ({ examples, defaultFileName, children }: ViewerProviderProps) => {
  const [example, setExampleState] = useState(() => getExampleFromUrl(examples, defaultFileName));
  const [source, setSource] = useState(example.source);
  const [view, setView] = useState<View>("tla");
  const [isWrapped, setWrapped] = useState(false);
  const theme = useTheme();
  const compiled = useCompile(source, example.fileName);
  const compilation = compiled.compilation;

  const derived = useMemo(
    () => ({
      ...getLinks(compilation, source),
      colors: getColors(
        (compilation?.spec.regions ?? [])
          .toSorted((left, right) => left.output.start - right.output.start)
          .map((region) => region.name),
      ),
      outline:
        compilation === undefined ? undefined : getOutline(compilation.spec, compilation.input),
    }),
    [compilation, source],
  );

  const setExample = (next: TypeScriptExample) => {
    const url = new URL(location.href);
    url.searchParams.set("example", next.fileName);
    history.replaceState(null, "", url);
    setExampleState(next);
    setSource(next.source);
  };

  return (
    <ViewerContext
      value={{
        examples,
        example,
        setExample,
        source,
        setSource,
        compilation,
        error: compiled.error,
        isCompiling: compiled.isCompiling,
        ...derived,
        view,
        setView,
        isWrapped,
        setWrapped,
        theme: theme.theme,
        toggleTheme: theme.toggleTheme,
      }}
    >
      <HighlightProvider key={example.fileName}>{children}</HighlightProvider>
    </ViewerContext>
  );
};

export const useViewer = () => {
  const state = use(ViewerContext);
  if (state === undefined) throw new Error("useViewer must be used inside <Viewer>");
  return state;
};

export const useHighlight = () => {
  const state = use(HighlightContext);
  if (state === undefined) throw new Error("useHighlight must be used inside <Viewer>");
  return state;
};

export const useActiveName = () => {
  const highlight = useHighlight();
  return highlight.hovered ?? highlight.selection?.name;
};
