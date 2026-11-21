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
  return (
    <div
      data-hovering-name={hoveredName === undefined ? undefined : ""}
      onPointerOver={(event) =>
        setHoveredName(
          event.target instanceof HTMLElement ? event.target.dataset.region : undefined,
        )
      }
      onPointerLeave={() => setHoveredName(undefined)}
      className="relative grid gap-x-3 gap-y-1.5 md:grid-cols-2 lg:-mx-8"
    >
      {[
        { label: "TypeScript", pane: "source", source: props.typescript },
        { label: "TLA+", pane: "output", source: props.tla },
      ].map((side) => (
        <figure key={side.label} className="flex min-w-0 flex-col gap-1.5">
          <figcaption className="text-xs text-faint">{side.label}</figcaption>
          <div data-pane={side.pane} className="rounded-2xl bg-card p-4 shadow-raised">
            <code className="block font-mono text-code/[1.7] text-foreground">
              {side.source.lines
                .map((tokens, row) => ({ tokens, row, text: getText(side.source, row) }))
                .map((line) => (
                  <span key={line.row} data-line className="-mx-4 block px-4">
                    <CodeLine
                      tokens={line.tokens}
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
          </div>
        </figure>
      ))}
      <Connector names={names} hoveredName={hoveredName} colors={colors} />
    </div>
  );
};
