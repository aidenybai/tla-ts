import { ArrowUpRight, Check, Wrench, X } from "@phosphor-icons/react";
import { Fragment, memo, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import { EXAMPLES } from "../example";
import type { RunResult } from "../run-worker";
import type { SearchState } from "../search";
import type { CompiledExample } from "../site-data";
import { useRun } from "../use-run";
import { useSearchPath } from "../use-search-path";
import { StateGraph } from "./state-graph";
import { CodeActions, CodeContent, CodeFooter, CodeRoot, CodeRun } from "./code";
import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button-variants";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ExampleState {
  example: (typeof EXAMPLES)[number];
  select: (example: (typeof EXAMPLES)[number]) => void;
  source: CompiledExample;
  isFixed: boolean;
  fix: () => void;
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
  const [isFixed, setIsFixed] = useState(false);
  const [isCompiled, setIsCompiled] = useState(false);
  // A run that waits for the code on screen to finish changing.
  const [isRunQueued, setIsRunQueued] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const isRunning = isRunQueued || runner.isRunning;
  const result = isRunning ? undefined : runner.result;
  const [hoveredStateId, setHoveredStateId] = useState<string>();
  const path = useSearchPath(result?.search, hoveredStateId);
  const source = (isFixed && example.fixed) || example;
  const run = () => {
    setHasRun(true);
    setHoveredStateId(undefined);
    runner.run({
      source: source.tla.code,
      config: source.config,
      modules: source.modules,
      lines: isCompiled ? undefined : source.lines,
      isSearchShown: true,
    });
  };
  const change = () => {
    setIsRunQueued(runner.result !== undefined);
    runner.reset();
  };
  return (
    <exampleContext.PartsContext
      value={{
        example,
        select: (nextExample) => {
          setExample(nextExample);
          setIsFixed(false);
          runner.reset();
        },
        source,
        isFixed,
        fix: () => {
          setIsFixed(true);
          change();
        },
        isCompiled,
        setIsCompiled: (nextIsCompiled) => {
          setIsCompiled(nextIsCompiled);
          change();
        },
        isRunning,
        hasRun,
        result,
        path,
        hoverState: setHoveredStateId,
        run,
        finishMorph: () => {
          if (!isRunQueued) return;
          setIsRunQueued(false);
          run();
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
const STEP_DELAY_MS = 80;
const VALUES = /"[^"]*"|\b(?:TRUE|FALSE)\b|-?\b\d+\b|[^"\d\-TF]+|./g;

interface ValueTextProps {
  text: string;
}

const ValueText = memo((props: ValueTextProps) =>
  (props.text.match(VALUES) ?? []).map((value, index) => (
    <span
      key={index}
      className={cn(
        value.startsWith('"') && "text-success",
        /^-?\d/.test(value) && "text-syntax-number",
        /^(TRUE|FALSE)$/.test(value) && "text-syntax-keyword",
      )}
    >
      {value}
    </span>
  )),
);

// What the check found, in the order it happened: each call, and the state it left.
const ExampleSteps = () => {
  const state = exampleContext.useParts();
  const result = state.result;
  if (result === undefined) return null;
  const steps = result.isPassed ? [] : (result.search?.states ?? []);
  return (
    <output className="-mx-4 flex w-[calc(100%+2rem)] flex-col gap-2 border-t px-4 pt-3 pb-1 text-sm transition-opacity duration-200 ease-out starting:opacity-0">
      <span
        className={cn(
          "flex items-center gap-1.5 text-pretty",
          result.isPassed ? "text-success" : "text-destructive",
        )}
      >
        {result.isPassed ? (
          <Check weight="bold" className="shrink-0" />
        ) : (
          <X weight="bold" className="shrink-0" />
        )}
        {result.isPassed
          ? `Checked all ${result.stateCount} states. No order breaks the rule.`
          : result.rule
            ? `${result.rule} breaks after ${steps.length - 1} ${steps.length === 2 ? "step" : "steps"}`
            : result.title}
      </span>
      {steps.length > 0 && (
        <ol className="-mx-2 flex flex-col font-mono text-xs/[1.7]">
          {steps.map((step, index) => (
            <li
              key={step.id}
              onPointerEnter={() => state.hoverState(step.id)}
              onPointerLeave={() => state.hoverState(undefined)}
              style={{ animationDelay: `${index * STEP_DELAY_MS}ms` }}
              className={cn(
                "flex animate-chip-in flex-wrap gap-x-4 rounded-sm px-2 py-0.5 motion-reduce:animate-none",
                step.isFailing ? "bg-destructive/10 text-destructive" : "text-foreground",
                state.path.at(0) === step && !step.isFailing && "bg-muted",
              )}
            >
              <span className="flex min-w-[16ch] gap-[1ch]">
                <span aria-hidden className="text-faint select-none">
                  {index}
                </span>
                {step.call ?? "Start"}
              </span>
              <span className={cn("min-w-0 flex-1", !step.isFailing && "text-muted-foreground")}>
                {step.isFailing ? step.text : <ValueText text={step.change} />}
              </span>
            </li>
          ))}
        </ol>
      )}
      {!result.isPassed && state.example.fixed && !state.isFixed && (
        <Button className="mb-2 self-start text-foreground" onClick={state.fix}>
          <Wrench className="size-3.5" />
          Fix it and check again
        </Button>
      )}
    </output>
  );
};

export const ExampleSource = () => {
  const state = exampleContext.useParts();
  return (
    <CodeRoot
      source={state.isCompiled ? state.source.tla : state.source.typescript}
      activeLine={state.result?.isPassed ? undefined : state.result?.activeLine}
      notes={state.result?.notes}
      path={state.path}
      highlights={state.example.highlights}
      onMorphEnd={state.finishMorph}
    >
      <CodeContent />
      <CodeActions>
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={`/playground#${new URLSearchParams({ file: state.example.fileName, code: state.source.typescript.code })}`}
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
      <ExampleSteps />
      <CodeFooter>
        <ToggleGroup
          label="Language"
          value={state.isCompiled ? "tla" : "typescript"}
          isDisabled={state.isRunning}
          onValueChange={(value) => state.setIsCompiled(value === "tla")}
          className="mr-auto -ml-1.5 rounded-lg"
        >
          <ToggleGroupItem value="typescript" className={VIEW_ITEM_CLASS_NAME}>
            TypeScript
          </ToggleGroupItem>
          <ToggleGroupItem value="tla" className={VIEW_ITEM_CLASS_NAME}>
            TLA+
          </ToggleGroupItem>
        </ToggleGroup>
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
