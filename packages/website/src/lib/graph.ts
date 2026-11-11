import type { GraphNode, ViewFile } from "@/model";

export interface GraphIndex {
  nodes: Map<string, GraphNode>;
  forward: Map<string, string[]>;
  backward: Map<string, string[]>;
  // The reads and writes inside each declaration, in the same pane.
  uses: Map<string, string[]>;
}

const isUse = (node: GraphNode) => node.kind === "read" || node.kind === "write";

const isInside = (outer: GraphNode, inner: GraphNode) =>
  outer.pane === inner.pane &&
  outer.loc.start.index <= inner.loc.start.index &&
  inner.loc.end.index <= outer.loc.end.index;

const push = (map: Map<string, string[]>, key: string, value: string): void => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

export const buildGraphIndex = (view: ViewFile): GraphIndex => {
  const index: GraphIndex = {
    nodes: new Map(),
    forward: new Map(),
    backward: new Map(),
    uses: new Map(),
  };
  for (const node of view.nodes) index.nodes.set(node.id, node);
  for (const region of view.nodes.filter((node) => !isUse(node)))
    for (const use of view.nodes.filter((node) => isUse(node) && isInside(region, node)))
      push(index.uses, region.id, use.id);
  for (const edge of view.edges) {
    push(index.forward, edge.from, edge.to);
    push(index.backward, edge.to, edge.from);
  }
  return index;
};

const walk = (adjacency: Map<string, string[]>, start: string, seen: Set<string>): void => {
  const queue = [start];
  for (const nodeId of queue)
    for (const next of adjacency.get(nodeId) ?? [])
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
};

// A node, what it links to in either direction, and for a declaration, the same for each read and
// write inside it.
export const getCausalNodeIds = (index: GraphIndex, nodeId: string): Set<string> => {
  const starts = [nodeId, ...(index.uses.get(nodeId) ?? [])];
  const seen = new Set(starts);
  for (const start of starts) {
    walk(index.forward, start, seen);
    walk(index.backward, start, seen);
  }
  return seen;
};
