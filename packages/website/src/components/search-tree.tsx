import { useMemo } from "react";
import { cn } from "cn";
import type { SearchState } from "@/lib/search";

const WIDTH_PX = 280;
const MARGIN_PX = 10;
const ROW_PX = 34;
// The tallest the tree is drawn, which a deep search's rows close up to fit.
const MAX_HEIGHT_PX = 150;
const MAX_RADIUS_PX = 4.5;
// A state diagram is drawn taller and with larger states, to be read from across a room.
const FORMAL_MAX_HEIGHT_PX = 270;
const FORMAL_MAX_RADIUS_PX = 6;

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
  // Draws the tree as a state diagram: states named in the order they were reached, and arrows
  // between them named by the call that made the step.
  isFormal?: boolean;
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
  const row = Math.min(
    ROW_PX,
    (props.isFormal ? FORMAL_MAX_HEIGHT_PX : MAX_HEIGHT_PX) / Math.max(1, depth),
  );
  const getY = (node: TreeNode) => MARGIN_PX + node.depth * row;
  const radius = Math.min(
    props.isFormal ? FORMAL_MAX_RADIUS_PX : MAX_RADIUS_PX,
    column * 0.36,
    row * 0.3,
  );
  const isTried = (node: TreeNode) => (order.get(node.state.id) ?? 0) < props.triedCount;
  const isDone = props.triedCount >= props.states.length;
  return (
    <svg
      role="img"
      aria-label={`A tree of the ${props.states.length} states TLA-ts tried`}
      viewBox={`0 0 ${WIDTH_PX} ${MARGIN_PX * 2 + depth * row}`}
      onPointerLeave={() => props.onHover(undefined)}
      className="w-full max-w-[280px] overflow-visible"
    >
      {props.isFormal && (
        <defs>
          <marker
            id="search-tree-arrow"
            viewBox="0 0 6 6"
            refX={5.4}
            refY={3}
            markerWidth={5}
            markerHeight={5}
            orient="auto"
          >
            <path d="M0 0.6 6 3 0 5.4z" fill="context-stroke" />
          </marker>
        </defs>
      )}
      {tree.nodes.flatMap((node) => {
        const parent = nodesById.get(node.state.parentId ?? "");
        if (!parent || !isTried(node)) return [];
        const isFailing = isDone && failingIds.has(node.state.id);
        if (!props.isFormal)
          return [
            <line
              key={node.state.id}
              x1={getX(parent)}
              y1={getY(parent)}
              x2={getX(node)}
              y2={getY(node)}
              strokeWidth={Math.min(1.5, radius * 0.4)}
              strokeLinecap="round"
              className={cn(
                "motion-safe:animate-chip-in",
                isFailing ? "stroke-destructive" : "stroke-input",
              )}
            />,
          ];
        const across = getX(node) - getX(parent);
        const down = getY(node) - getY(parent);
        const reach = (radius + 1) / Math.hypot(across, down);
        return [
          <g key={node.state.id} className="motion-safe:animate-chip-in">
            <line
              x1={getX(parent) + across * reach}
              y1={getY(parent) + down * reach}
              x2={getX(node) - across * reach}
              y2={getY(node) - down * reach}
              strokeWidth={0.9}
              markerEnd="url(#search-tree-arrow)"
              className={isFailing ? "stroke-destructive" : "stroke-muted-foreground"}
            />
            <text
              x={getX(parent) + across / 2 + 2.4}
              y={getY(parent) + down / 2 - 1}
              fontSize={5.4}
              className={cn(
                "font-serif italic",
                isFailing ? "fill-destructive" : "fill-muted-foreground",
              )}
            >
              {node.state.call?.replace(/^[^(]*\(|\)$/g, "").replaceAll('"', "")}
            </text>
          </g>,
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
                <circle cx={getX(node)} cy={getY(node)} r={radius + 3} fill="transparent" />
                {node.state.id === props.activeId && (
                  <circle
                    cx={getX(node)}
                    cy={getY(node)}
                    r={radius + 3}
                    className={node.state.isFailing ? "fill-destructive/25" : "fill-foreground/15"}
                  />
                )}
                {props.isFormal ? (
                  <>
                    {node.state.isFailing && (
                      <circle
                        cx={getX(node)}
                        cy={getY(node)}
                        r={radius + 2.2}
                        strokeWidth={0.9}
                        className="fill-none stroke-destructive"
                      />
                    )}
                    {node.depth === 0 && (
                      <line
                        x1={getX(node)}
                        y1={getY(node) - radius - 9}
                        x2={getX(node)}
                        y2={getY(node) - radius - 0.6}
                        strokeWidth={0.9}
                        markerEnd="url(#search-tree-arrow)"
                        className="stroke-muted-foreground"
                      />
                    )}
                    <circle
                      cx={getX(node)}
                      cy={getY(node)}
                      r={radius}
                      strokeWidth={1}
                      className={
                        node.state.isFailing
                          ? "fill-destructive stroke-destructive"
                          : "fill-card stroke-foreground"
                      }
                    />
                    <text
                      x={getX(node) - radius - (node.state.isFailing ? 4 : 1.6)}
                      y={getY(node) + 2.2}
                      fontSize={7.4}
                      textAnchor="end"
                      className={cn(
                        "font-serif italic",
                        node.state.isFailing ? "fill-destructive" : "fill-foreground",
                      )}
                    >
                      s
                      <tspan dy={2.2} fontSize={5}>
                        {order.get(node.state.id)}
                      </tspan>
                    </text>
                  </>
                ) : (
                  <circle
                    cx={getX(node)}
                    cy={getY(node)}
                    r={radius}
                    className={node.state.isFailing ? "fill-destructive" : "fill-success"}
                  />
                )}
              </g>,
            ]
          : [],
      )}
    </svg>
  );
};
