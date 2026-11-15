import { CaretDown, GearSix } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import type { Compilation } from "../compile-worker";
import { getHighlightColors } from "../highlight-colors";
import { getLineMarks } from "../line-marks";
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
import { Logo } from "./logo";
import { RunIcon } from "./run-icon";
import { Result } from "./parts";
import { Spinner } from "./spinner";
import { getStateNames } from "../search";
import { SearchCell, useSearchPath } from "./search-cell";
import { useTheme } from "./theme-switcher";
import { Verdict } from "./verdict";
import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
  outputLineMarks: Mark[][];
  colors: Record<string, string>;
  hoveredName: string | undefined;
  setHoveredName: (name: string | undefined) => void;
  isArrowsShown: boolean;
  setIsArrowsShown: (isArrowsShown: boolean) => void;
  isResultShown: boolean;
  setIsResultShown: (isResultShown: boolean) => void;
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
  const [hoveredName, setHoveredName] = useState<string | undefined>(undefined);
  const [isArrowsShown, setIsArrowsShown] = useState(true);
  const [isResultShown, setIsResultShown] = useState(false);
  const isMapped = !compiler.isCompiling && compiler.error === undefined;
  const sourceMarks = (isMapped && compiler.compilation?.sourceMarks) || NO_MARKS;
  const outputMarks = (isMapped && compiler.compilation?.outputMarks) || NO_MARKS;
  const outputLineMarks = useMemo(
    () => getLineMarks((tlaText ?? "").split("\n"), outputMarks),
    [tlaText, outputMarks],
  );
  const colors = useMemo(
    () => getHighlightColors(outputMarks.map((mark) => mark.name)),
    [outputMarks],
  );
  const edit = (nextFile: typeof file) => {
    runner.stop();
    runner.reset();
    setFile(nextFile);
  };
  useEffect(() => {
    const shared = new URLSearchParams(location.hash.slice(1));
    const fileName = shared.get("file") ?? "example.ts";
    const source =
      shared.get("code") ??
      PLAYGROUND_EXAMPLES.find((example) => example.fileName === fileName)?.source;
    if (source !== undefined) setFile({ fileName, source });
  }, []);
  const compilation = compiler.compilation;
  const canRun =
    !runner.isRunning && compilation !== undefined && !compiler.isCompiling && !compiler.error;
  const run = () => {
    if (!canRun) return;
    setIsResultShown(true);
    runner.run({
      source: compilation.tla,
      config: compilation.config,
      modules: compilation.modules,
      isSearchShown: true,
    });
  };
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || (event.key !== "Enter" && event.key !== "b")) return;
      event.preventDefault();
      if (event.key === "Enter") run();
      else setIsResultShown(!isResultShown);
    };
    addEventListener("keydown", handleShortcut);
    return () => removeEventListener("keydown", handleShortcut);
  });
  return (
    <playgroundContext.PartsContext
      value={{
        fileName: file.fileName,
        source: file.source,
        setSource: (source) => edit({ fileName: file.fileName, source }),
        selectExample: (fileName) => {
          history.replaceState(null, "", `#${new URLSearchParams({ file: fileName })}`);
          edit(PLAYGROUND_EXAMPLES.find((example) => example.fileName === fileName) ?? file);
        },
        compilation: compiler.compilation,
        tla,
        sourceMarks,
        outputMarks,
        outputLineMarks,
        colors,
        hoveredName,
        setHoveredName,
        isArrowsShown,
        setIsArrowsShown,
        isResultShown,
        setIsResultShown,
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
  const theme = useTheme();
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
          <DropdownMenuTrigger
            aria-label="Settings"
            className={cn(buttonVariants({ size: "icon" }))}
          >
            <GearSix />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => state.setIsArrowsShown(!state.isArrowsShown)}
              className="max-md:hidden"
            >
              {state.isArrowsShown ? "Hide arrows" : "Show arrows"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="max-md:hidden" />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={theme.theme} onValueChange={theme.setTheme}>
                <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants(), "min-w-0 shrink text-foreground")}>
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
          data-run
          disabled={!state.canRun && !state.isRunning}
          aria-disabled={state.isRunning}
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
  <section
    data-pane={props.name}
    translate="no"
    className="size-full overflow-auto overscroll-contain p-4"
  >
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
        isHighlighted={state.isArrowsShown && isWide}
        focusedNames={path.states.flatMap(getStateNames)}
        colors={state.colors}
        onHover={state.setHoveredName}
      />
    </Pane>
  );
  const output = (
    <Pane name="output">
      {state.tla === undefined && state.error === undefined && (
        <div
          role="status"
          aria-label="Compiling"
          className="flex size-full items-center justify-center text-faint transition-opacity delay-150 duration-150 ease-out starting:opacity-0"
        >
          <Spinner className="size-5" />
        </div>
      )}
      {state.error && (
        <p role="alert" className="mb-3 text-sm break-words text-destructive">
          {state.error}
        </p>
      )}
      <code
        ref={outputRef}
        onPointerOver={(event) =>
          state.setHoveredName(
            event.target instanceof HTMLElement ? event.target.dataset.region : undefined,
          )
        }
        onPointerLeave={() => state.setHoveredName(undefined)}
        className={cn(
          "@container block font-mono text-[13px]/[1.7] text-foreground pointer-coarse:text-[16px]/[1.7] transition-opacity duration-150 ease-out",
          (state.isCompiling || state.error) && "opacity-50 delay-200",
        )}
      >
        {state.tla?.lines
          .map((tokens, index) => ({ tokens, number: index + 1 }))
          .map((line) => (
            <CodeLine
              key={line.number}
              number={line.number}
              tokens={line.tokens}
              marks={state.outputLineMarks[line.number - 1]}
              hoveredName={state.hoveredName}
              isHighlighted={state.isArrowsShown && isWide}
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
    <main className="relative min-h-0 flex-1 overflow-hidden">
      <Result.Root isOpen={state.isResultShown && (state.isRunning || state.result !== undefined)}>
        <Result.Header
          onClose={() => {
            state.setIsResultShown(false);
            document.querySelector<HTMLElement>("[data-run]")?.focus({ preventScroll: true });
          }}
        />
        <Result.Body>
          {state.isRunning ? (
            <span className="flex items-center gap-2 text-faint">
              <Spinner />
              Checking…
            </span>
          ) : (
            state.result && (
              <>
                <Result.Section title={state.result.isPassed ? "Verdict" : "Issue"}>
                  <Verdict result={state.result} />
                </Result.Section>
                {search && search.listedStates.length > 0 && (
                  <Result.Section
                    title={state.result.isPassed ? "States" : "Steps to the failing state"}
                    count={search.listedStates.length}
                    className="min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]"
                  >
                    <Result.States
                      states={search.listedStates}
                      hoveredState={path.states.at(0)}
                      onHover={path.hover}
                      onSelect={(selected) => {
                        const main = outputRef.current?.closest("main");
                        const name = getStateNames(selected).at(0) ?? "";
                        for (const target of [
                          main?.querySelector(
                            `[data-pane="source"] [data-region="${CSS.escape(name)}"]`,
                          ),
                          main?.querySelector(
                            `[data-pane="output"] [data-line="${selected.line}"]`,
                          ),
                        ])
                          target?.scrollIntoView({ block: "center", inline: "nearest" });
                        if (!isWide) state.setIsResultShown(false);
                      }}
                    />
                  </Result.Section>
                )}
              </>
            )
          )}
        </Result.Body>
      </Result.Root>
      <Connector
        names={
          state.isArrowsShown
            ? Object.keys(state.colors)
            : state.hoveredName === undefined
              ? []
              : [state.hoveredName]
        }
        hoveredName={state.hoveredName}
        colors={state.colors}
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
