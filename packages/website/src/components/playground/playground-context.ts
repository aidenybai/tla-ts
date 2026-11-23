import { useEffect, useMemo, useRef } from "react";
import outlines from "virtual:outlines";
import { createPartsContext } from "@/lib/utils";
import { BUILT_OUTPUT_LINES } from "@/lib/compilation";
import { getHighlightColors } from "@/lib/highlight-colors";
import { getLineMarks } from "@/lib/line-marks";
import type { Mark } from "@/lib/site-data";
import { useCompile } from "@/hooks/use-compile";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePlaygroundFile } from "@/hooks/use-playground-file";
import { usePlaygroundView } from "@/lib/playground-view";
import { useRun } from "@/hooks/use-run";
import { clearCrashNotes, takeCrashNote } from "@/lib/escore-worker";
import { getErrorResult } from "@/lib/run-error";

const NO_MARKS: Mark[] = [];

export const usePlaygroundState = () => {
  const file = usePlaygroundFile();
  const compiler = useCompile(file.source, file.fileName);
  const runner = useRun(true);

  // A tab that crashed as the worker compiled or checked loads again with the note that the page
  // left, which it shows as the result. A crash fires no pagehide, which leaving the page does.
  useEffect(() => {
    addEventListener("pagehide", clearCrashNotes);
    const crash = takeCrashNote();
    if (crash !== undefined) {
      usePlaygroundView.getState().setIsResultShown(true);
      runner.show(getErrorResult(crash));
    }
    return () => removeEventListener("pagehide", clearCrashNotes);
  }, []);
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

export const playgroundContext =
  createPartsContext<ReturnType<typeof usePlaygroundState>>("Playground.Root");

export const usePlayground = playgroundContext.useParts;
