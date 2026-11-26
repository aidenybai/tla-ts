import { ArrowUpRight } from "@phosphor-icons/react";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import { EXAMPLES } from "@/lib/examples";
import { getHighlightColors } from "@/lib/highlight-colors";
import { getLineMarks } from "@/lib/line-marks";
import { getOutputRows, getRunLines } from "@/lib/output-rows";
import type { RunResult } from "@/lib/run-worker";
import type { SearchState } from "@/lib/search";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRun } from "@/hooks/use-run";
import { useSearchPath } from "@/hooks/use-search-path";
import { StateGraph } from "./state-graph";
import { Code } from "./code";
import { Connector } from "./connector";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Tooltip } from "@/components/ui/tooltip";
import { Verdict } from "./verdict";

interface ExampleState {
  example: (typeof EXAMPLES)[number];
  select: (example: (typeof EXAMPLES)[number]) => void;
  isCompiled: boolean;
  setIsCompiled: (isCompiled: boolean) => void;
  isRunning: boolean;
  hasRun: boolean;
  result: RunResult | undefined;
  path: SearchState[];
  hoverState: (stateId: string | undefined) => void;
  run: () => void;
}

const exampleContext = createPartsContext<ExampleState>("Example.Root");

interface RootProps {
  children: ReactNode;
}

const ExampleRoot = (props: RootProps) => {
  const runner = useRun();
  const [example, setExample] = useState(EXAMPLES[0]);
  const [isCompiled, setIsCompiled] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const isRunning = runner.isRunning;
  const result = isRunning || !isCompiled ? undefined : runner.result;
  const [hoveredStateId, setHoveredStateId] = useState<string>();
  const path = useSearchPath(result?.search, hoveredStateId);
  const request = {
    source: example.tla.code,
    config: example.config,
    modules: example.modules,
    isSearchShown: true,
    typescript: { source: example.typescript.code, fileName: example.fileName },
  };
  const run = () => {
    setHasRun(true);
    setIsCompiled(true);
    runner.run(request);
  };
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return;
      event.preventDefault();
      if (!isRunning) run();
    };
    addEventListener("keydown", handleShortcut);
    return () => removeEventListener("keydown", handleShortcut);
  });
  return (
    <exampleContext.PartsContext
      value={{
        example,
        select: (nextExample) => {
          setExample(nextExample);
          setIsCompiled(false);
          runner.reset();
        },
        isCompiled,
        setIsCompiled,
        isRunning,
        hasRun,
        result,
        path,
        hoverState: setHoveredStateId,
        run,
      }}
    >
      <div className="relative flex flex-col gap-3">{props.children}</div>
    </exampleContext.PartsContext>
  );
};

const ExampleDescription = () => {
  const state = exampleContext.useParts();
  return (
    <p className="text-pretty">
      Here, TLA-ts checks{" "}
      {EXAMPLES.map((example, index) => (
        <Fragment key={example.fileName}>
          {index === EXAMPLES.length - 1 && "or "}
          {example.article}{" "}
          <span className="whitespace-nowrap">
            <Button
              variant="link"
              size="inline"
              aria-pressed={example === state.example}
              disabled={state.isRunning}
              onClick={() => state.select(example)}
            >
              {example.label}
            </Button>
            {index === EXAMPLES.length - 1 ? "." : ","}
          </span>{" "}
        </Fragment>
      ))}
    </p>
  );
};

const ExampleHint = () => {
  const state = exampleContext.useParts();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-full right-4 flex -rotate-3 items-start gap-1 font-hand text-2xl text-muted-foreground transition-opacity duration-200 ease-out",
        state.hasRun && "opacity-0",
      )}
    >
      <span className="mt-3">Click me!</span>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-10"
      >
        <path d="M3 32 C 16 36, 28 28, 30 6" />
        <path d="M23 13 L30 5 L36 14" />
      </svg>
    </span>
  );
};

