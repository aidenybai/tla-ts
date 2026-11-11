import type { PlacedToken } from "@/hooks/use-token-boxes";
import { getBoundingBox } from "@/lib/positions";
import { useIsDimmed, useIsHovered } from "@/store/viewer";

const PADDING = 2;
const BAR_WIDTH = 3;
const BAR_GAP = 5;
// How far left of the code the first lane of bars sits.
const BAR_OFFSET = 8;

interface TokenMarkProps extends PlacedToken {
  color: string;
}

// A token gets a background. A declaration gets a bar in the gutter, and an outline around its
// text only while it's hovered or selected, so it never covers the tokens inside it.
export const TokenMark = ({ mark, rows, lines, color }: TokenMarkProps) => {
  const nodeIds = mark.nodes.map((node) => node.id);
  const isHovered = useIsHovered(nodeIds);
  const isDimmed = useIsDimmed(nodeIds);
  const nodeId = nodeIds[0];
  if (mark.isBar) {
    const outline = isHovered ? getBoundingBox(rows) : null;
    return (
      <>
        <rect
          data-node={nodeId}
          x={lines.x - BAR_OFFSET - mark.lane * BAR_GAP}
          y={lines.y + 1}
          width={BAR_WIDTH}
          height={lines.height - 2}
          rx={BAR_WIDTH / 2}
          fill={color}
          opacity={isDimmed ? 0.25 : isHovered ? 1 : 0.5}
        />
        {outline && (
          <rect
            x={outline.x - PADDING - 1}
            y={outline.y}
            width={outline.width + 2 * PADDING + 2}
            height={outline.height}
            rx={3}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
          />
        )}
      </>
    );
  }
  const padStart = mark.isFlushStart ? 0 : PADDING;
  const padEnd = mark.isFlushEnd ? 0 : PADDING;
  return rows.map((row) => (
    <rect
      key={`${row.x}-${row.y}`}
      data-node={nodeId}
      x={row.x - padStart}
      y={row.y + 1}
      width={row.width + padStart + padEnd}
      height={row.height - 2}
      rx={2}
      fill={color}
      fillOpacity={0.3}
      stroke={isHovered ? color : "none"}
      strokeWidth={2}
      opacity={isDimmed ? 0.25 : 1}
    />
  ));
};
