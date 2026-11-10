import { useMemo, useRef } from "react";
import { getLines, getLinkAt } from "@/lib/regions";
import { getTokens } from "@/lib/syntax";
import { CodePane } from "./code-pane";
import { getNameAtPoint, LinkedLines, useScrollToSelection } from "./linked-lines";
import { Pane } from "./pane";
import { useActiveName, useHighlight, useViewer } from "./viewer-context";

// Compile errors name their place as spec.ts:2:5 or, for type errors, spec.ts(2,5).
const getErrorLine = (error: string | undefined) => {
  const match = /\.ts(?::(\d+):\d+|\((\d+),\d+\))/.exec(error ?? "");
  return match === null ? undefined : Number(match[1] ?? match[2]);
};

export const SourcePane = () => {
  const viewer = useViewer();
  const highlight = useHighlight();
  const activeName = useActiveName();
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollToSelection(scrollRef, "source");
  const source = viewer.source;
  const sourceLinks = viewer.sourceLinks;
  const lines = useMemo(
    () => getLines(source, getTokens(source, "typescript"), sourceLinks),
    [source, sourceLinks],
  );

  return (
    <Pane>
      <Pane.Header>{viewer.example.fileName}</Pane.Header>
      <Pane.Body
        ref={scrollRef}
        onMouseMove={(event) => highlight.setHovered(getNameAtPoint(event.clientX, event.clientY))}
        onMouseLeave={() => highlight.setHovered(undefined)}
      >
        <CodePane
          lineCount={lines.length}
          isWrapped={viewer.isWrapped}
          data-has-active={activeName !== undefined || undefined}
        >
          <LinkedLines lines={lines} markedLine={getErrorLine(viewer.error)} />
          <CodePane.Input
            aria-label="TypeScript source"
            value={source}
            onChange={(event) => viewer.setSource(event.target.value)}
            onSelect={(event) => {
              const link = getLinkAt(
                sourceLinks,
                event.currentTarget.selectionStart,
                event.currentTarget.selectionEnd,
              );
              highlight.select(
                link === undefined ? undefined : { name: link.name, origin: "source" },
              );
            }}
          />
        </CodePane>
      </Pane.Body>
    </Pane>
  );
};
