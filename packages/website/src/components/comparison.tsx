import { useMemo, useState } from "react";
import type { Source } from "@/lib/site-data";
import { getHighlightColors } from "@/lib/highlight-colors";
import { CodeLine } from "./code-line";
import { Connector } from "./connector";

interface ComparisonProps {
  typescript: Source;
  tla: Source;
}

// TypeScript beside the TLA+ it becomes. The two are written row for row, so an arrow joins each
// row that has code on both sides.
export const Comparison = (props: ComparisonProps) => {
  const [hoveredName, setHoveredName] = useState<string>();
  // Kept between renders, so that hovering a row renders only the lines of that row again.
  const comparison = useMemo(() => {
    const sources = [
      { pane: "source", source: props.typescript, lines: props.typescript.code.split("\n") },
      { pane: "output", source: props.tla, lines: props.tla.code.split("\n") },
    ];
    const rows = Array.from(
      { length: Math.max(...sources.map((side) => side.lines.length)) },
      (_row, index) => index,
    );
    const names = rows
      .filter((row) => sources.every((side) => (side.lines[row] ?? "").trim() !== ""))
      .map(String);
    return {
      names,
      colors: getHighlightColors(names),
      sides: sources.map((side) => ({
        pane: side.pane,
        lines: rows.map((row) => {
          const text = side.lines[row] ?? "";
          return {
            name: String(row),
            tokens: side.source.lines[row] ?? [],
            marks: names.includes(String(row))
              ? [
                  {
                    name: String(row),
                    start: text.length - text.trimStart().length,
                    end: text.length,
                  },
                ]
              : undefined,
          };
        }),
      })),
    };
  }, [props.typescript, props.tla]);
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
      {comparison.sides.map((side) => (
        // Both sides take their rows from the one grid, so a row is as tall on one side as on
        // the other when a line wraps.
        <code
          key={side.pane}
          data-pane={side.pane}
          style={{ gridRow: `2 / span ${side.lines.length}` }}
          className="grid min-w-0 grid-rows-subgrid rounded-2xl bg-card p-3 font-mono text-code/[1.7] text-foreground shadow-raised sm:p-4"
        >
          {side.lines.map((line) => (
            <span key={line.name} data-line className="-mx-3 block px-3 sm:-mx-4 sm:px-4">
              <CodeLine
                tokens={line.tokens}
                marks={line.marks}
                hoveredName={hoveredName === line.name ? hoveredName : undefined}
                isHighlighted
                colors={comparison.colors}
              />
            </span>
          ))}
        </code>
      ))}
      <Connector names={comparison.names} hoveredName={hoveredName} colors={comparison.colors} />
    </div>
  );
};
