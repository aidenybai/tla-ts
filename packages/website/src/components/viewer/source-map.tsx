// The arrows measure the DOM while rendering, so the React Compiler must not cache them.
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
import { placeArcs } from "@/lib/arcs";
import type { Box } from "@/lib/positions";
import type { Pane } from "@/model";
import { useViewerStore } from "@/store/viewer";
import { Arc } from "./arc";
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

const isInside = (box: Box, bounds: DOMRect): boolean =>
  box.y + box.height > bounds.top &&
  box.y < bounds.bottom &&
  box.x + box.width > bounds.left &&
  box.x < bounds.right;

// Each token's box in the coordinates of the container, with multi-line regions reduced to the
// name they define. Tokens scrolled out of their pane have no end.
const getEnds = (container: HTMLElement, layouts: Layouts): Map<string, Box> => {
  const origin = container.getBoundingClientRect();
  return new Map(
    [...layouts.values()].flatMap((layout) => {
      const wrapper = layout.wrapper.getBoundingClientRect();
      const viewport = layout.wrapper.parentElement?.getBoundingClientRect() ?? wrapper;
      return layout.tokens.flatMap((token) => {
        const box = token.isMultiLine ? token.anchorBox : token.box;
        if (box === null) return [];
        const screen = { ...box, x: box.x + wrapper.left, y: box.y + wrapper.top };
        return isInside(screen, viewport)
          ? [
              [
                token.node.id,
                { ...screen, x: screen.x - origin.left, y: screen.y - origin.top },
              ] as const,
            ]
          : [];
      });
    }),
  );
};

// Renders again on every scroll and resize, so that the arrows follow the tokens.
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

const Arrows = ({ container, layouts }: { container: HTMLElement; layouts: Layouts }) => {
  const { view, colorByNodeId } = useViewer();
  const markerId = useId();
  const causalNodeIds = useViewerStore((state) => state.causalNodeIds);
  const isShowingAllArcs = useViewerStore((state) => state.isShowingAllArcs);
  const code = layouts.get("code")?.wrapper.getBoundingClientRect();
  const module = layouts.get("module")?.wrapper.getBoundingClientRect();
  const isStacked = code !== undefined && module !== undefined && module.left < code.right;
  const arcs = placeArcs(
    view,
    getEnds(container, layouts),
    colorByNodeId,
    (edge) =>
      isShowingAllArcs ||
      (causalNodeIds !== null && causalNodeIds.has(edge.from) && causalNodeIds.has(edge.to)),
  );
  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-hidden"
      width="100%"
      height="100%"
    >
      <defs>
        <ArrowMarker id={`${markerId}solid`} size={7} />
        <ArrowMarker id={`${markerId}hollow`} size={7} isHollow />
      </defs>
      {arcs.map((arc) => (
        <Arc
          key={`${arc.edge.from}-${arc.edge.to}`}
          markerId={markerId}
          isStacked={isStacked}
          {...arc}
        />
      ))}
    </svg>
  );
};

// Lays the TypeScript and its TLA+ side by side, or stacked on narrow screens, and draws an arrow
// from each TypeScript region to the TLA+ it compiles to.
export const SourceMap = ({ children }: { children: ReactNode }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [layouts, setLayouts] = useState<Layouts>(new Map());
  useLayoutTick(container);
  return (
    <SourceMapContext value={{ setLayouts }}>
      <div
        ref={setContainer}
        className="relative grid h-full min-h-0 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1 sm:divide-x max-sm:divide-y"
      >
        {children}
        {container && <Arrows container={container} layouts={layouts} />}
      </div>
    </SourceMapContext>
  );
};
