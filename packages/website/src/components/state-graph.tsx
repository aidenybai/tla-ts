import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useMemo, useRef } from "react";
import { cn } from "cn";
import type { Search, SearchState } from "../search";

const ROW_HEIGHT_PX = 46;
const LINK_HEIGHT_PX = 24;
const BOX_MIDDLE_PX = 35;
const RAIL_PX = 4;
const ARROW_PX = 12;
const INDENT_PX = 20;
const MIN_INDENT_PX = 8;
const MIN_BOX_WIDTH_PX = 120;
const LOOP_WIDTH_PX = 16;
const ARROW_HEAD_CLASS_NAME =
  "size-0 border-x-[3.5px] border-t-[5px] border-x-transparent border-t-input";

interface GraphRow {
  state: SearchState;
  depth: number;
  link: "root" | "chain" | "branch";
  rails: number[];
  hasNextSibling: boolean;
}

// Each state hangs under the state whose step found it, so every state is connected. A state with
// one next state continues straight down, and one with several branches one level to the right.
const getRows = (search: Search, limit: number) => {
  const states = search.listedStates.slice(0, limit);
  const indexes = new Map(states.map((state, index) => [state.id, index]));
  const finders = new Map<string, string>();
  for (const edge of search.edges) {
    const fromIndex = indexes.get(edge.fromId);
    const toIndex = indexes.get(edge.toId);
    const finder = finders.get(edge.toId);
    if (fromIndex === undefined || toIndex === undefined || fromIndex >= toIndex) continue;
    if (finder === undefined || fromIndex < (indexes.get(finder) ?? 0)) {
      finders.set(edge.toId, edge.fromId);
    }
  }
  const childrenById = new Map<string, SearchState[]>();
  const roots = states.filter((state) => {
    const parentId = state.parentId ?? finders.get(state.id);
    if (parentId === undefined || !indexes.has(parentId)) return true;
    childrenById.set(parentId, [...(childrenById.get(parentId) ?? []), state]);
    return false;
  });
  const rows: GraphRow[] = [];
  const pending: GraphRow[] = roots
    .map((state): GraphRow => ({ state, depth: 0, link: "root", rails: [], hasNextSibling: false }))
    .toReversed();
  for (let row = pending.pop(); row !== undefined; row = pending.pop()) {
    rows.push(row);
    const children = childrenById.get(row.state.id) ?? [];
    const rails =
      row.link === "branch" && row.hasNextSibling ? [...row.rails, row.depth - 1] : row.rails;
    pending.push(
      ...children
        .map((state, index): GraphRow => ({
          state,
          depth: children.length === 1 ? row.depth : row.depth + 1,
          link: children.length === 1 ? "chain" : "branch",
          rails,
          hasNextSibling: index < children.length - 1,
        }))
        .toReversed(),
    );
  }
  return {
    rows,
    // The states form one chain whose last state leads back to the first.
    isLoop:
      roots.length === 1 &&
      rows.every((row) => row.link !== "branch") &&
      search.edges.some(
        (edge) => edge.fromId === rows.at(-1)?.state.id && edge.toId === roots[0].id,
      ),
  };
};

interface StateRowProps {
  row: GraphRow;
  start: number;
  indent: number;
  gutter: number;
  isDimmed: boolean;
  isButton: boolean;
}

// Memoized so hovering a state re-renders only the rows that dim or brighten.
const StateRow = memo((props: StateRowProps) => {
  const Box = props.isButton ? "button" : "span";
  return (
    <li
      style={{
        height: ROW_HEIGHT_PX,
        translate: `0 ${props.start - LINK_HEIGHT_PX}px`,
        paddingLeft: props.gutter + props.row.depth * props.indent,
      }}
      className="absolute inset-x-0 top-0 flex flex-col items-start"
    >
      {props.row.rails.map((depth) => (
        <span
          key={depth}
          aria-hidden
          style={{ left: props.gutter + depth * props.indent + RAIL_PX }}
          className="absolute inset-y-0 border-l border-input"
        />
      ))}
      {props.row.link === "branch" && (
        <span
          aria-hidden
          style={{
            left: props.gutter + (props.row.depth - 1) * props.indent + RAIL_PX,
            width: props.indent - RAIL_PX,
            height: BOX_MIDDLE_PX,
          }}
          className={cn(
            "absolute top-0 border-b border-l border-input",
            !props.row.hasNextSibling && "rounded-bl-md",
          )}
        />
      )}
      {props.row.link === "branch" && props.row.hasNextSibling && (
        <span
          aria-hidden
          style={{
            left: props.gutter + (props.row.depth - 1) * props.indent + RAIL_PX,
            top: BOX_MIDDLE_PX,
          }}
          className="absolute bottom-0 border-l border-input"
        />
      )}
      <span style={{ height: LINK_HEIGHT_PX }} className="flex shrink-0 items-stretch gap-2.5">
        {props.row.link === "chain" && (
          <span aria-hidden style={{ marginLeft: ARROW_PX }} className="flex flex-col items-center">
            <span className="w-px flex-1 bg-input" />
            <span className={ARROW_HEAD_CLASS_NAME} />
          </span>
        )}
        {props.row.link !== "root" && (
          <span className="self-center whitespace-nowrap">{props.row.state.call}</span>
        )}
      </span>
      <Box
        type={props.isButton ? "button" : undefined}
        data-state-id={props.row.state.id}
        title={props.row.state.text}
        className={cn(
          "relative max-w-full truncate rounded-md border px-2 py-0.5 font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring",
          props.isButton && "cursor-pointer",
          props.row.state.isFailing
            ? "border-transparent bg-destructive/15 text-destructive"
            : "bg-card text-foreground",
          props.isDimmed && "opacity-50",
        )}
      >
        {props.row.state.change}
      </Box>
    </li>
  );
});

