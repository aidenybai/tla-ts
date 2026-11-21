import { useEffect, useMemo, useRef, useState } from "react";
import { compilations, initial } from "virtual:compilations";
import {
  type CompileRequest,
  type CompileResponse,
  compileOnEscore,
  listenToCompiles,
} from "@/lib/escore-worker";
import type { createHighlighter } from "@/lib/highlighter";

interface CompileState {
  response: CompileResponse | undefined;
  compiled: CompileResponse | undefined;
}

const SLOW_LOAD_MS = 4000;

// Compiles a file to TLA+ and highlights both. An example that nobody has edited was compiled and
// highlighted with the site, so it needs neither the compiler nor the highlighter.
export const useCompile = (source: string, fileName: string) => {
  const [state, setState] = useState<CompileState>({ response: undefined, compiled: undefined });
  const [precompiled, setPrecompiled] = useState(() => new Map([[initial.fileName, initial]]));
  const [isStarted, setIsStarted] = useState(false);
  const [highlight, setHighlight] = useState<Awaited<ReturnType<typeof createHighlighter>>>();
  const workerRef = useRef<Pick<Worker, "postMessage"> | undefined>(undefined);
  const built = precompiled.get(fileName);
  const isEdited =
    compilations[fileName] === undefined || (built !== undefined && built.source !== source);

  useEffect(() => {
    if (!isStarted) return;
    const receive = (response: CompileResponse) =>
      setState((previous) => ({
        response,
        compiled: response.compilation ? response : previous.compiled,
      }));
    // The worker that checks compiles too.
    workerRef.current = { postMessage: compileOnEscore };
    void import("@/lib/highlighter")
      .then((loaded) => loaded.createHighlighter())
      .then((nextHighlight) => setHighlight(() => nextHighlight));
    return listenToCompiles(receive);
  }, [isStarted]);

  const isBuilt = built?.source === source;
  // A file that the site built needs no compile.
  useEffect(() => {
    if (!isBuilt) workerRef.current?.postMessage({ source, fileName } satisfies CompileRequest);
  }, [source, fileName, isStarted, isBuilt]);

  // The compiler and the highlighter are large downloads. A page that loaded fast fetches them
  // at once. A slow one waits until they are needed, so they do not hold up the page or a run.
  useEffect(() => {
    if (isEdited || performance.now() < SLOW_LOAD_MS) setIsStarted(true);
  }, [isEdited]);

  useEffect(() => {
    void compilations[fileName]?.().then((loaded) =>
      setPrecompiled((previous) => new Map(previous).set(loaded.fileName, loaded)),
    );
  }, [fileName]);

  // An edit keeps the last output on screen until its own lands. Another file's does not.
  const compilation =
    !isBuilt && state.compiled?.fileName === fileName
      ? state.compiled.compilation
      : built?.compilation;
  const tokens = useMemo(
    () =>
      (isBuilt ? built?.typescript : undefined) ??
      highlight?.(source, "typescript").lines ??
      source.split("\n").map((content) => [{ content, style: {} }]),
    [isBuilt, built, highlight, source],
  );
  const tla = useMemo(
    () =>
      compilation === built?.compilation
        ? built?.tla
        : compilation && highlight?.(compilation.tla, "tlaplus"),
    [compilation, built, highlight],
  );
  return {
    tokens,
    compilation,
    tla,
    error: !isBuilt && state.response?.source === source ? state.response.error : undefined,
    isCompiling: !isBuilt && state.response?.source !== source,
    start: () => setIsStarted(true),
  };
};
