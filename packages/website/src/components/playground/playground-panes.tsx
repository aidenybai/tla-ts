import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, type ReactNode, type Ref } from "react";
import { cn } from "cn";
import { getLineHoveredName } from "@/lib/line-marks";
import { usePlaygroundView } from "@/lib/playground-view";
import { getStateNames, type SearchState } from "@/lib/search";
import type { Mark, Token } from "@/lib/site-data";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import { useSearchPath } from "@/hooks/use-search-path";
import { CodeEditor } from "./code-editor";
import { CodeComment, CodeFold, CodeLine } from "@/components/code-line";
import { Connector } from "@/components/connector";
import { usePlayground } from "./playground-context";
import { Resizable } from "@/components/ui/resizable";

// The height of a line of code that fits its pane, and of the pane before it is measured.
const LINE_HEIGHT_PX = 22;
const BUILT_PANE_HEIGHT_PX = 900;
const NO_MARKS: Mark[] = [];

interface PaneProps {
  name: string;
  ref?: Ref<HTMLElement>;
  onFocus?: () => void;
  children: ReactNode;
}

const Pane = (props: PaneProps) => (
  <section
    ref={props.ref}
    data-pane={props.name}
    onFocus={props.onFocus}
    translate="no"
    className="size-full overflow-auto overscroll-contain p-4"
  >
    {props.children}
  </section>
);

export const PlaygroundSource = () => {
  const playground = usePlayground();
  const hoveredName = usePlaygroundView((view) => view.hoveredName);
  const hoverName = usePlaygroundView((view) => view.hoverName);
  const isArrowsShown = usePlaygroundView((view) => view.isArrowsShown);
  const steps = useSearchPath(
    playground.result?.search,
    usePlaygroundView((view) => view.hoveredStateId),
  );
  const focusedNames = useMemo(() => steps.flatMap(getStateNames), [steps]);
  return (
    <Pane name="source" onFocus={playground.startCompiler}>
      <CodeEditor
        label="TypeScript source"
        value={playground.source}
        tokens={playground.sourceTokens}
        onChange={playground.setSource}
        marks={playground.sourceMarks}
        hoveredName={hoveredName}
        isHighlighted={isArrowsShown}
        focusedNames={focusedNames}
        colors={playground.colors}
        onHover={hoverName}
      />
    </Pane>
  );
};

interface OutputLineProps {
  number: number;
  tokens: Token[];
  hoveredName: string | undefined;
  activeLine: number | undefined;
  steps: SearchState[];
}

const OutputLine = (props: OutputLineProps) => {
  const playground = usePlayground();
  const isArrowsShown = usePlaygroundView((view) => view.isArrowsShown);
  const marks = playground.outputLineMarks.at(props.number - 1) ?? NO_MARKS;
  return (
    <CodeLine
      number={props.number}
      tokens={props.tokens}
      marks={marks}
      hoveredName={getLineHoveredName(marks, props.hoveredName)}
      isHighlighted={isArrowsShown}
      colors={playground.colors}
      note={playground.result?.notes.find((note) => note.line === props.number)}
      isActive={props.activeLine === props.number}
      isDimmed={props.steps.length > 0 && props.steps.every((step) => step.line !== props.number)}
      className="-mr-4 -ml-4 pr-4 pl-4"
    />
  );
};

interface OutputFoldProps {
  name: string;
  lineCount: number;
  isOpen: boolean;
}

const OutputFold = (props: OutputFoldProps) => {
  const playground = usePlayground();
  return (
    <CodeFold
      lineCount={props.lineCount}
      isOpen={props.isOpen}
      hasGutter
      isDisabled={playground.isSkeleton}
      onToggle={() => playground.toggleFold(props.name)}
      className={cn(!playground.isSkeleton && "text-faint")}
    />
  );
};

