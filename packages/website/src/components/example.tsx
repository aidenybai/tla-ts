import { ArrowUpRight } from "@phosphor-icons/react";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import { EXAMPLES } from "@/lib/examples";
import { getHighlightColors } from "@/lib/highlight-colors";
import { getLineMarks } from "@/lib/line-marks";
import { getOutputRows, getRunLines } from "@/lib/output-rows";
import type { RunResult } from "@/lib/run-worker";
import type { SearchState } from "@/lib/search";
import { useRun } from "@/hooks/use-run";
import { useSearchPath } from "@/hooks/use-search-path";
import { StateGraph } from "./state-graph";
import { Code } from "./code";
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
const PREVIEW_LINES = 28;

const ExampleSource = () => {
  const state = exampleContext.useParts();
  const example = state.example;
  const [openFolds, setOpenFolds] = useState<ReadonlySet<string>>(new Set());
  // Each declaration is marked on the model's line for it: a function on its action or check, and
  // any other on Init. The definitions it compiles to fold away with the rest of ESCore's code.
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
  return (
    <Code.Root
      source={state.isCompiled ? example.tla : example.typescript}
      rows={state.isCompiled ? rows : undefined}
      limit={PREVIEW_LINES}
      onToggleFold={(name) => setOpenFolds((open) => open.symmetricDifference(new Set([name])))}
      lineMarks={state.isCompiled ? lineMarks : sourceLineMarks}
      colors={colors}
      activeLine={result?.activeLine}
      notes={result?.notes}
      search={result?.search}
      path={state.path}
      onHoverState={state.hoverState}
    >
      {/* A new example is other code, not this code in another language, so it does not morph. */}
      <Code.Content key={example.fileName} />
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
      <Code.Footer>
        <output className="flex min-w-0 flex-1 items-center gap-1.5 max-sm:text-xs">
          {/* A new example starts on its TypeScript, which the toggle shows without sliding there. */}
          <ToggleGroup.Root
            key={state.example.fileName}
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
      <div className="absolute top-10 left-full ml-8 w-60 transition-[opacity,translate] duration-200 ease-out max-xl:hidden starting:opacity-0 motion-safe:starting:-translate-x-2">
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
