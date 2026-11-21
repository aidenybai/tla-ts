import { useState } from "react";
import type { Source } from "@/lib/site-data";
import { getHighlightColors } from "@/lib/highlight-colors";
import { CodeLine } from "./code-line";
import { Connector } from "./connector";

const getText = (source: Source, row: number) =>
  (source.lines[row] ?? []).map((token) => token.content).join("");

interface ComparisonProps {
  typescript: Source;
  tla: Source;
}

// TypeScript beside the TLA+ it becomes. The two are written row for row, so an arrow joins each
// row that has code on both sides.
export const Comparison = (props: ComparisonProps) => {
  const [hoveredName, setHoveredName] = useState<string>();
  const names = props.typescript.lines
    .map((_tokens, row) => row)
    .filter(
      (row) =>
        getText(props.typescript, row).trim() !== "" && getText(props.tla, row).trim() !== "",
    )
    .map(String);
  const colors = getHighlightColors(names);
  const rows = Array.from(
    { length: Math.max(props.typescript.lines.length, props.tla.lines.length) },
    (_row, index) => index,
  );
  return (
    <div
      data-hovering-name={hoveredName === undefined ? undefined : ""}
      onPointerOver={(event) =>
        setHoveredName(
          event.target instanceof HTMLElement ? event.target.dataset.region : undefined,
        )
      }
      onPointerLeave={() => setHoveredName(undefined)}
      className="relative grid grid-cols-2 gap-x-2 gap-y-1.5 sm:gap-x-3 lg:-mx-8"
    >
      <span className="text-xs text-faint">TypeScript</span>
      <span className="text-xs text-faint">TLA+</span>
      {[
        { pane: "source", source: props.typescript },
        { pane: "output", source: props.tla },
      ].map((side) => (
        // Both sides take their rows from the one grid, so a row is as tall on one side as on
        // the other when a line wraps.
        <code
          key={side.pane}
          data-pane={side.pane}
          style={{ gridRow: `2 / span ${rows.length}` }}
          className="grid min-w-0 grid-rows-subgrid rounded-2xl bg-card p-3 font-mono text-code/[1.7] text-foreground shadow-raised sm:p-4"
        >
          {rows
            .map((row) => ({ row, text: getText(side.source, row) }))
            .map((line) => (
              <span key={line.row} data-line className="-mx-3 block px-3 sm:-mx-4 sm:px-4">
                <CodeLine
                  tokens={side.source.lines[line.row] ?? []}
                  marks={
                    names.includes(String(line.row))
                      ? [
                          {
                            name: String(line.row),
                            start: line.text.length - line.text.trimStart().length,
                            end: line.text.length,
                          },
                        ]
                      : undefined
                  }
                  hoveredName={hoveredName === String(line.row) ? hoveredName : undefined}
                  isHighlighted
                  colors={colors}
                />
              </span>
            ))}
        </code>
      ))}
      <Connector names={names} hoveredName={hoveredName} colors={colors} />
    </div>
  );
};
