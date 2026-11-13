import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import type { Compilation } from "../compile-worker";
import { getHighlightColors } from "../highlight-colors";
import { getLineOffsets } from "../line-offsets";
import { createHighlighter } from "../highlighter";
import { PLAYGROUND_EXAMPLES } from "../playground-examples";
import type { RunResult } from "../run-worker";
import type { Mark, Source } from "../site-data";
import { useCompile } from "../use-compile";
import { useIsHydrated } from "../use-is-hydrated";
import { useMediaQuery } from "../use-media-query";
import { useRun } from "../use-run";
import { CodeEditor } from "./code-editor";
import { CodeLine } from "./code-line";
import { Connector } from "./connector";
import { GitHubIcon } from "./github-icon";
import { Logo } from "./logo";
import { RunIcon } from "./run-icon";
import { SearchCell, useSearchPath } from "./search-cell";
import { ThemeMenu } from "./theme-menu";
import { Verdict } from "./verdict";
import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";

interface PlaygroundState {
  fileName: string;
  source: string;
  setSource: (source: string) => void;
  selectExample: (fileName: string) => void;
  compilation: Compilation | undefined;
  tla: Source | undefined;
  sourceMarks: Mark[];
  outputMarks: Mark[];
  outputOffsets: number[];
  colors: Record<string, string>;
  hoveredName: string | undefined;
  setHoveredName: (name: string | undefined) => void;
  error: string | undefined;
  isCompiling: boolean;
  isRunning: boolean;
  result: RunResult | undefined;
  canRun: boolean;
  run: () => void;
}

const NO_MARKS: Mark[] = [];
const subscribeToNothing = () => () => undefined;

const playgroundContext = createPartsContext<PlaygroundState>("Playground.Root");

interface PartProps {
  children: ReactNode;
}

export const PlaygroundRoot = (props: PartProps) => {
  const [file, setFile] = useState(PLAYGROUND_EXAMPLES[0]);
  const compiler = useCompile(file.source, file.fileName);
  const runner = useRun();
  const [highlight, setHighlight] = useState<Awaited<ReturnType<typeof createHighlighter>>>();
  useEffect(() => {
    void createHighlighter().then((nextHighlight) => setHighlight(() => nextHighlight));
  }, []);
  const tlaText = compiler.compilation?.tla;
  const tla = useMemo(
    () => (tlaText === undefined ? undefined : highlight?.(tlaText, "tlaplus")),
    [highlight, tlaText],
  );
  const outputOffsets = useMemo(() => getLineOffsets((tlaText ?? "").split("\n")), [tlaText]);
  const [hoveredName, setHoveredName] = useState<string | undefined>(undefined);
  const isMapped = !compiler.isCompiling && compiler.error === undefined;
  const sourceMarks = (isMapped && compiler.compilation?.sourceMarks) || NO_MARKS;
  const outputMarks = (isMapped && compiler.compilation?.outputMarks) || NO_MARKS;
  const colors = useMemo(
    () => getHighlightColors(outputMarks.map((mark) => mark.name)),
    [outputMarks],
  );
  const edit = (nextFile: typeof file) => {
    runner.stop();
    runner.reset();
    setFile(nextFile);
  };
  const compilation = compiler.compilation;
  const canRun =
    !runner.isRunning && compilation !== undefined && !compiler.isCompiling && !compiler.error;
  const run = () => {
    if (!canRun) return;
    runner.run({
      source: compilation.tla,
      config: compilation.config,
      modules: compilation.modules,
      isSearchShown: true,
    });
  };
  useEffect(() => {
    const runOnShortcut = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      run();
    };
    addEventListener("keydown", runOnShortcut);
    return () => removeEventListener("keydown", runOnShortcut);
  });
  return (
    <playgroundContext.PartsContext
      value={{
        fileName: file.fileName,
        source: file.source,
        setSource: (source) => edit({ fileName: file.fileName, source }),
        selectExample: (fileName) =>
          edit(PLAYGROUND_EXAMPLES.find((example) => example.fileName === fileName) ?? file),
        compilation: compiler.compilation,
        tla,
        sourceMarks,
        outputMarks,
        outputOffsets,
        colors,
        hoveredName,
        setHoveredName,
        error: compiler.error,
        isCompiling: compiler.isCompiling,
        isRunning: runner.isRunning,
        result: compiler.isCompiling || compiler.error ? undefined : runner.result,
        canRun,
        run,
      }}
    >
      <div className="flex h-dvh flex-col text-prose">{props.children}</div>
    </playgroundContext.PartsContext>
  );
};

