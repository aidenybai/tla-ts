import { ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import { examples } from "virtual:site-data";
import { getHighlightColors } from "@/lib/highlight-colors";
import { startJsTlaWorker } from "@/lib/js-tla-worker";
import { getLineMarks } from "@/lib/line-marks";
import { getOutputRows, getRunLines } from "@/lib/output-rows";
import type { RunResult } from "@/lib/run-worker";
import type { SearchState } from "@/lib/search";
import { useRun } from "@/hooks/use-run";
import { useSearchPath } from "@/hooks/use-search-path";
import { SnakeGame } from "./snake";
import { Code } from "./code";
import { buttonVariants } from "@/components/ui/button-variants";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Tooltip } from "@/components/ui/tooltip";
import { Verdict } from "./verdict";

const VIEWS = ["preview", "typescript", "tla"] as const;

type View = (typeof VIEWS)[number];

interface ExampleState {
  example: (typeof examples)[number];
  view: View;
  setView: (view: View) => void;
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
  const example = examples[0];
  const [view, setView] = useState<View>("preview");
  const [hasRun, setHasRun] = useState(false);
  const isRunning = runner.isRunning;
  const result = isRunning ? undefined : runner.result;
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
    // A run from the TypeScript shows where it ended in the TLA+. One from the game stays on it.
    if (view === "typescript") setView("tla");
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
        view,
        setView,
        isRunning,
        hasRun,
        result,
        path,
        hoverState: setHoveredStateId,
        run,
      }}
    >
      <div
        // The checker takes seconds to load, so it starts as a pointer or the focus reaches the
        // example, ahead of the run. A touch comes with the tap, too late to help.
        onPointerEnter={(event) => event.pointerType === "mouse" && startJsTlaWorker()}
        onFocus={startJsTlaWorker}
        className="relative flex flex-col gap-3"
      >
        {props.children}
      </div>
    </exampleContext.PartsContext>
  );
};

const ExampleHint = () => {
  const state = exampleContext.useParts();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-full right-4 flex -rotate-3 items-start gap-1 font-hand text-2xl text-muted-foreground transition-opacity duration-200 ease-out",
        (state.hasRun || state.view === "preview") && "opacity-0",
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
const PREVIEW_LINES = 28;

const ExampleSource = () => {
  const state = exampleContext.useParts();
  const example = state.example;
  const [openFolds, setOpenFolds] = useState<ReadonlySet<string>>(new Set());
  // Each declaration is marked on the model's line for it: a function on its action or check, and
  // any other on Init. The definitions it compiles to fold away with the rest of JS.tla's code.
  const lineMarks = useMemo(() => {
    const code = example.tla.code;
    return getLineMarks(
      code.split("\n"),
      example.sourceMarks.flatMap((mark) => {
        const start = [mark.name, "Init"]
          .map((name) => code.search(new RegExp(`^${name}(?:\\(.*\\))? ==`, "m")))
          .find((found) => found !== -1);
        if (start === undefined) return [];
        const end = code.indexOf("\n", start);
        return { name: mark.name, start, end: end === -1 ? code.length : end };
      }),
    );
  }, [example]);
  const sourceLineMarks = useMemo(
    () => getLineMarks(example.typescript.code.split("\n"), example.sourceMarks),
    [example],
  );
  const colors = useMemo(
    () => getHighlightColors(example.sourceMarks.map((mark) => mark.name)),
    [example],
  );
  const isCompiled = state.view === "tla";
  // A run's marks are on the TLA+, so the game and the TypeScript show none of them.
  const result = isCompiled ? state.result : undefined;
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
  return (
    <Code.Root
      source={isCompiled ? example.tla : example.typescript}
      rows={isCompiled ? rows : undefined}
      limit={PREVIEW_LINES}
      onToggleFold={(name) => setOpenFolds((open) => open.symmetricDifference(new Set([name])))}
      lineMarks={isCompiled ? lineMarks : sourceLineMarks}
      colors={colors}
      activeLine={result?.activeLine}
      notes={result?.notes}
      search={result?.search}
      path={isCompiled ? state.path : undefined}
      onHoverState={state.hoverState}
    >
      {/* The game stays where it is while the code shows, so a look at the code loses no game. */}
      <div className={cn("w-full", state.view !== "preview" && "hidden")}>
        <SnakeGame search={state.result?.search} isRunning={state.isRunning} onRun={state.run} />
      </div>
      {state.view !== "preview" && (
        <>
          <Code.Content />
          <Code.More />
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
        </>
      )}
      <Code.Footer>
        <output className="flex min-w-0 flex-1 items-center gap-1.5 max-sm:text-xs">
          <ToggleGroup.Root
            label="View"
            value={state.view}
            isDisabled={state.isRunning}
            onValueChange={(value) =>
              state.setView(VIEWS.find((view) => view === value) ?? "preview")
            }
            className="mr-1 -ml-1.5 rounded-lg"
          >
            <ToggleGroup.Item value="preview" className={VIEW_ITEM_CLASS_NAME}>
              Preview
            </ToggleGroup.Item>
            <ToggleGroup.Item value="typescript" className={VIEW_ITEM_CLASS_NAME}>
              TypeScript
            </ToggleGroup.Item>
            <ToggleGroup.Item value="tla" className={VIEW_ITEM_CLASS_NAME}>
              TLA+
            </ToggleGroup.Item>
          </ToggleGroup.Root>
          {state.result && <Verdict result={state.result} />}
        </output>
        {state.view !== "preview" && (
          <Code.Run
            isRunning={state.isRunning}
            isDone={state.result !== undefined}
            onRun={state.run}
          />
        )}
      </Code.Footer>
    </Code.Root>
  );
};

export const Example = {
  Root: ExampleRoot,
  Hint: ExampleHint,
  Source: ExampleSource,
};
