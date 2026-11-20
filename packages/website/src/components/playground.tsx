import { useEffect, useMemo, useRef, type ReactNode } from "react";
import outlines from "virtual:outlines";
import { createPartsContext } from "@/lib/utils";
import { BUILT_OUTPUT_LINES } from "../compilation";
import { getHighlightColors } from "../highlight-colors";
import { getLineMarks } from "../line-marks";
import type { Mark } from "../site-data";
import { useCompile } from "../use-compile";
import { useIsHydrated } from "../use-is-hydrated";
import { useMediaQuery } from "../use-media-query";
import { usePlaygroundFile } from "../use-playground-file";
import { usePlaygroundView } from "../playground-view";
import { useRun } from "../use-run";

const NO_MARKS: Mark[] = [];

// Runs as the page is parsed, before React loads. The page is built with one file, so a link to
// another hides the built one.
const SHARED_SCRIPT = `if (/[#&](file|code)=/.test(location.hash)) document.documentElement.dataset.shared = "";`;

const usePlaygroundState = () => {
  const file = usePlaygroundFile();
  const compiler = useCompile(file.source, file.fileName);
  const runner = useRun(true);
  const isWide = useMediaQuery("(min-width: 48rem)");
  const workspaceRef = useRef<HTMLElement>(null);
  const runButtonRef = useRef<HTMLButtonElement>(null);
  const isHydrated = useIsHydrated();

  const compilation = compiler.compilation;
  const isMapped = !compiler.isCompiling && compiler.error === undefined;
  const sourceMarks = (isMapped && compilation?.sourceMarks) || NO_MARKS;
  const outputMarks = (isMapped && compilation?.outputMarks) || NO_MARKS;
  // Until the first compilation lands, the output is the outline of what it will hold.
  const isSkeleton = compiler.tla === undefined && compiler.error === undefined;
  const outlineText = outlines[file.fileName] ?? file.source;
  const outline = useMemo(
    () =>
      outlineText
        .split("\n")
        .map((line) => line.split("\t").map((content) => ({ content, style: {} }))),
    [outlineText],
  );
  const outputLineMarks = useMemo(
    () => getLineMarks((compilation?.tla ?? outlineText).split("\n"), outputMarks),
    [compilation, outlineText, outputMarks],
  );
  const colors = useMemo(
    () => getHighlightColors(outputMarks.map((mark) => mark.name)),
    [outputMarks],
  );

  const result = compiler.isCompiling || compiler.error ? undefined : runner.result;
  const canRun =
    !runner.isRunning && compilation !== undefined && !compiler.isCompiling && !compiler.error;
  const run = () => {
    if (!canRun) return;
    usePlaygroundView.getState().setIsResultShown(true);
    runner.run({
      source: compilation.tla,
      config: compilation.config,
      modules: compilation.modules,
      isSearchShown: true,
      typescript: { source: file.source, fileName: file.fileName },
    });
  };
  const discardRun = () => {
    runner.stop();
    runner.reset();
  };
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || (event.key !== "Enter" && event.key !== "b")) return;
      event.preventDefault();
      if (event.key === "Enter") run();
      else usePlaygroundView.setState((view) => ({ isResultShown: !view.isResultShown }));
    };
    addEventListener("keydown", handleShortcut);
    return () => removeEventListener("keydown", handleShortcut);
  });

  return {
    fileName: file.fileName,
    source: file.source,
    sourceTokens: compiler.tokens,
    sourceMarks,
    setSource: (source: string) => {
      discardRun();
      file.edit(source);
    },
    selectExample: (fileName: string) => {
      discardRun();
      file.select(fileName);
    },
    startCompiler: compiler.start,
    isSkeleton,
    outputLines: (compiler.tla?.lines ?? (isSkeleton ? outline : [])).slice(
      0,
      isHydrated ? undefined : BUILT_OUTPUT_LINES,
    ),
    outputLineMarks,
    isOutputStale: compiler.tla !== undefined && (compiler.isCompiling || Boolean(compiler.error)),
    error: compiler.error,
    colors,
    isWide,
    isRunning: runner.isRunning,
    result,
    canRun,
    run,
    workspaceRef,
    runButtonRef,
  };
};

const playgroundContext =
  createPartsContext<ReturnType<typeof usePlaygroundState>>("Playground.Root");

export const usePlayground = playgroundContext.useParts;

interface PartProps {
  children: ReactNode;
}

export const PlaygroundRoot = (props: PartProps) => {
  const isHydrated = useIsHydrated();
  return (
    <playgroundContext.PartsContext value={usePlaygroundState()}>
      <div className="flex h-dvh flex-col text-prose">
        {!isHydrated && <script dangerouslySetInnerHTML={{ __html: SHARED_SCRIPT }} />}
        {props.children}
      </div>
    </playgroundContext.PartsContext>
  );
};

export const PlaygroundWorkspace = (props: PartProps) => {
  const playground = usePlayground();
  const isHoveringName = usePlaygroundView((view) => view.hoveredName !== undefined);
  return (
    <main
      ref={playground.workspaceRef}
      data-hovering-name={isHoveringName ? "" : undefined}
      className="relative min-h-0 flex-1 overflow-hidden"
    >
      {props.children}
    </main>
  );
};
