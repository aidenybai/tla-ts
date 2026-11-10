import { memo, useEffect, type CSSProperties, type RefObject } from "react";
import type { Line } from "@/lib/regions";
import type { TokenKind } from "@/lib/syntax";
import { cn } from "@/lib/utils";
import { CodePane } from "./code-pane";
import { type Pane, useActiveName, useHighlight, useViewer } from "./viewer-context";

const TOKEN_CLASS_NAMES: Record<TokenKind, string | undefined> = {
  comment: "text-syntax-comment",
  string: "text-syntax-string",
  number: "text-syntax-number",
  keyword: "text-syntax-keyword",
  definition: "text-syntax-definition",
  type: "text-syntax-type",
  name: undefined,
};

interface RegionStyle extends CSSProperties {
  "--region"?: string;
}

export const getRegionStyle = (color: string | undefined): RegionStyle => ({ "--region": color });

interface LinkedLineProps {
  line: Line;
  colors: ReadonlyMap<string, string>;
  // Set only on lines that show the active name, so that other lines skip rendering.
  activeName: string | undefined;
  isMarked: boolean;
}

const LinkedLine = memo(({ line, colors, activeName, isMarked }: LinkedLineProps) => (
  <CodePane.Line number={line.number} isMarked={isMarked}>
    {line.pieces.map((piece) => {
      // Inside an active region, a piece shows that region rather than its own innermost one.
      const activeLink = piece.links.find((link) => link.name === activeName);
      const link = activeLink ?? piece.links[0];
      return (
        <span
          key={piece.start}
          data-name={piece.links[0]?.name}
          data-kind={link?.kind}
          data-active={activeLink !== undefined || undefined}
          className={cn(
            piece.token === undefined ? undefined : TOKEN_CLASS_NAMES[piece.token],
            link !== undefined && "region",
          )}
          style={link === undefined ? undefined : getRegionStyle(colors.get(link.name))}
        >
          {piece.text}
        </span>
      );
    })}
  </CodePane.Line>
));

interface LinkedLinesProps {
  lines: Line[];
  markedLine?: number;
}

export const LinkedLines = ({ lines, markedLine }: LinkedLinesProps) => {
  const colors = useViewer().colors;
  const activeName = useActiveName();
  return lines.map((line) => (
    <LinkedLine
      key={line.number}
      line={line}
      colors={colors}
      activeName={activeName !== undefined && line.names.has(activeName) ? activeName : undefined}
      isMarked={line.number === markedLine}
    />
  ));
};

// The innermost name under the pointer, even below the source's textarea.
export const getNameAtPoint = (clientX: number, clientY: number) =>
  document
    .elementsFromPoint(clientX, clientY)
    .find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element.dataset.name !== undefined,
    )?.dataset.name;

export const useScrollToSelection = (scrollRef: RefObject<HTMLElement | null>, pane: Pane) => {
  const selection = useHighlight().selection;
  useEffect(() => {
    const container = scrollRef.current;
    if (selection === undefined || selection.origin === pane || container === null) return;
    container
      .querySelector(`[data-name="${CSS.escape(selection.name)}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [scrollRef, pane, selection]);
};
