import type { GraphNode } from "@/model";

const getLength = (node: GraphNode) => node.loc.end.index - node.loc.start.index;

const isInside = (inner: GraphNode, outer: GraphNode) =>
  outer.loc.start.index <= inner.loc.start.index &&
  inner.loc.end.index <= outer.loc.end.index &&
  getLength(inner) < getLength(outer);

export interface Mark {
  // Every node that covers exactly this span. The first one takes the pointer.
  nodes: GraphNode[];
  isBar: boolean;
  // Bars whose lines overlap take different lanes of the gutter.
  lane: number;
  // A token that touches the token before or after it on the same line gives up the padding on
  // that side, so their backgrounds meet instead of overlapping.
  isFlushStart: boolean;
  isFlushEnd: boolean;
}

// Lays out the marks of one pane so that no two backgrounds or bars overlap.
export const getMarks = (nodes: GraphNode[]): Mark[] => {
  const groups = [
    ...Map.groupBy(nodes, (node) => `${node.loc.start.index}:${node.loc.end.index}`).values(),
  ];
  // A region is a token when it fits on one line and holds no other region. Tokens get a filled
  // background. Every other region gets a bar in the gutter, since a background would sit under
  // the tokens inside it.
  const isToken = (group: GraphNode[]) =>
    group[0].loc.start.line === group[0].loc.end.line &&
    !nodes.some((node) => isInside(node, group[0]));
  const tokens = groups.filter(isToken);
  const tokenStarts = new Set(tokens.map((group) => group[0].loc.start.index));
  const tokenEnds = new Set(tokens.map((group) => group[0].loc.end.index));
  const lanes: { start: number; end: number; lane: number }[] = [];
  const getLane = (group: GraphNode[]) => {
    const start = group[0].loc.start.line;
    const end = group[0].loc.end.line;
    const taken = new Set(
      lanes
        .filter((placed) => placed.start <= end && start <= placed.end)
        .map((placed) => placed.lane),
    );
    const lane = [...Array(taken.size + 1).keys()].find((candidate) => !taken.has(candidate)) ?? 0;
    lanes.push({ start, end, lane });
    return lane;
  };
  return groups
    .toSorted(
      (left, right) =>
        left[0].loc.start.line - right[0].loc.start.line ||
        getLength(right[0]) - getLength(left[0]),
    )
    .map((group) => ({
      nodes: group,
      isBar: !isToken(group),
      lane: isToken(group) ? 0 : getLane(group),
      isFlushStart: isToken(group) && tokenEnds.has(group[0].loc.start.index),
      isFlushEnd: isToken(group) && tokenStarts.has(group[0].loc.end.index),
    }));
};

// The innermost mark that covers a span, so the pointer over a use inside an action finds the use.
export const getInnermost = <Placed extends { mark: Mark }>(candidates: Placed[]): Placed | null =>
  candidates.toSorted(
    (left, right) => getLength(left.mark.nodes[0]) - getLength(right.mark.nodes[0]),
  )[0] ?? null;
