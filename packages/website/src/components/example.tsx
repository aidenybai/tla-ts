import { Fragment, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import { EXAMPLES } from "../example";
import type { RunResult } from "../run-worker";
import { useRun } from "../use-run";
import { CodeActions, CodeContent, CodeCopy, CodeFooter, CodeRoot, CodeRun } from "./code";
import { Button } from "./ui/button";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Verdict } from "./verdict";

interface ExampleState {
  example: (typeof EXAMPLES)[number];
  select: (example: (typeof EXAMPLES)[number]) => void;
  isCompiled: boolean;
  setIsCompiled: (isCompiled: boolean) => void;
  isRunning: boolean;
  hasRun: boolean;
  result: RunResult | undefined;
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
  const request = { source: example.tla.code, config: example.config };
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
        result: isRunning || !isCompiled ? undefined : runner.result,
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
      highlights={state.example.highlights}
      onMorphEnd={state.finishMorph}
    >
      <CodeContent />
      <CodeActions>
        <CodeCopy />
      </CodeActions>
      <CodeFooter>
        <output className="flex min-w-0 flex-1 items-center gap-1.5">
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
