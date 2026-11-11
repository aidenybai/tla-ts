// The ribbons measure the DOM while rendering, so the React Compiler must not cache them.
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
import { getLinks } from "@/lib/graph";
import { clampSpan, getRibbonPaths, type Span } from "@/lib/ribbons";
import type { Pane } from "@/model";
import { useViewerStore } from "@/store/viewer";
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

// The lines of each node in a pane, in the coordinates of the gutter.
const getNodeSpans = (layout: PaneLayout, origin: number): Map<string, Span> => {
  const top = layout.wrapper.getBoundingClientRect().top - origin;
  return new Map(
    layout.tokens.flatMap((token) =>
      token.mark.nodes.map(
        (node) =>
          [
            node.id,
            { top: top + token.lines.y, bottom: top + token.lines.y + token.lines.height },
          ] as const,
      ),
    ),
  );
};

const getUnion = (nodeIds: string[], spans: Map<string, Span>): Span | null => {
  const found = nodeIds.flatMap((nodeId) => spans.get(nodeId) ?? []);
  return found.length === 0
    ? null
    : {
        top: Math.min(...found.map((span) => span.top)),
        bottom: Math.max(...found.map((span) => span.bottom)),
      };
};

const getView = (layout: PaneLayout, origin: number): Span => {
  const viewport = (layout.wrapper.parentElement ?? layout.wrapper).getBoundingClientRect();
  return { top: viewport.top - origin, bottom: viewport.bottom - origin };
};

// Renders again on every scroll and resize, so that the ribbons follow the lines.
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

interface RibbonsProps {
  gutter: HTMLElement;
  code: PaneLayout;
  module: PaneLayout;
}

// One ribbon for each run of lines that the focused region links to, larger ones first so that
// smaller ones stay visible on top.
const Ribbons = ({ gutter, code, module }: RibbonsProps) => {
  const { colorByNodeId } = useViewer();
  const gradientId = useId();
  const index = useViewerStore((state) => state.index);
  const focusedNodeId = useViewerStore((state) => state.hoveredNodeId ?? state.selectedNodeId);
  if (focusedNodeId === null) return null;
  const bounds = gutter.getBoundingClientRect();
  const sources = getNodeSpans(code, bounds.top);
  const targets = getNodeSpans(module, bounds.top);
  const codeView = getView(code, bounds.top);
  const moduleView = getView(module, bounds.top);
  const ribbons = getLinks(index, focusedNodeId)
    .links.flatMap((link) => {
      const from = getUnion(link.from, sources);
      const to = getUnion(link.to, targets);
      const color = colorByNodeId.get(link.from[0] ?? "");
      if (!from || !to || color === undefined) return [];
      const isWrite = link.from.some((nodeId) => index.nodes.get(nodeId)?.kind === "write");
      return [{ id: `${link.from[0]}-${link.to[0]}`, from, to, color, isWrite }];
    })
    .map((ribbon) => ({
      ...ribbon,
      size: ribbon.from.bottom - ribbon.from.top + ribbon.to.bottom - ribbon.to.top,
      from: clampSpan(ribbon.from, codeView),
      to: clampSpan(ribbon.to, moduleView),
    }))
    .filter((ribbon) => !(ribbon.from.isPinned && ribbon.to.isPinned))
    .toSorted((left, right) => right.size - left.size);
  return (
    <svg className="absolute inset-0 overflow-hidden" width="100%" height="100%">
      {ribbons.map((ribbon, ribbonIndex) => {
        const paths = getRibbonPaths(ribbon.from, ribbon.to, bounds.width);
        const fillId = `${gradientId}${ribbonIndex}`;
        return (
          <g key={ribbon.id}>
            {/* A ribbon whose end is scrolled out of view fades toward that end. */}
            <linearGradient id={fillId}>
              <stop
                offset="0"
                stopColor={ribbon.color}
                stopOpacity={ribbon.from.isPinned ? 0 : 1}
              />
              <stop offset="1" stopColor={ribbon.color} stopOpacity={ribbon.to.isPinned ? 0 : 1} />
            </linearGradient>
            <path
              d={paths.fill}
              fill={`url(#${fillId})`}
              className="[fill-opacity:0.16] dark:[fill-opacity:0.18]"
            />
            {[paths.top, paths.bottom].map((path) => (
              <path
                key={path}
                d={path}
                fill="none"
                stroke={`url(#${fillId})`}
                strokeOpacity={0.5}
                strokeWidth={1}
                strokeDasharray={ribbon.isWrite ? "3 2" : undefined}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

interface SourceMapProps {
  code: ReactNode;
  module: ReactNode;
}

// Lays the TypeScript and its TLA+ side by side, with a gutter between them where ribbons join
// the focused region's lines to the lines they become. Stacked panes on narrow screens have no
// gutter, so they show no ribbons.
export const SourceMap = ({ code, module }: SourceMapProps) => {
  const [gutter, setGutter] = useState<HTMLDivElement | null>(null);
  const [layouts, setLayouts] = useState<Layouts>(new Map());
  const codeLayout = layouts.get("code");
  const moduleLayout = layouts.get("module");
  useLayoutTick(gutter?.parentElement ?? null);
  return (
    <SourceMapContext value={{ setLayouts }}>
      <div className="grid h-full min-h-0 grid-rows-2 max-sm:divide-y sm:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] sm:grid-rows-1">
        {code}
        <div ref={setGutter} className="relative border-x max-sm:hidden">
          {gutter && codeLayout && moduleLayout && (
            <Ribbons gutter={gutter} code={codeLayout} module={moduleLayout} />
          )}
        </div>
        {module}
      </div>
    </SourceMapContext>
  );
};
