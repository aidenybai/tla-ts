import { useMemo } from "react";
import { cn } from "cn";
import type { Search, SearchState } from "@/lib/search";

const WIDTH_PX = 596;
const MARGIN_PX = 12;
const MAX_COLUMN_PX = 150;
const ROW_PX = 40;
const MAX_RADIUS_PX = 5;
// Columns this wide have room for each state's text beside it.
const LABEL_COLUMN_PX = 130;
const LABEL_WIDTH_PX = 160;
const STEP_DELAY_MS = 120;

interface TreeNode {
  state: SearchState;
  depth: number;
  x: number;
}

// Each state hangs under the state whose step first reached it, over the middle of its own next
// states. The states with no next state take one column each, left to right.
const getTree = (states: SearchState[]) => {
  const ids = new Set(states.map((state) => state.id));
  const childrenById = Map.groupBy(
    states.filter((state) => state.parentId !== undefined && ids.has(state.parentId)),
    (state) => state.parentId,
  );
  const roots = states.filter((state) => state.parentId === undefined || !ids.has(state.parentId));
  const nodes: TreeNode[] = [];
  let leafCount = 0;
  const place = (state: SearchState, depth: number): number => {
    const children = childrenById.get(state.id) ?? [];
    const node = { state, depth, x: 0 };
    nodes.push(node);
    if (children.length === 0) {
      node.x = leafCount;
      leafCount += 1;
      return node.x;
    }
    const columns = children.map((child) => place(child, depth + 1));
    node.x = (columns[0] + columns[columns.length - 1]) / 2;
    return node.x;
  };
  for (const root of roots) place(root, 0);
  return { nodes, leafCount };
};

interface StateTreeProps {
  search: Search;
  path: SearchState[];
  onHover: (stateId: string | undefined) => void;
}

export const StateTree = (props: StateTreeProps) => {
  const tree = useMemo(() => getTree(props.search.checkedStates), [props.search]);
  const failingIds = useMemo(() => {
    const statesById = new Map(props.search.checkedStates.map((state) => [state.id, state]));
    const ids = new Set<string>();
    for (
      let state = props.search.checkedStates.find((found) => found.isFailing);
      state !== undefined;
      state = statesById.get(state.parentId ?? "")
    )
      ids.add(state.id);
    return ids;
  }, [props.search]);
  const column = Math.min(
    MAX_COLUMN_PX,
    (WIDTH_PX - MARGIN_PX * 2) / Math.max(1, tree.leafCount - 1),
  );
  const isLabelled = tree.leafCount === 1 || column >= LABEL_COLUMN_PX;
  const radius = Math.max(1.5, Math.min(MAX_RADIUS_PX, column * 0.3));
  const depth = Math.max(0, ...tree.nodes.map((node) => node.depth));
  const width = MARGIN_PX * 2 + (tree.leafCount - 1) * column + (isLabelled ? LABEL_WIDTH_PX : 0);
  const nodesById = new Map(tree.nodes.map((node) => [node.state.id, node]));
  const hoveredIds = new Set(props.path.map((state) => state.id));
  const getX = (node: TreeNode) => MARGIN_PX + node.x * column;
  const getY = (node: TreeNode) => MARGIN_PX + node.depth * ROW_PX;
  return (
    <svg
      role="img"
      aria-label={`A tree of the ${tree.nodes.length.toLocaleString("en-US")} states checked${failingIds.size > 0 ? ", one of which breaks a rule" : ""}`}
      viewBox={`0 0 ${width} ${MARGIN_PX * 2 + depth * ROW_PX}`}
      style={{ maxWidth: width }}
      onPointerLeave={() => props.onHover(undefined)}
      className="w-full overflow-visible"
    >
      {tree.nodes.flatMap((node) => {
        const parent = nodesById.get(node.state.parentId ?? "");
        if (!parent) return [];
        return [
          <line
            key={node.state.id}
            x1={getX(parent)}
            y1={getY(parent)}
            x2={getX(node)}
            y2={getY(node)}
            strokeWidth={Math.min(1.5, radius * 0.5)}
            strokeLinecap="round"
            style={{ animationDelay: `${node.depth * STEP_DELAY_MS}ms` }}
            className={cn(
              "motion-safe:animate-chip-in",
              failingIds.has(node.state.id)
                ? "stroke-destructive"
                : hoveredIds.has(node.state.id)
                  ? "stroke-foreground"
                  : "stroke-input",
            )}
          />,
        ];
      })}
      {tree.nodes.map((node) => (
        <g
          key={node.state.id}
          onPointerEnter={() => props.onHover(node.state.id)}
          style={{ animationDelay: `${node.depth * STEP_DELAY_MS}ms` }}
          className="motion-safe:animate-chip-in"
        >
          <title>
            {[node.state.call, node.state.text].filter((part) => part !== undefined).join(": ")}
          </title>
          <circle cx={getX(node)} cy={getY(node)} r={Math.max(radius + 3, 8)} fill="transparent" />
          {node.state.isFailing && (
            <circle
              cx={getX(node)}
              cy={getY(node)}
              r={radius + 3}
              className="fill-destructive/20"
            />
          )}
          <circle
            cx={getX(node)}
            cy={getY(node)}
            r={radius}
            className={node.state.isFailing ? "fill-destructive" : "fill-success"}
          />
          {isLabelled && (
            <text
              x={getX(node) + radius + 7}
              y={getY(node)}
              dominantBaseline="central"
              className={cn(
                "font-mono text-[11px]",
                node.state.isFailing ? "fill-destructive" : "fill-foreground",
              )}
            >
              {node.state.call !== undefined && (
                <tspan className="fill-faint">{node.state.call} </tspan>
              )}
              {node.state.change}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};
