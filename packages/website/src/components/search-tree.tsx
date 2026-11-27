import { useMemo } from "react";
import { cn } from "cn";
import type { SearchState } from "@/lib/search";

const WIDTH_PX = 280;
const MARGIN_PX = 10;
const ROW_PX = 34;
const RADIUS_PX = 4.5;

interface TreeNode {
  state: SearchState;
  depth: number;
  x: number;
}

// Each state hangs under the state whose move first reached it, over the middle of its own next
// states. The states with no next state take one column each, left to right.
const getTree = (states: SearchState[]) => {
  const ids = new Set(states.map((state) => state.id));
  const childrenById = Map.groupBy(
    states.filter((state) => state.parentId !== undefined && ids.has(state.parentId)),
    (state) => state.parentId,
  );
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
  for (const root of states)
    if (root.parentId === undefined || !ids.has(root.parentId)) place(root, 0);
  return { nodes, leafCount };
};

interface SearchTreeProps {
  // The states in the order the search tried them.
  states: SearchState[];
  // How many of them the search has tried so far.
  triedCount: number;
  activeId: string | undefined;
  onHover: (stateId: string | undefined) => void;
}

export const SearchTree = (props: SearchTreeProps) => {
  const tree = useMemo(() => getTree(props.states), [props.states]);
  const order = new Map(props.states.map((state, index) => [state.id, index]));
  const nodesById = new Map(tree.nodes.map((node) => [node.state.id, node]));
  const failingIds = new Set<string>();
  for (
    let node = tree.nodes.find((found) => found.state.isFailing);
    node !== undefined;
    node = nodesById.get(node.state.parentId ?? "")
  )
    failingIds.add(node.state.id);
  const column = (WIDTH_PX - MARGIN_PX * 2) / Math.max(1, tree.leafCount - 1);
  const depth = Math.max(0, ...tree.nodes.map((node) => node.depth));
  const getX = (node: TreeNode) =>
    tree.leafCount === 1 ? WIDTH_PX / 2 : MARGIN_PX + node.x * column;
  const getY = (node: TreeNode) => MARGIN_PX + node.depth * ROW_PX;
  const isTried = (node: TreeNode) => (order.get(node.state.id) ?? 0) < props.triedCount;
  const isDone = props.triedCount >= props.states.length;
  return (
    <svg
      role="img"
      aria-label={`A tree of the ${props.states.length} states TLA-ts tried`}
      viewBox={`0 0 ${WIDTH_PX} ${MARGIN_PX * 2 + depth * ROW_PX}`}
      onPointerLeave={() => props.onHover(undefined)}
      className="w-full max-w-[280px] overflow-visible"
    >
      {tree.nodes.flatMap((node) => {
        const parent = nodesById.get(node.state.parentId ?? "");
        if (!parent || !isTried(node)) return [];
        return [
          <line
            key={node.state.id}
            x1={getX(parent)}
            y1={getY(parent)}
            x2={getX(node)}
            y2={getY(node)}
            strokeWidth={1.5}
            strokeLinecap="round"
            className={cn(
              "motion-safe:animate-chip-in",
              isDone && failingIds.has(node.state.id) ? "stroke-destructive" : "stroke-input",
            )}
          />,
        ];
      })}
      {tree.nodes.flatMap((node) =>
        isTried(node)
          ? [
              <g
                key={node.state.id}
                onPointerEnter={() => props.onHover(node.state.id)}
                className="origin-center [transform-box:fill-box] motion-safe:animate-chip-in"
              >
                <title>
                  {[node.state.call, node.state.text]
                    .filter((part) => part !== undefined)
                    .join(": ")}
                </title>
                <circle cx={getX(node)} cy={getY(node)} r={RADIUS_PX + 5} fill="transparent" />
                {node.state.id === props.activeId && (
                  <circle
                    cx={getX(node)}
                    cy={getY(node)}
                    r={RADIUS_PX + 3}
                    className={node.state.isFailing ? "fill-destructive/25" : "fill-foreground/15"}
                  />
                )}
                <circle
                  cx={getX(node)}
                  cy={getY(node)}
                  r={RADIUS_PX}
                  className={node.state.isFailing ? "fill-destructive" : "fill-success"}
                />
              </g>,
            ]
          : [],
      )}
    </svg>
  );
};
