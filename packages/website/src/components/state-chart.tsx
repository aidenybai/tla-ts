import { X } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { cn } from "cn";
import { getPath, type Search, type SearchState } from "../search";
import { StateValues } from "./search-cell";

const CHARACTER_WIDTH = 7.25;
const WIDEST_NODE = 320;
const NODE_HEIGHT = 24;
const NODE_GAP = 20;
const ROW_HEIGHT = 72;
const PADDING = 24;

interface ChartNode {
  state: SearchState;
  x: number;
  y: number;
  width: number;
}

interface StateChartProps {
  search: Search;
}

const getNodeWidth = (state: SearchState) =>
  Math.min(WIDEST_NODE, state.change.length * CHARACTER_WIDTH + (state.isFailing ? 30 : 14));

// Lays the search out as a tree, each state centered over the states first reached from it.
const getNodes = (states: SearchState[]) => {
  const getChildren = (state: SearchState | undefined) =>
    states.filter((child) => child.parentId === state?.id);
  const getSpan = (state: SearchState): number =>
    Math.max(
      getNodeWidth(state),
      getChildren(state).reduce((span, child) => span + getSpan(child) + NODE_GAP, -NODE_GAP),
    );
  const place = (siblings: SearchState[], left: number, depth: number): ChartNode[] => {
    let nextLeft = left;
    return siblings.flatMap((state) => {
      const span = getSpan(state);
      const children = getChildren(state);
      const childrenSpan = children.reduce(
        (total, child) => total + getSpan(child) + NODE_GAP,
        -NODE_GAP,
      );
      const start = nextLeft;
      nextLeft += span + NODE_GAP;
      return [
        {
          state,
          x: start + span / 2,
          y: PADDING + depth * ROW_HEIGHT,
          width: getNodeWidth(state),
        },
        ...place(children, start + (span - childrenSpan) / 2, depth + 1),
      ];
    });
  };
  return place(getChildren(undefined), PADDING, 0);
};

export const StateChart = (props: StateChartProps) => {
  const markerId = useId();
  const [hoveredStateId, setHoveredStateId] = useState<string>();
  const chart = props.search.chart;
  const nodes = getNodes(chart.states);
  const failing = chart.states.find((state) => state.isFailing);
  const path = getPath(chart.states, hoveredStateId ?? failing?.id);
  const getNode = (stateId: string | undefined) => nodes.find((node) => node.state.id === stateId);
  const width = Math.max(...nodes.map((node) => node.x + node.width / 2)) + PADDING;
  const height = Math.max(...nodes.map((node) => node.y)) + NODE_HEIGHT + PADDING;
  const hiddenCount = props.search.stateCount - chart.states.length;
  return (
    <div className="flex w-max min-w-full flex-col items-center font-mono text-xs">
      <div className="relative" style={{ width, height }}>
        <svg
          aria-hidden
          width={width}
          height={height}
          className="absolute inset-0 overflow-visible"
        >
          <marker
            id={markerId}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M1 1 7 4 1 7Z" fill="context-stroke" />
          </marker>
          {chart.edges.map((edge) => {
            const from = getNode(edge.fromId);
            const to = getNode(edge.toId);
            if (!from || !to) return null;
            const isStep = to.state.parentId === edge.fromId;
            // Steps back to a state already reached only show for the hovered state.
            if (!isStep && hoveredStateId !== edge.fromId && hoveredStateId !== edge.toId)
              return null;
            const isOnPath = isStep && path.includes(to.state);
            const bend = isStep ? 0 : 28 + Math.abs(from.y - to.y) / 6;
            const side = from.x <= to.x ? 1 : -1;
            const start = isStep
              ? { x: from.x, y: from.y + NODE_HEIGHT }
              : { x: from.x + (side * from.width) / 2, y: from.y + NODE_HEIGHT / 2 };
            const end = isStep
              ? { x: to.x, y: to.y }
              : { x: to.x - (side * to.width) / 2, y: to.y + NODE_HEIGHT / 2 };
            const middle = (start.y + end.y) / 2;
            return (
              <g
                key={`${edge.fromId} ${edge.toId}`}
                className={cn(
                  "transition-opacity duration-150 ease",
                  isOnPath
                    ? failing && path.includes(failing) && !hoveredStateId
                      ? "text-destructive"
                      : "text-foreground"
                    : isStep
                      ? "text-input"
                      : "text-faint",
                  hoveredStateId && isStep && !isOnPath && "opacity-40",
                )}
              >
                <path
                  d={
                    isStep
                      ? `M ${start.x} ${start.y} C ${start.x} ${middle}, ${end.x} ${middle}, ${end.x} ${end.y}`
                      : `M ${start.x} ${start.y} C ${start.x + side * bend} ${start.y - bend}, ${end.x - side * bend} ${end.y - bend}, ${end.x} ${end.y}`
                  }
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isOnPath ? 1.5 : 1}
                  strokeDasharray={isStep ? undefined : "3 3"}
                  markerEnd={`url(#${markerId})`}
                />
                {isStep && (
                  <text
                    x={end.x}
                    y={end.y - 12}
                    textAnchor="middle"
                    className={cn(
                      "fill-current stroke-background stroke-[4px] [paint-order:stroke] text-[11px]",
                      !isOnPath && "text-faint",
                    )}
                  >
                    {edge.call.replace(/\(.*$/, "")}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {nodes.map((node) => (
          <span
            key={node.state.id}
            title={node.state.text}
            data-state={node.state.isFailing ? "failing" : "reached"}
            onPointerEnter={() => setHoveredStateId(node.state.id)}
            onPointerLeave={() => setHoveredStateId(undefined)}
            style={{
              left: node.x - node.width / 2,
              top: node.y,
              width: node.width,
              height: NODE_HEIGHT,
              transitionDelay: `${chart.states.indexOf(node.state) * 30}ms`,
            }}
            className={cn(
              "absolute flex items-center justify-center gap-1 rounded-sm px-1.5 transition-[opacity,scale] duration-200 ease-out starting:scale-95 starting:opacity-0",
              node.state.isFailing
                ? "bg-destructive/15 text-destructive"
                : "bg-background text-foreground ring-1 ring-border",
              path.includes(node.state) && !node.state.isFailing && "ring-ring",
              hoveredStateId && !path.includes(node.state) && "opacity-40",
            )}
          >
            {node.state.isFailing && <X weight="bold" className="shrink-0" />}
            <span className="truncate">
              <StateValues state={node.state} />
            </span>
          </span>
        ))}
      </div>
      {hiddenCount > 0 && (
        <span className="pb-4 text-faint">
          Showing {chart.states.length} of {props.search.stateCount} states
        </span>
      )}
    </div>
  );
};