const VIEW_ITEM_CLASS_NAME = "h-7 rounded-md px-2 text-xs";
// A program's module runs to dozens of rows even with ESCore's own code folded, so a screen with
// room for one pane shows its start.
const PREVIEW_LINES = 16;
// The width from which the TLA+ sits beside the TypeScript, where the page's margins have room for
// it. The graph of states sits beside the two from 94rem, and in the code's lines below that.
const SPLIT_QUERY = "(min-width: 80rem)";
const ExampleSource = () => {
  const state = exampleContext.useParts();
  const example = state.example;
  const isWide = useMediaQuery(SPLIT_QUERY);
  const panesRef = useRef<HTMLDivElement>(null);
  const [openFolds, setOpenFolds] = useState<ReadonlySet<string>>(new Set());
  const [hoveredName, setHoveredName] = useState<string>();
  // The TLA+ pane is made when it first comes into view, and stays, so it can slide shut.
  const [hasCompiled, setHasCompiled] = useState(false);
  if (state.isCompiled && !hasCompiled) setHasCompiled(true);
  const lineMarks = useMemo(
    () => getLineMarks(example.tla.code.split("\n"), example.outputMarks),
    [example],
  );
  const sourceLineMarks = useMemo(
    () => getLineMarks(example.typescript.code.split("\n"), example.sourceMarks),
    [example],
  );
  const colors = useMemo(
    () => getHighlightColors(example.outputMarks.map((mark) => mark.name)),
    [example],
  );
  const outputLines = useMemo(() => {
    const lines: Record<string, number> = {};
    lineMarks.forEach((marks, index) => {
      for (const mark of marks) lines[mark.name] ??= index + 1;
    });
    return lines;
  }, [lineMarks]);
  const result = state.result;
  const rows = useMemo(
    () =>
      getOutputRows({
        lines: example.tla.lines,
        lineMarks,
        source: example.typescript.code,
        sourceMarks: example.sourceMarks,
        openFolds,
        pinnedLines: getRunLines(result),
      }),
    [example, lineMarks, openFolds, result],
  );

  // A run brings the line it failed on into view in the TLA+ pane, which scrolls beside the
  // TypeScript.
  useEffect(() => {
    const line =
      result?.search?.states.find((found) => found.isFailing)?.line ??
      result?.notes.find((note) => note.tone === "danger")?.line;
    const pane = panesRef.current?.querySelector('[data-pane="output"]');
    const target = pane?.querySelector(`[data-line="${line}"]`);
    if (!isWide || !pane || !target) return;
    const view = pane.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    pane.scrollTop += box.top + box.height / 2 - view.top - view.height / 2;
  }, [result, isWide]);

  return (
    <Code.Root
      source={example.typescript}
      lineMarks={sourceLineMarks}
      colors={colors}
      hoveredName={hoveredName}
      isHighlighted={state.isCompiled}
      className={cn(
        "motion-safe:xl:transition-[margin,width] motion-safe:xl:duration-400 motion-safe:xl:ease-[cubic-bezier(0.25,1,0.5,1)]",
        state.isCompiled && "xl:-ml-40 xl:w-[calc(100%+20rem)]",
      )}
    >
      <div
        ref={panesRef}
        data-hovering-name={hoveredName === undefined ? undefined : ""}
        onPointerOver={(event) => {
          if (!(event.target instanceof HTMLElement)) return setHoveredName(undefined);
          const line = event.target.closest<HTMLElement>("[data-line]");
          const marks = line?.closest('[data-pane="output"]') ? lineMarks : sourceLineMarks;
          setHoveredName(
            event.target.dataset.region ?? marks.at(Number(line?.dataset.line) - 1)?.at(0)?.name,
          );
        }}
        onPointerLeave={() => setHoveredName(undefined)}
        className="relative flex w-full"
      >
        <div
          data-pane="source"
          className={cn("min-w-0 flex-1", state.isCompiled && "max-xl:hidden")}
        >
          {/* A new example is other code, so it starts within the limit again. */}
          <Code.Content key={example.fileName} limit={PREVIEW_LINES} />
        </div>
        {hasCompiled && (
          <div
            inert={!state.isCompiled}
            className={cn(
              "relative shrink-0 max-xl:w-full xl:overflow-x-clip motion-safe:xl:transition-[width] motion-safe:xl:duration-400 motion-safe:xl:ease-[cubic-bezier(0.25,1,0.5,1)]",
              state.isCompiled ? "xl:w-132 xl:starting:w-0" : "max-xl:hidden xl:w-0",
            )}
          >
            <Code.Provider
              source={example.tla}
              rows={rows}
              onToggleFold={(name) =>
                setOpenFolds((open) => open.symmetricDifference(new Set([name])))
              }
              lineMarks={lineMarks}
              colors={colors}
              hoveredName={hoveredName}
              isHighlighted
              activeLine={result?.activeLine}
              notes={result?.notes}
              search={result?.search}
              path={state.path}
              onHoverState={state.hoverState}
            >
              <div
                data-pane="output"
                className="xl:absolute xl:-top-4 xl:-bottom-2 xl:left-4 xl:w-128 xl:overflow-auto xl:overscroll-contain xl:border-l xl:pt-4 xl:pb-2 xl:pl-4"
              >
                <Code.Content key={example.fileName} limit={isWide ? undefined : PREVIEW_LINES} />
              </div>
            </Code.Provider>
          </div>
        )}
        {isWide && state.isCompiled && (
          <Connector
            names={Object.keys(colors)}
            hoveredName={hoveredName}
            colors={colors}
            outputLines={outputLines}
          />
        )}
      </div>
      <Code.Actions>
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <a
                href={`/playground#${new URLSearchParams({ file: state.example.fileName, code: state.example.typescript.code })}`}
                aria-label="View in playground"
                className={cn(buttonVariants({ size: "icon" }))}
              />
            }
          >
            <ArrowUpRight />
          </Tooltip.Trigger>
          <Tooltip.Content>View in playground</Tooltip.Content>
        </Tooltip.Root>
      </Code.Actions>
      <Code.Footer>
        <output className="flex min-w-0 flex-1 items-center gap-1.5 max-sm:text-xs">
          <ToggleGroup.Root
            label="Language"
            value={state.isCompiled ? "tla" : "typescript"}
            isDisabled={state.isRunning}
            onValueChange={(value) => state.setIsCompiled(value === "tla")}
            className="mr-1 -ml-1.5 rounded-lg"
          >
            <ToggleGroup.Item value="typescript" className={VIEW_ITEM_CLASS_NAME}>
              TypeScript
            </ToggleGroup.Item>
            <ToggleGroup.Item value="tla" className={VIEW_ITEM_CLASS_NAME}>
              TLA+
            </ToggleGroup.Item>
          </ToggleGroup.Root>
          {state.result && <Verdict result={state.result} />}
        </output>
        <Code.Run
          isRunning={state.isRunning}
          isDone={state.result !== undefined}
          onRun={state.run}
        />
      </Code.Footer>
    </Code.Root>
  );
};

const ExampleGraph = () => {
  const state = exampleContext.useParts();
  return (
    state.result?.search && (
      <div className="absolute top-10 left-[calc(100%+10rem)] ml-8 w-60 transition-[opacity,translate] duration-200 ease-out max-[94rem]:hidden starting:opacity-0 motion-safe:starting:-translate-x-2">
        <StateGraph.Root
          search={state.result.search}
          limit={12}
          path={state.path}
          onHover={state.hoverState}
        />
      </div>
    )
  );
};

export const Example = {
  Root: ExampleRoot,
  Description: ExampleDescription,
  Hint: ExampleHint,
  Source: ExampleSource,
  Graph: ExampleGraph,
};
