import { ArrowsOutSimple, Minus } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import { examples } from "virtual:site-data";
import { getHighlightColors } from "@/lib/highlight-colors";
import { startJsTlaWorker } from "@/lib/js-tla-worker";
import { getLineMarks } from "@/lib/line-marks";
import { getOutputRows, getRunLines } from "@/lib/output-rows";
import type { RunResult } from "@/lib/run-worker";
import type { Search, SearchState } from "@/lib/search";
import { useRun } from "@/hooks/use-run";
import { useSearchPath } from "@/hooks/use-search-path";
import { Maze } from "./maze";
import { MazeReplay } from "./maze-replay";
import { Code } from "./code";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Verdict } from "./verdict";

const VIEWS = ["typescript", "tla"] as const;

type View = (typeof VIEWS)[number];

interface ExampleState {
  example: (typeof examples)[number];
  view: View;
  setView: (view: View) => void;
  isRunning: boolean;
  // Whether TLA-ts has run.
  hasRun: boolean;
  // Whether the reader has reached the heart, which the run button then asks to be pressed for.
  isBugFound: boolean;
  findBug: () => void;
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
  const [view, setView] = useState<View>("typescript");
  const [hasRun, setHasRun] = useState(false);
  const [isBugFound, setIsBugFound] = useState(false);
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
  // A run shows where it ended in the TLA+.
  const run = () => {
    setHasRun(true);
    setView("tla");
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
        isBugFound,
        findBug: () => setIsBugFound(true),
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
        data-example
        // The card is wider than the column it sits in, for a board large enough to play on.
        className="relative flex flex-col gap-3 sm:-mx-3"
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

const ExampleSource = () => {
  const state = exampleContext.useParts();
  const example = state.example;
  const [openFolds, setOpenFolds] = useState<ReadonlySet<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  // The search the reader has put away, to play the board again.
  const [closed, setClosed] = useState<Search>();
  const [isPreviewHidden, setIsPreviewHidden] = useState(false);
  const search = state.result?.search;
  const replayed = search === closed ? undefined : search;
  const failingLine = state.result?.notes.find((note) => note.tone === "danger")?.line;
  // A run's verdict is on a line that may be below the fold of the code.
  useEffect(() => {
    const scroller = scrollRef.current;
    const line = scroller?.querySelector<HTMLElement>(`[data-line="${failingLine}"]`);
    if (!scroller || !line || state.view !== "tla") return;
    scroller.scrollTo({ top: line.offsetTop - scroller.clientHeight / 2 });
  }, [failingLine, state.view]);
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
    <div className="w-full">
      <Code.Root
        source={isCompiled ? example.tla : example.typescript}
        rows={isCompiled ? rows : undefined}
        onToggleFold={(name) => setOpenFolds((open) => open.symmetricDifference(new Set([name])))}
        lineMarks={isCompiled ? lineMarks : sourceLineMarks}
        colors={colors}
        activeLine={result?.activeLine}
        notes={result?.notes}
        search={result?.search}
        path={isCompiled ? state.path : undefined}
        onHoverState={state.hoverState}
      >
        {/* The preview sits over the code's corner, or above the code where the card is a phone's
            width. The reader plays the game there, and a run plays the check out on the same
            board. Put away, it folds down to its bar and keeps its place in the game. The fold
            has the small overshoot of the Crucible app's screenshots. */}
        <div
          className={cn(
            "z-10 overflow-hidden rounded-xl bg-card shadow-raised transition-[width] duration-[450ms] ease-[cubic-bezier(0.3,1.15,0.5,1)] max-sm:mb-4 max-sm:w-full motion-reduce:transition-none sm:absolute sm:top-3 sm:right-3",
            isPreviewHidden ? "sm:w-26" : "sm:w-52",
          )}
        >
          <Button
            aria-expanded={!isPreviewHidden}
            onClick={() => setIsPreviewHidden(!isPreviewHidden)}
            // The bar takes the panel's own corners, so its hover fills the panel edge to edge.
            className="h-8 w-full justify-between gap-3 rounded-none border-transparent bg-transparent px-2.5 text-xs active:scale-100"
          >
            Preview
            {isPreviewHidden ? <ArrowsOutSimple /> : <Minus />}
          </Button>
          <div
            inert={isPreviewHidden}
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-[450ms,300ms] ease-[cubic-bezier(0.3,1.15,0.5,1),ease-out] motion-reduce:transition-none",
              isPreviewHidden ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="p-2 pt-0 sm:w-52">
                {replayed ? (
                  <MazeReplay search={replayed} onClose={() => setClosed(replayed)} />
                ) : (
                  <Maze onBugFound={state.findBug} />
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="-mx-4 -mt-4 -mb-2 h-[31rem] w-[calc(100%+2rem)] overflow-x-hidden overflow-y-auto [scrollbar-width:none] mask-[linear-gradient(to_bottom,black_calc(100%-24px),transparent)] px-4 pt-4 pb-6"
        >
          <Code.Content />
        </div>
        <Code.Footer>
          <output className="flex min-w-0 flex-1 items-center gap-1.5 max-sm:text-xs">
            <ToggleGroup.Root
              label="View"
              value={state.view}
              isDisabled={state.isRunning}
              onValueChange={(value) =>
                state.setView(VIEWS.find((view) => view === value) ?? "typescript")
              }
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
            isSuggested={state.isBugFound && !state.hasRun}
            onRun={state.run}
          />
        </Code.Footer>
      </Code.Root>
    </div>
  );
};

export const Example = {
  Root: ExampleRoot,
  Hint: ExampleHint,
  Source: ExampleSource,
};
