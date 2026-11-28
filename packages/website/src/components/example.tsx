import { ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
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
import { Maze } from "./maze";
import { Code } from "./code";
import { buttonVariants } from "@/components/ui/button-variants";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Tooltip } from "@/components/ui/tooltip";
import { Verdict } from "./verdict";

const VIEWS = ["typescript", "tla"] as const;

type View = (typeof VIEWS)[number];

interface ExampleState {
  example: (typeof examples)[number];
  view: View;
  setView: (view: View) => void;
  isRunning: boolean;
  // Whether TLA-ts has run, by the reader's hand or by the game's.
  hasRun: boolean;
  showCode: (view: View) => void;
  sourceRef: RefObject<HTMLDivElement | null>;
  check: () => void;
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
  const sourceRef = useRef<HTMLDivElement>(null);
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
  // The game checks its own code once the reader has found the bug in it.
  const check = () => {
    setHasRun(true);
    runner.run(request);
  };
  // A run from the code shows where it ended in the TLA+.
  const run = () => {
    setView("tla");
    check();
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
        showCode: (next) => {
          setView(next);
          sourceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
        check,
        sourceRef,
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
    <div ref={state.sourceRef} className="w-full">
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
        <div
          ref={scrollRef}
          className="-mx-4 -mt-4 -mb-2 h-[26rem] w-[calc(100%+2rem)] overflow-x-hidden overflow-y-auto mask-[linear-gradient(to_bottom,black_calc(100%-24px),transparent)] px-4 pt-4 pb-6"
        >
          <Code.Content />
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
            onRun={state.run}
          />
        </Code.Footer>
      </Code.Root>
    </div>
  );
};

const ExampleGame = () => {
  const state = exampleContext.useParts();
  return (
    <div className="w-full rounded-[18px] bg-card p-4 shadow-raised">
      <Maze
        search={state.result?.search}
        isRunning={state.isRunning}
        onBugFound={state.check}
        onShowCode={state.showCode}
      />
    </div>
  );
};

export const Example = {
  Root: ExampleRoot,
  Game: ExampleGame,
  Hint: ExampleHint,
  Source: ExampleSource,
};
