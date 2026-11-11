import type { PlacedArc, Point } from "@/lib/arcs";
import type { GraphEdge } from "@/model";
import { useHasHover, useIsCausalEdge } from "@/store/viewer";

const MIN_BOW = 10;
const STEM = 8;
const MAX_BOW = 60;

const EVENT_ARC_KINDS = new Set<GraphEdge["kind"]>(["writes"]);

// From the end of a TypeScript token across the gutter to the start of its TLA+ token.
const getAcrossPath = ({ from, to }: PlacedArc): string => {
  const start: Point = { x: from.x + from.width + 2, y: from.y + from.height / 2 };
  const tip: Point = { x: to.x - 2, y: to.y + to.height / 2 };
  const base: Point = { x: tip.x - STEM, y: tip.y };
  const bow = Math.max(MIN_BOW, (base.x - start.x) / 2);
  return `M ${start.x} ${start.y} C ${start.x + bow} ${start.y}, ${base.x - bow} ${base.y}, ${base.x} ${base.y} L ${tip.x} ${tip.y}`;
};

const getBow = (from: Point, to: Point, direction: number): number =>
  Math.max(MIN_BOW, Math.min(MAX_BOW, Math.abs(to.y - from.y) / 2)) * direction;

// When the panes stack, from the TypeScript token down or up to its TLA+ token.
const getVerticalPath = ({ from, to }: PlacedArc): string => {
  const direction = to.y > from.y ? 1 : -1;
  const start: Point = {
    x: from.x + from.width / 2,
    y: direction === 1 ? from.y + from.height : from.y,
  };
  const tip: Point = {
    x: to.x + to.width / 2,
    y: direction === 1 ? to.y : to.y + to.height,
  };
  const base: Point = { x: tip.x, y: tip.y - STEM * direction };
  const bow = getBow(start, base, direction);
  return `M ${start.x} ${start.y} C ${start.x} ${start.y + bow}, ${base.x} ${base.y - bow}, ${base.x} ${base.y} L ${tip.x} ${tip.y}`;
};

interface ArcProps extends PlacedArc {
  markerId: string;
  isStacked: boolean;
}

export const Arc = ({ markerId, isStacked, ...arc }: ArcProps) => {
  const isActive = useIsCausalEdge(arc.edge.from, arc.edge.to);
  const hasHover = useHasHover();
  const isMuted = hasHover && !isActive;
  const isEvent = EVENT_ARC_KINDS.has(arc.edge.kind);
  return (
    <path
      d={isStacked ? getVerticalPath(arc) : getAcrossPath(arc)}
      fill="none"
      stroke={arc.color}
      strokeWidth={isActive ? 1.75 : 1}
      strokeDasharray={isEvent ? "4 3" : undefined}
      markerEnd={`url(#${markerId}${isEvent ? "hollow" : "solid"})`}
      opacity={isMuted ? 0.1 : isActive ? 1 : 0.55}
    />
  );
};
