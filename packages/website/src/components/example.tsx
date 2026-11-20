import { ArrowUpRight } from "@phosphor-icons/react";
import { Fragment, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import { EXAMPLES } from "../example";
import type { RunResult } from "../run-worker";
import type { SearchState } from "../search";
import { useRun } from "../use-run";
import { useSearchPath } from "../use-search-path";
import { StateGraph } from "./state-graph";
import { CodeActions, CodeContent, CodeFooter, CodeRoot, CodeRun } from "./code";
import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button-variants";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
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
  finishMorph: () => void;
}

const exampleContext = createPartsContext<ExampleState>("Example.Root");

interface RootProps {
  children: ReactNode;
}

export const ExampleRoot = (props: RootProps) => {
  const runner = useRun();
  const [example, setExample] = useState(EXAMPLES[0]);
  const [isCompiled, setIsCompiled] = useState(false);
  const [phase, setPhase] = useState<"idle" | "rewinding" | "compiling">("idle");
  const [hasRun, setHasRun] = useState(false);
  const isRunning = phase !== "idle" || runner.isRunning;
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
        run: () => {
          setHasRun(true);
          if (isCompiled && runner.result === undefined) return runner.run(request);
          runner.reset();
          setPhase(isCompiled ? "rewinding" : "compiling");
          setIsCompiled(!isCompiled);
        },
        finishMorph: () => {
          if (phase === "rewinding") {
            setPhase("compiling");
            setIsCompiled(true);
          }
          if (phase === "compiling") {
            setPhase("idle");
            runner.run(request);
          }
        },
      }}
    >
      <div className="relative flex flex-col gap-3">{props.children}</div>
    </exampleContext.PartsContext>
  );
};

export const ExampleDescription = () => {
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

export const ExampleHint = () => {
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

export const ExampleSource = () => {
  const state = exampleContext.useParts();
  return (
    <CodeRoot
      source={state.isCompiled ? state.example.tla : state.example.typescript}
      activeLine={state.result?.activeLine}
      notes={state.result?.notes}
      search={state.result?.search}
      path={state.path}
      onHoverState={state.hoverState}
      highlights={state.example.highlights}
      onMorphEnd={state.finishMorph}
    >
      <CodeContent />
      <CodeActions>
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={`/playground#${new URLSearchParams({ file: state.example.fileName, code: state.example.typescript.code })}`}
                aria-label="View in playground"
                className={cn(buttonVariants({ size: "icon" }))}
              />
            }
          >
            <ArrowUpRight />
          </TooltipTrigger>
          <TooltipContent>View in playground</TooltipContent>
        </Tooltip>
      </CodeActions>
      <CodeFooter>
        <output className="flex min-w-0 flex-1 items-center gap-1.5 max-sm:text-xs">
          <ToggleGroup
            label="Language"
            value={state.isCompiled ? "tla" : "typescript"}
            isDisabled={state.isRunning}
            onValueChange={(value) => state.setIsCompiled(value === "tla")}
            className="mr-1 -ml-1.5 rounded-lg"
          >
            <ToggleGroupItem value="typescript" className={VIEW_ITEM_CLASS_NAME}>
              TypeScript
            </ToggleGroupItem>
            <ToggleGroupItem value="tla" className={VIEW_ITEM_CLASS_NAME}>
              TLA+
            </ToggleGroupItem>
          </ToggleGroup>
          {state.result && <Verdict result={state.result} />}
        </output>
        <CodeRun
          isRunning={state.isRunning}
          isDone={state.result !== undefined}
          onRun={state.run}
        />
      </CodeFooter>
    </CodeRoot>
  );
};

export const ExampleGraph = () => {
  const state = exampleContext.useParts();
  return (
    state.result?.search && (
      <div className="absolute top-10 left-full ml-8 w-60 transition-[opacity,translate] duration-200 ease-out max-xl:hidden starting:opacity-0 motion-safe:starting:-translate-x-2">
        <StateGraph
          search={state.result.search}
          limit={12}
          path={state.path}
          onHover={state.hoverState}
        />
      </div>
    )
  );
};
