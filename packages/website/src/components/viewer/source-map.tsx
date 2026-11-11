// The arcs measure the DOM while rendering, so the React Compiler must not cache them.
"use no memo";

import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { PlacedToken } from "@/hooks/use-token-boxes";
import { routeArcs, type ArcRequest, type Span, type TextRow } from "@/lib/arcs";
import type { Pane } from "@/model";
import { useViewerStore } from "@/store/viewer";
import { ArrowMarker } from "./arrow-marker";
import { useViewer } from "./context";

interface PaneLayout {
  wrapper: HTMLElement;
  tokens: PlacedToken[];
}

type Layouts = Map<Pane, PaneLayout>;

interface SourceMapState {
  setLayouts: Dispatch<SetStateAction<Layouts>>;
}

const SourceMapContext = createContext<SourceMapState | null>(null);

export const useSourceMap = (): SourceMapState => {
  const state = useContext(SourceMapContext);
  if (!state) throw new Error("useSourceMap must be used inside <SourceMap>");
  return state;
};

// How far into the TypeScript pane's right padding the arcs may start, and how far into the TLA+
// pane they end, short of its line numbers.
const START_INSET = 24;
const END_INSET = 8;

// The middle of each node's first row, in the coordinates of the container.
const getRowMiddles = (layout: PaneLayout, origin: DOMRect): Map<string, number> => {
  const top = layout.wrapper.getBoundingClientRect().top - origin.top;
  return new Map(
    layout.tokens.flatMap((token) => {
      const row = token.rows[0];
      return row === undefined
        ? []
        : token.mark.nodes.map((node) => [node.id, top + row.y + row.height / 2] as const);
    }),
  );
};

// The visual rows of the TypeScript lines in view, and where each one's text ends.
const getTextRows = (wrapper: HTMLElement, origin: DOMRect, span: Span): TextRow[] => {
  const lines = wrapper
    .querySelector("diffs-container")
    ?.shadowRoot?.querySelectorAll("[data-line]");
  const range = document.createRange();
  return [...(lines ?? [])].flatMap((line) => {
    const box = line.getBoundingClientRect();
    if (box.bottom - origin.top < span.top || box.top - origin.top > span.bottom) return [];
    range.selectNodeContents(line);
    return [...range.getClientRects()]
      .filter((rect) => rect.width > 0)
      .map((rect) => ({
        top: rect.top - origin.top,
        bottom: rect.bottom - origin.top,
        right: rect.right - origin.left,
      }));
  });
};

const getSpan = (wrapper: HTMLElement, origin: DOMRect): Span => {
  const viewport = (wrapper.parentElement ?? wrapper).getBoundingClientRect();
  return { top: viewport.top - origin.top, bottom: viewport.bottom - origin.top };
};

// Renders again on every scroll and resize, so that the arcs follow the rows.
const useLayoutTick = (container: HTMLElement | null): void => {
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    if (!container) return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setTick((count) => count + 1));
    };
    container.addEventListener("scroll", schedule, { capture: true, passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", schedule, { capture: true });
      observer.disconnect();
    };
  }, [container]);
};

interface ArcsProps {
  container: HTMLElement;
  code: PaneLayout;
  module: PaneLayout;
}

const Arcs = ({ container, code, module }: ArcsProps) => {
  const { view, colorByNodeId } = useViewer();
  const markerId = useId();
  const index = useViewerStore((state) => state.index);
  const causalNodeIds = useViewerStore((state) => state.causalNodeIds);
  const origin = container.getBoundingClientRect();
  if (causalNodeIds === null) return null;
  const codeViewport = (code.wrapper.parentElement ?? code.wrapper).getBoundingClientRect();
  const moduleViewport = (module.wrapper.parentElement ?? module.wrapper).getBoundingClientRect();
  const source = getSpan(code.wrapper, origin);
  const sources = getRowMiddles(code, origin);
  const targets = getRowMiddles(module, origin);
  const requests = view.edges.flatMap((edge): ArcRequest[] => {
    const from = sources.get(edge.from);
    const to = targets.get(edge.to);
    const color = colorByNodeId.get(edge.from);
    if (!causalNodeIds.has(edge.from) || !causalNodeIds.has(edge.to)) return [];
    if (from === undefined || to === undefined || color === undefined) return [];
    const isWrite = index.nodes.get(edge.from)?.kind === "write";
    return [{ id: `${edge.from}-${edge.to}`, color, isWrite, from, to }];
  });
  const routes = routeArcs(requests, {
    limit: codeViewport.right - origin.left - START_INSET,
    end: moduleViewport.left - origin.left + END_INSET,
    source,
    target: getSpan(module.wrapper, origin),
    rows: getTextRows(code.wrapper, origin, source),
  });
  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-hidden max-sm:hidden"
      width="100%"
      height="100%"
    >
      <defs>
        <ArrowMarker id={`${markerId}solid`} size={7} />
        <ArrowMarker id={`${markerId}hollow`} size={7} isHollow />
      </defs>
      {routes.leads.map((lead) => (
        <g
          key={lead.y}
          className="text-muted-foreground"
          stroke={lead.color ?? "currentColor"}
          fill={lead.color ?? "currentColor"}
        >
          <circle cx={lead.x} cy={lead.y} r={2} stroke="none" />
          <path d={lead.path} fill="none" strokeWidth={1.5} />
        </g>
      ))}
      {routes.arcs.map((arc) => (
        <path
          key={arc.id}
          d={arc.path}
          fill="none"
          stroke={arc.color}
          strokeWidth={1.5}
          strokeDasharray={arc.isWrite ? "4 3" : undefined}
          markerEnd={`url(#${markerId}${arc.isWrite ? "hollow" : "solid"})`}
        />
      ))}
    </svg>
  );
};

// Lays the TypeScript and its TLA+ side by side, or stacked on narrow screens. While a region is
// focused, arcs cross the gutter from its TypeScript to its TLA+. Stacked panes have no gutter, so
// they show no arcs.
export const SourceMap = ({ children }: { children: ReactNode }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [layouts, setLayouts] = useState<Layouts>(new Map());
  const code = layouts.get("code");
  const module = layouts.get("module");
  useLayoutTick(container);
  return (
    <SourceMapContext value={{ setLayouts }}>
      <div
        ref={setContainer}
        className="relative grid h-full min-h-0 grid-rows-2 max-sm:divide-y sm:grid-cols-2 sm:grid-rows-1 sm:divide-x"
      >
        {children}
        {container && code && module && <Arcs container={container} code={code} module={module} />}
      </div>
    </SourceMapContext>
  );
};