interface StateGraphProps {
  search: Search;
  limit?: number;
  path: SearchState[];
  onHover: (stateId: string | undefined) => void;
  onSelect?: (state: SearchState) => void;
  className?: string;
}

export const StateGraph = (props: StateGraphProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const graph = useMemo(
    () => getRows(props.search, props.limit ?? Infinity),
    [props.search, props.limit],
  );
  const virtualizer = useVirtualizer({
    count: graph.rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    getItemKey: (index) => graph.rows[index].state.id,
    overscan: 8,
  });
  const items = virtualizer.getVirtualItems();
  const gutter = graph.isLoop ? LOOP_WIDTH_PX : 0;
  const maxDepth = Math.max(0, ...items.map((item) => graph.rows[item.index].depth));
  // As in React DevTools, the indent shrinks so the deepest row on screen still has room.
  const indent =
    maxDepth === 0
      ? INDENT_PX
      : Math.min(
          INDENT_PX,
          Math.max(
            MIN_INDENT_PX,
            ((virtualizer.scrollRect?.width ?? 0) - gutter - MIN_BOX_WIDTH_PX) / maxDepth,
          ),
        );
  const pathIds = new Set(props.path.map((state) => state.id));
  const hiddenCount = props.search.listedStates.length - graph.rows.length;
  const getStateId = (target: EventTarget) =>
    target instanceof Element
      ? target.closest<HTMLElement>("[data-state-id]")?.dataset.stateId
      : undefined;
  return (
    <div
      ref={scrollRef}
      className={cn("overflow-auto overscroll-none text-xs text-faint", props.className)}
    >
      {/* One listener each on the list keeps the rows free of handlers, and so memoized. The
          hover clears only on leaving the list, so crossing between two states dims nothing. */}
      <ol
        onPointerOver={(event) => {
          const stateId = getStateId(event.target);
          if (stateId !== undefined) props.onHover(stateId);
        }}
        onPointerLeave={() => props.onHover(undefined)}
        onFocus={(event) => props.onHover(getStateId(event.target))}
        onBlur={() => props.onHover(undefined)}
        onClick={(event) => {
          const stateId = getStateId(event.target);
          const row = graph.rows.find((found) => found.state.id === stateId);
          if (row) props.onSelect?.(row.state);
        }}
        style={{
          height: virtualizer.getTotalSize() - LINK_HEIGHT_PX,
          minWidth: gutter + maxDepth * indent + MIN_BOX_WIDTH_PX,
        }}
        className="relative"
      >
        {graph.isLoop && (
          <li
            aria-hidden
            style={{ width: LOOP_WIDTH_PX }}
            className="absolute top-3 bottom-3 left-0 flex items-start rounded-l-md border-y border-l border-input"
          >
            <span className={cn(ARROW_HEAD_CLASS_NAME, "-mt-[4px] ml-auto -rotate-90")} />
          </li>
        )}
        {items.map((item) => (
          <StateRow
            key={item.key}
            row={graph.rows[item.index]}
            start={item.start}
            indent={indent}
            gutter={gutter}
            isDimmed={pathIds.size > 0 && !pathIds.has(graph.rows[item.index].state.id)}
            isButton={props.onSelect !== undefined}
          />
        ))}
      </ol>
      {hiddenCount > 0 && <p className="mt-3">and {hiddenCount.toLocaleString()} more</p>}
    </div>
  );
};

const SKELETON_ROWS = [
  { box: "w-16", call: "w-0" },
  { box: "w-20", call: "w-14" },
  { box: "w-16", call: "w-20" },
  { box: "w-24", call: "w-14" },
];

// A chain of states with bars for its text, drawn with the sizes of the real rows.
export const StateGraphSkeleton = () => (
  <ol aria-hidden className="flex flex-col items-start">
    {SKELETON_ROWS.map((row, index) => (
      <li key={index} className="flex flex-col items-start">
        {index > 0 && (
          <span style={{ height: LINK_HEIGHT_PX }} className="flex items-stretch gap-2.5">
            <span style={{ marginLeft: ARROW_PX }} className="flex flex-col items-center">
              <span className="w-px flex-1 bg-input" />
              <span className={ARROW_HEAD_CLASS_NAME} />
            </span>
            <span className={cn("h-2 self-center rounded-sm bg-border", row.call)} />
          </span>
        )}
        <span className="flex h-[22px] items-center rounded-md border bg-card px-2">
          <span className={cn("h-2 rounded-sm bg-border", row.box)} />
        </span>
      </li>
    ))}
  </ol>
);
