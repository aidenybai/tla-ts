import type { PlacedToken } from "@/hooks/use-token-boxes";
import type { Box } from "@/lib/positions";
import { useIsDimmed, useIsHovered } from "@/store/viewer";

const getTokenOpacity = (isDimmed: boolean, isMultiLine: boolean): number => {
  if (isDimmed) return 0.25;
  return isMultiLine ? 0.5 : 1;
};

interface MarkRectProps {
  nodeId: string;
  box: Box;
  isMultiLine: boolean;
  isHovered: boolean;
  color: string;
  opacity: number;
}

const MarkRect = ({ nodeId, box, isMultiLine, isHovered, color, opacity }: MarkRectProps) => (
  <rect
    data-node={nodeId}
    x={isMultiLine ? box.x - 8 : box.x - 2}
    y={box.y + 1}
    width={isMultiLine ? 3 : box.width + 4}
    height={box.height - 2}
    rx={isMultiLine ? 1.5 : 2}
    fill={color}
    fillOpacity={isMultiLine ? 1 : 0.3}
    stroke={isHovered ? color : "none"}
    strokeWidth={2}
    opacity={opacity}
    className="mix-blend-multiply dark:mix-blend-screen"
  />
);

interface TokenMarkProps extends PlacedToken {
  color: string;
}

export const TokenMark = ({ node, box, rows, isMultiLine, color }: TokenMarkProps) => {
  const isHovered = useIsHovered(node.id);
  const opacity = getTokenOpacity(useIsDimmed([node.id]), isMultiLine);
  return (isMultiLine ? [box] : rows).map((row) => (
    <MarkRect
      key={`${row.x}-${row.y}`}
      nodeId={node.id}
      box={row}
      isMultiLine={isMultiLine}
      isHovered={isHovered}
      color={color}
      opacity={opacity}
    />
  ));
};
