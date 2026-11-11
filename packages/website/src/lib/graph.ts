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

const MAX_LINKS = 5;

const getLength = (node: GraphNode) => node.loc.end.index - node.loc.start.index;

// The smallest declaration in a node's pane that holds it.
const getHolder = (index: GraphIndex, node: GraphNode): GraphNode | undefined =>
  [...index.nodes.values()]
    .filter((region) => !isUse(region) && region.id !== node.id && isInside(region, node))
    .toSorted((left, right) => getLength(left) - getLength(right))[0];

// Groups nodes whose lines touch or overlap, in line order.
const getLineRuns = (nodes: GraphNode[]): GraphNode[][] => {
  const runs: GraphNode[][] = [];
  for (const node of nodes.toSorted((left, right) => left.loc.start.line - right.loc.start.line)) {
    const last = runs.at(-1);
    if (last && node.loc.start.line <= Math.max(...last.map((inner) => inner.loc.end.line)) + 1) {
      last.push(node);
      continue;
    }
    runs.push([node]);
  }
  return runs;
};

// A link joins the lines of TypeScript nodes to the lines of the TLA+ nodes they become.
export interface Link {
  from: string[];
  to: string[];
}

export interface Links {
  links: Link[];
  // How many runs of lines the node links to, which is more than `links` when they were collapsed.
  lineCount: number;
}

// The links of a focused node: one to each run of lines it links to directly. A declaration gets
// no links for the uses inside it, which its highlight already shows. When a node links to more
// runs than fit, one link goes to the declaration that holds the first of them.
export const getLinks = (index: GraphIndex, nodeId: string): Links => {
  const node = index.nodes.get(nodeId);
  if (!node) return { links: [], lineCount: 0 };
  const isSource = node.pane === "code";
  const runs = getLineRuns(
    ((isSource ? index.forward : index.backward).get(nodeId) ?? []).flatMap(
      (otherId) => index.nodes.get(otherId) ?? [],
    ),
  );
  const toLink = (others: GraphNode[]): Link => {
    const ids = others.map((other) => other.id);
    return isSource ? { from: [nodeId], to: ids } : { from: ids, to: [nodeId] };
  };
  const first = runs[0]?.[0];
  if (runs.length <= MAX_LINKS || first === undefined)
    return { links: runs.map(toLink), lineCount: runs.length };
  return { links: [toLink([getHolder(index, first) ?? first])], lineCount: runs.length };
};
