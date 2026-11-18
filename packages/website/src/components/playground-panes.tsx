import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { cn } from "cn";
import { getLineHoveredName } from "../line-marks";
import { getStateNames } from "../search";
import { useIsHydrated } from "../use-is-hydrated";
import { CodeEditor } from "./code-editor";
import { CodeLine } from "./code-line";
import { Connector } from "./connector";
import { usePlayground } from "./playground";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";

interface PaneProps {
  name: string;
  onFocus?: () => void;
  children: ReactNode;
}

const Pane = (props: PaneProps) => (
  <section
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
  const focusedNames = useMemo(
    () => playground.trace.states.flatMap(getStateNames),
    [playground.trace.states],
  );
  return (
    <Pane name="source" onFocus={playground.startCompiler}>
      <CodeEditor
        label="TypeScript source"
        value={playground.source}
        tokens={playground.sourceTokens}
        onChange={playground.setSource}
        marks={playground.sourceMarks}
        hoveredName={playground.hoveredName}
        isHighlighted={playground.isHighlighted}
        focusedNames={focusedNames}
        colors={playground.colors}
        onHover={playground.setHoveredName}
      />
    </Pane>
  );
};

export const PlaygroundOutput = () => {
  const playground = usePlayground();
  const codeRef = useRef<HTMLElement>(null);
  const search = playground.result?.search;
  const steps = playground.trace.states;
  useEffect(() => {
    codeRef.current
      ?.querySelector(`[data-line="${search?.states.find((found) => found.isFailing)?.line}"]`)
      ?.scrollIntoView({ block: "center" });
  }, [search]);
  return (
    <Pane name="output">
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
        ref={codeRef}
        aria-hidden={playground.isSkeleton || undefined}
        data-skeleton={playground.isSkeleton ? "" : undefined}
        onPointerOver={(event) =>
          playground.setHoveredName(
            event.target instanceof HTMLElement ? event.target.dataset.region : undefined,
          )
        }
        onPointerLeave={() => playground.setHoveredName(undefined)}
        className={cn(
          "@container block font-mono text-[13px]/[1.7] pointer-coarse:text-[16px]/[1.7] transition-opacity duration-150 ease-out",
          playground.isSkeleton
            ? "animate-pulse text-transparent select-none motion-reduce:animate-none"
            : "text-foreground",
          playground.isOutputStale && "opacity-50 delay-200",
        )}
      >
        {playground.outputLines
          .map((tokens, index) => ({ tokens, number: index + 1 }))
          .map((line) => (
            <CodeLine
              key={line.number}
              number={line.number}
              tokens={line.tokens}
              marks={playground.outputLineMarks[line.number - 1]}
              hoveredName={getLineHoveredName(
                playground.outputLineMarks[line.number - 1],
                playground.hoveredName,
              )}
              isHighlighted={playground.isHighlighted}
              colors={playground.colors}
              note={playground.result?.notes.find((note) => note.line === line.number)}
              isActive={(steps.at(0)?.line ?? playground.result?.activeLine) === line.number}
              isDimmed={steps.length > 0 && steps.every((step) => step.line !== line.number)}
              className="-mr-4 -ml-4 pr-4 pl-4"
            />
          ))}
      </code>
    </Pane>
  );
};

// Arrows from each piece of the source to the TLA+ it compiles to.
export const PlaygroundArrows = () => {
  const playground = usePlayground();
  return (
    <Connector
      names={
        playground.isArrowsShown
          ? Object.keys(playground.colors)
          : playground.hoveredName === undefined
            ? []
            : [playground.hoveredName]
      }
      hoveredName={playground.hoveredName}
      colors={playground.colors}
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
    <ResizablePanelGroup orientation={playground.isWide ? "horizontal" : "vertical"}>
      <ResizablePanel defaultSize="50%" minSize="20%">
        {props.source}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="50%" minSize="20%">
        {props.output}
      </ResizablePanel>
    </ResizablePanelGroup>
  ) : (
    <div className="flex size-full max-md:flex-col">
      <div className="min-h-0 min-w-0 flex-1">{props.source}</div>
      <div className="shrink-0 bg-border max-md:h-px md:w-px" />
      <div className="min-h-0 min-w-0 flex-1">{props.output}</div>
    </div>
  );
};
