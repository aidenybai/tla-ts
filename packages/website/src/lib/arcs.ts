export interface ArcRequest {
  id: string;
  color: string;
  isWrite: boolean;
  // The middle of the source and target rows, scrolled out of view or not.
  from: number;
  to: number;
}

export interface Span {
  top: number;
  bottom: number;
}

// A visual row of TypeScript text, and where its text ends.
export interface TextRow extends Span {
  right: number;
}

// The arcs cross from the TypeScript pane to the left edge of the TLA+ pane. They bend right of
// the TypeScript text they pass, but no further right than `limit`.
export interface Channel {
  limit: number;
  end: number;
  source: Span;
  target: Span;
  rows: TextRow[];
}

export interface RoutedArc {
  id: string;
  color: string;
  isWrite: boolean;
  path: string;
}

// One per source row in view: a line from the end of the row's text to the channel, which forks
// into the row's arcs. Its color is null when the row's arcs differ in color.
export interface Lead {
  x: number;
  y: number;
  path: string;
  color: string | null;
}

export interface Routes {
  arcs: RoutedArc[];
  leads: Lead[];
}

const EDGE_INSET = 6;
const ROW_SPREAD = 14;
const MAX_STEP = 4;
const STUB_BOW = 28;
const TEXT_GAP = 12;
const LEAD_GAP = 6;
const MIN_LANE = 0.1;
const MAX_LANE = 0.9;

interface End {
  y: number;
  // -1 when the row is above the visible part of its pane, 1 when below, and 0 when in view.
  direction: number;
}

const getEnd = (y: number, span: Span): End => {
  if (y < span.top + EDGE_INSET) return { y: span.top + EDGE_INSET, direction: -1 };
  if (y > span.bottom - EDGE_INSET) return { y: span.bottom - EDGE_INSET, direction: 1 };
  return { y, direction: 0 };
};

interface Placed {
  request: ArcRequest;
  from: End;
  to: End;
}

// Arcs that share a row fan out from it: each gets its own offset down the row, in the order of
// their other ends, so that the curves leave the row without crossing or coinciding.
const getOffsets = (arcs: Placed[], side: "from" | "to"): Map<string, number> => {
  const other = side === "from" ? "to" : "from";
  const groups = Map.groupBy(
    arcs.filter((arc) => arc[side].direction === 0),
    (arc) => Math.round(arc[side].y),
  );
  return new Map(
    [...groups.values()].flatMap((group) => {
      const step = Math.min(MAX_STEP, ROW_SPREAD / group.length);
      return group
        .toSorted((left, right) => left[other].y - right[other].y)
        .map((arc, index) => [arc.request.id, (index - (group.length - 1) / 2) * step] as const);
    }),
  );
};

// Each arc turns from its source row toward its target at its own lane of the gutter. Arcs that
// go up turn later the lower they start, and arcs that go down turn later the higher they start,
// so arcs that go the same way nest instead of crossing. Returns each lane as a fraction of the
// gutter's width.
const getLanes = (arcs: Placed[]): Map<string, number> =>
  new Map(
    [...Map.groupBy(arcs, (arc) => Math.sign(arc.to.y - arc.from.y)).entries()].flatMap(
      ([direction, group]) =>
        group
          .toSorted(
            (left, right) => (left.from.y - right.from.y) * -direction || left.to.y - right.to.y,
          )
          .map(
            (arc, index) =>
              [
                arc.request.id,
                MIN_LANE + ((MAX_LANE - MIN_LANE) * (index + 1)) / (group.length + 1),
              ] as const,
          ),
    ),
  );

// Routes the arcs of the focused region across the gutter. An end in view meets its row
// horizontally. An end scrolled out of view becomes a stub at the top or bottom of its pane.
export const routeArcs = (requests: ArcRequest[], channel: Channel): Routes => {
  const placed = requests
    .map((request) => ({
      request,
      from: getEnd(request.from, channel.source),
      to: getEnd(request.to, channel.target),
    }))
    .filter((arc) => arc.from.direction === 0 || arc.to.direction === 0);
  if (placed.length === 0) return { arcs: [], leads: [] };
  const fromOffsets = getOffsets(placed, "from");
  const toOffsets = getOffsets(placed, "to");
  const getTextEnd = (top: number, bottom: number) =>
    Math.max(
      0,
      ...channel.rows.filter((row) => row.bottom > top && row.top < bottom).map((row) => row.right),
    );
  const ends = placed.flatMap((arc) => [arc.from.y, arc.to.y]);
  const start = Math.min(
    channel.limit,
    getTextEnd(Math.min(...ends) - ROW_SPREAD, Math.max(...ends) + ROW_SPREAD) + TEXT_GAP,
  );
  const width = channel.end - start;
  const lanes = getLanes(placed);
  const arcs = placed.map((arc) => {
    const fromOffset = fromOffsets.get(arc.request.id) ?? 0;
    const toOffset = toOffsets.get(arc.request.id) ?? 0;
    const lane = start + width * (lanes.get(arc.request.id) ?? 0.5);
    // A stub leaves or meets the pane's edge vertically in its own lane, so its arrowhead points
    // out of view.
    const head =
      arc.from.direction === 0
        ? `M ${start} ${arc.from.y + fromOffset} C ${lane} ${arc.from.y + fromOffset}`
        : `M ${lane} ${arc.from.y} C ${lane} ${arc.from.y - arc.from.direction * STUB_BOW}`;
    const tail =
      arc.to.direction === 0
        ? `${lane} ${arc.to.y + toOffset}, ${channel.end} ${arc.to.y + toOffset}`
        : `${lane} ${arc.to.y - arc.to.direction * STUB_BOW}, ${lane} ${arc.to.y}`;
    return {
      id: arc.request.id,
      color: arc.request.color,
      isWrite: arc.request.isWrite,
      path: `${head}, ${tail}`,
    };
  });
  const rows = Map.groupBy(
    placed.filter((arc) => arc.from.direction === 0),
    (arc) => arc.from.y,
  );
  const leads = [...rows].map(([y, group]) => {
    const offsets = group.map((arc) => fromOffsets.get(arc.request.id) ?? 0);
    const colors = new Set(group.map((arc) => arc.request.color));
    const textEnd = getTextEnd(y - 1, y + 1) + LEAD_GAP;
    return {
      x: textEnd,
      y,
      path: `M ${textEnd} ${y} H ${start} M ${start} ${y + Math.min(...offsets)} V ${y + Math.max(...offsets)}`,
      color: colors.size === 1 ? group[0].request.color : null,
    };
  });
  return { arcs, leads };
};