export const PlaygroundOutput = () => {
  const playground = usePlayground();
  const paneRef = useRef<HTMLElement>(null);
  const hoveredName = usePlaygroundView((view) => view.hoveredName);
  const hoverName = usePlaygroundView((view) => view.hoverName);
  const search = playground.result?.search;
  const steps = useSearchPath(
    search,
    usePlaygroundView((view) => view.hoveredStateId),
  );
  // ESCore's code of a program runs to a thousand lines, so the pane holds only the lines in view.
  const virtualizer = useVirtualizer({
    count: playground.outputRows.length,
    getScrollElement: () => paneRef.current,
    estimateSize: () => LINE_HEIGHT_PX,
    overscan: 20,
    initialRect: { width: 0, height: BUILT_PANE_HEIGHT_PX },
  });
  const rows = virtualizer.getVirtualItems();
  const outputRows = playground.outputRows;
  useEffect(() => {
    const failingLine = search?.states.find((found) => found.isFailing)?.line;
    const failingRow = outputRows.findIndex(
      (row) => row.kind === "line" && row.number === failingLine,
    );
    if (failingRow !== -1) virtualizer.scrollToIndex(failingRow, { align: "center" });
  }, [search, outputRows, virtualizer]);
  return (
    <Pane name="output" ref={paneRef}>
      {playground.isSkeleton && (
        <span role="status" className="sr-only">
          Compiling
        </span>
      )}
      {playground.error && (
        <p role="alert" className="mb-3 text-sm break-words text-destructive">
          {playground.error}
        </p>
      )}
      <code
        aria-hidden={playground.isSkeleton || undefined}
        data-skeleton={playground.isSkeleton ? "" : undefined}
        // The space between two words of a name is not a word of it, so the pointer there takes
        // the name of its line. Otherwise the name would drop and come back on each word crossed.
        onPointerOver={(event) => {
          if (!(event.target instanceof HTMLElement)) return hoverName(undefined);
          const line = Number(event.target.closest<HTMLElement>("[data-line]")?.dataset.line);
          hoverName(
            event.target.dataset.region ?? playground.outputLineMarks[line - 1]?.at(0)?.name,
          );
        }}
        onPointerLeave={() => hoverName(undefined)}
        // The lines in view flow as the page lays them out, so a line that wraps is as tall on the
        // built page as it is once the pane has measured it. Padding stands for the rest.
        style={{
          paddingTop: rows.at(0)?.start ?? 0,
          paddingBottom: virtualizer.getTotalSize() - (rows.at(-1)?.end ?? 0),
        }}
        className={cn(
          "@container block font-mono text-[13px]/[1.7] pointer-coarse:text-[16px]/[1.7] transition-opacity duration-150 ease-out",
          playground.isSkeleton
            ? "animate-pulse text-transparent select-none motion-reduce:animate-none"
            : "text-foreground",
          playground.isOutputStale && "opacity-50 delay-200",
        )}
      >
        {rows
          .flatMap((row) => {
            const output = outputRows.at(row.index);
            return output ? { row, output } : [];
          })
          .map((line) => (
            <span
              key={line.row.key}
              ref={virtualizer.measureElement}
              data-index={line.row.index}
              className="block"
            >
              {line.output.kind === "line" && (
                <OutputLine
                  number={line.output.number}
                  tokens={line.output.tokens}
                  hoveredName={hoveredName}
                  activeLine={steps.at(0)?.line ?? playground.result?.activeLine}
                  steps={steps}
                />
              )}
              {line.output.kind === "comment" && (
                <CodeComment
                  text={line.output.text}
                  hasGutter
                  className={cn(
                    line.row.index > 0 && "pt-[0.85em]",
                    !playground.isSkeleton && "text-faint",
                  )}
                />
              )}
              {line.output.kind === "fold" && (
                <OutputFold
                  name={line.output.name}
                  lineCount={line.output.lineCount}
                  isOpen={line.output.isOpen}
                />
              )}
            </span>
          ))}
      </code>
    </Pane>
  );
};

// Arrows from each piece of the source to the TLA+ it compiles to.
export const PlaygroundArrows = () => {
  const playground = usePlayground();
  const hoveredName = usePlaygroundView((view) => view.hoveredName);
  const isArrowsShown = usePlaygroundView((view) => view.isArrowsShown);
  const outputLines = useMemo(() => {
    const lines: Record<string, number> = {};
    playground.outputLineMarks.forEach((marks, index) => {
      for (const mark of marks) lines[mark.name] ??= index + 1;
    });
    return lines;
  }, [playground.outputLineMarks]);
  return (
    <Connector
      names={
        isArrowsShown
          ? Object.keys(playground.colors)
          : hoveredName === undefined
            ? []
            : [hoveredName]
      }
      hoveredName={hoveredName}
      colors={playground.colors}
      outputLines={outputLines}
    />
  );
};

interface PanesProps {
  source: ReactNode;
  output: ReactNode;
}

// The panes sit side by side on a wide screen and stacked on a narrow one. The built page cannot
// know which, so it lays them out with CSS until the resizable group takes over.
export const PlaygroundPanes = (props: PanesProps) => {
  const playground = usePlayground();
  const isHydrated = useIsHydrated();
  return isHydrated ? (
    <Resizable.Group orientation={playground.isWide ? "horizontal" : "vertical"}>
      <Resizable.Panel defaultSize="50%" minSize="20%">
        {props.source}
      </Resizable.Panel>
      <Resizable.Handle />
      <Resizable.Panel defaultSize="50%" minSize="20%">
        {props.output}
      </Resizable.Panel>
    </Resizable.Group>
  ) : (
    <div className="flex size-full max-md:flex-col">
      <div className="min-h-0 min-w-0 flex-1">{props.source}</div>
      <div className="shrink-0 bg-border max-md:h-px md:w-px" />
      <div className="min-h-0 min-w-0 flex-1">{props.output}</div>
    </div>
  );
};
