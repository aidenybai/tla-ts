import { useEffect, useMemo, useRef, useState } from "react";
import outlines from "virtual:outlines";
import { createPartsContext } from "@/lib/utils";
import { BUILT_OUTPUT_LINES } from "@/lib/compilation";
import { getHighlightColors } from "@/lib/highlight-colors";
import { getLineMarks } from "@/lib/line-marks";
import { getOutputRows, getRunLines, type OutputRow } from "@/lib/output-rows";
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
  // Until the first compilation lands, the output is the outline of what it will hold, in the
  // rows that the build wrote: see getOutline in vite.config.ts.
  const isSkeleton = compiler.tla === undefined && compiler.error === undefined;
  const outlineText = outlines[file.fileName];
  const outline = useMemo(
    () =>
      outlineText === undefined
        ? file.source.split("\n").map((content, index): OutputRow => ({
            kind: "line",
            number: index + 1,
            tokens: [{ content, style: {} }],
          }))
        : outlineText.split("\n").map((row): OutputRow => {
            const [head, ...cells] = row.split("\t");
            if (head === "") return { kind: "comment", text: cells.join("") };
            if (head === "+")
              return { kind: "fold", name: "", lineCount: Number(cells[0]), isOpen: false };
            return {
              kind: "line",
              number: Number(head),
              tokens: cells.map((content) => ({ content, style: {} })),
            };
          }),
    [outlineText, file.source],
  );
  const tlaLines = useMemo(() => (compilation?.tla ?? "").split("\n"), [compilation]);
  const outputLineMarks = useMemo(
    () => getLineMarks(tlaLines, outputMarks),
    [tlaLines, outputMarks],
  );
  // An edit that is still compiling shows the last output without its marks, but keeps its folds.
  const foldLineMarks = useMemo(
    () => getLineMarks(tlaLines, compilation?.outputMarks ?? NO_MARKS),
    [tlaLines, compilation],
  );
  const colors = useMemo(
    () => getHighlightColors(outputMarks.map((mark) => mark.name)),
    [outputMarks],
  );

  const result = compiler.isCompiling || compiler.error ? undefined : runner.result;
  const [openFolds, setOpenFolds] = useState<ReadonlySet<string>>(new Set());
  const pinnedLines = useMemo(() => getRunLines(result), [result]);
  const tla = compiler.tla;
  const outputRows = useMemo(
    () =>
      tla === undefined || compilation === undefined
        ? isSkeleton
          ? outline
          : []
        : getOutputRows({
            lines: tla.lines,
            lineMarks: foldLineMarks,
            source: compilation.source,
            sourceMarks: compilation.sourceMarks,
            openFolds,
            pinnedLines,
          }),
    [tla, compilation, isSkeleton, outline, foldLineMarks, openFolds, pinnedLines],
  );
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
    outputRows: outputRows.slice(0, isHydrated ? undefined : BUILT_OUTPUT_LINES),
    toggleFold: (name: string) => setOpenFolds((open) => open.symmetricDifference(new Set([name]))),
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
