import type { GraphEdge, ViewFile } from "@/model";
import type { Box } from "./positions";

export interface Point {
  x: number;
  y: number;
}

export interface PlacedArc {
  edge: GraphEdge;
  from: Box;
  to: Box;
  color: string;
}

// Arcs from TypeScript tokens to the TLA+ tokens they compile to. The ends hold each token's box
// in the coordinates of the container that both panes share.
export const placeArcs = (
  view: ViewFile,
  ends: Map<string, Box>,
  colorByNodeId: Map<string, string>,
  isWanted: (edge: GraphEdge) => boolean,
): PlacedArc[] =>
  view.edges.filter(isWanted).flatMap((edge) => {
    const from = ends.get(edge.from);
    const to = ends.get(edge.to);
    const color = colorByNodeId.get(edge.from);
    return from && to && color ? [{ edge, from, to, color }] : [];
  });