export const PlaygroundHeader = () => {
  const state = playgroundContext.useParts();
  const shortcut = useSyncExternalStore(
    subscribeToNothing,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘↵" : "Ctrl ↵"),
    () => "⌘↵",
  );
  return (
    <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
      <a href="/" className="-m-2 flex shrink-0 items-center gap-2 p-2 font-medium text-foreground">
        <Logo />
        <span className="max-sm:sr-only">TLA-ts</span>
      </a>
      <span className="text-faint max-sm:hidden">Playground</span>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants(), "min-w-0 text-foreground")}>
            <span className="truncate">{state.fileName}</span>
            <CaretDown className="size-3.5 text-faint" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={state.fileName}
              onValueChange={(fileName) => state.selectExample(String(fileName))}
            >
              {PLAYGROUND_EXAMPLES.map((example) => (
                <DropdownMenuRadioItem key={example.fileName} value={example.fileName}>
                  {example.fileName}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          disabled={!state.canRun}
          variant={state.isRunning ? "outline" : "success"}
          onClick={state.run}
        >
          <RunIcon isRunning={state.isRunning} isDone={false} />
          Run
          <kbd className="font-sans opacity-65 max-sm:hidden pointer-coarse:hidden">{shortcut}</kbd>
        </Button>
      </div>
    </header>
  );
};

interface PaneProps {
  name: string;
  children: ReactNode;
}

const Pane = (props: PaneProps) => (
  <section data-pane={props.name} className="size-full overflow-auto p-4">
    {props.children}
  </section>
);

export const PlaygroundPanes = () => {
  const state = playgroundContext.useParts();
  const isWide = useMediaQuery("(min-width: 48rem)");
  const isHydrated = useIsHydrated();
  const search = state.result?.search;
  const path = useSearchPath(search);
  const outputRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const output = outputRef.current;
    (
      output?.querySelector('[data-state="failing"]') ?? output?.querySelector("[data-state]")
    )?.scrollIntoView({ block: "center" });
  }, [search]);
  const source = (
    <Pane name="source">
      <CodeEditor
        label="TypeScript source"
        value={state.source}
        onChange={state.setSource}
        marks={state.sourceMarks}
        hoveredName={state.hoveredName}
        colors={state.colors}
        onHover={state.setHoveredName}
      />
    </Pane>
  );
  const output = (
    <Pane name="output">
      <code
        ref={outputRef}
        onPointerOver={(event) =>
          state.setHoveredName(
            event.target instanceof HTMLElement ? event.target.dataset.region : undefined,
          )
        }
        onPointerLeave={() => state.setHoveredName(undefined)}
        className={cn(
          "@container block font-mono text-[13px]/[1.7] text-foreground transition-opacity duration-150 ease-out",
          (state.isCompiling || state.error) && "opacity-50",
        )}
      >
        {state.tla?.lines
          .map((tokens, index) => ({ tokens, number: index + 1 }))
          .map((line) => (
            <CodeLine
              key={line.number}
              number={line.number}
              tokens={line.tokens}
              offset={state.outputOffsets[line.number - 1]}
              marks={state.outputMarks}
              hoveredName={state.hoveredName}
              colors={state.colors}
              note={state.result?.notes.find((note) => note.line === line.number)}
              isActive={(path.states.at(0)?.line ?? state.result?.activeLine) === line.number}
              isDimmed={
                path.states.length > 0 &&
                path.states.every((innerState) => innerState.line !== line.number)
              }
              aside={
                search && (
                  <SearchCell
                    search={search}
                    line={line.number}
                    path={path.states}
                    onHover={path.hover}
                    className="max-sm:pl-10"
                  />
                )
              }
              className="-mr-4 -ml-4 pr-4 pl-4"
            />
          ))}
      </code>
    </Pane>
  );
  return (
    <main className="relative min-h-0 flex-1">
      <Connector
        name={state.hoveredName}
        color={state.hoveredName === undefined ? undefined : state.colors[state.hoveredName]}
      />
      {isHydrated ? (
        <ResizablePanelGroup orientation={isWide ? "horizontal" : "vertical"}>
          <ResizablePanel defaultSize="50%" minSize="20%">
            {source}
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="50%" minSize="20%">
            {output}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex size-full max-md:flex-col">
          <div className="min-h-0 min-w-0 flex-1">{source}</div>
          <div className="shrink-0 bg-border max-md:h-px md:w-px" />
          <div className="min-h-0 min-w-0 flex-1">{output}</div>
        </div>
      )}
    </main>
  );
};

export const PlaygroundStatus = () => {
  const state = playgroundContext.useParts();
  return (
    <footer className="flex min-h-11 shrink-0 items-center gap-3 border-t px-4 py-1.5 text-sm">
      <output className="flex min-w-0 flex-1 items-center gap-1.5">
        {state.error ? (
          <span className="text-destructive">{state.error}</span>
        ) : state.isRunning ? (
          <span className="text-faint">Checking</span>
        ) : state.result ? (
          <Verdict result={state.result} />
        ) : (
          state.isCompiling && <span className="text-faint">Compiling</span>
        )}
      </output>
      <a
        href="https://github.com/aidenybai/tla-ts"
        aria-label="GitHub"
        className="-m-2 flex p-2 text-faint transition-colors duration-150 ease-out hover:text-foreground"
      >
        <GitHubIcon />
      </a>
      <ThemeMenu />
    </footer>
  );
};
