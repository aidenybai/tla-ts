import { useEffect, useRef, useState } from "react";
import { compilations, initial } from "virtual:compilations";
import type { CompileRequest, CompileResponse } from "./compile-worker";

interface CompileState {
  response: CompileResponse | undefined;
  compiled: CompileResponse | undefined;
}

const SLOW_LOAD_MS = 4000;

export const useCompile = (source: string, fileName: string) => {
  const [state, setState] = useState<CompileState>({ response: undefined, compiled: undefined });
  const [precompiled, setPrecompiled] = useState(initial);
  const [isStarted, setIsStarted] = useState(false);
  const workerRef = useRef<Worker | undefined>(undefined);
  // An example that nobody has edited was compiled with the site, so it needs no compiler.
  const built = precompiled.fileName === fileName ? precompiled : undefined;
  const isEdited =
    compilations[fileName] === undefined || (built !== undefined && built.source !== source);

  useEffect(() => {
    if (!isStarted) return;
    const worker = new Worker(new URL("./compile-worker.ts", import.meta.url), { type: "module" });
    const receive = (response: CompileResponse) =>
      setState((previous) => ({
        response,
        compiled: response.compilation ? response : previous.compiled,
      }));
    worker.onmessage = (event: MessageEvent<CompileResponse>) => receive(event.data);
    worker.onerror = (event) => receive({ source: "", fileName: "", error: event.message });
    workerRef.current = worker;
    return () => worker.terminate();
  }, [isStarted]);

  useEffect(() => {
    workerRef.current?.postMessage({ source, fileName } satisfies CompileRequest);
  }, [source, fileName, isStarted]);

  // The compiler is a large download. A page that loaded fast fetches it at once. A slow one
  // waits until it is needed, so the download does not hold up the page or a run.
  useEffect(() => {
    if (isEdited || performance.now() < SLOW_LOAD_MS) setIsStarted(true);
  }, [isEdited]);

  useEffect(() => {
    let isOpen = true;
    void compilations[fileName]?.().then((loaded) => {
      if (isOpen) setPrecompiled(loaded);
    });
    return () => {
      isOpen = false;
    };
  }, [fileName]);

  if (built?.source === source) {
    return {
      compilation: built.compilation,
      tla: built.tla,
      error: undefined,
      isCompiling: false,
      start: () => setIsStarted(true),
    };
  }
  const isCurrent = state.response?.source === source;
  // An edit keeps the last output on screen until its own lands. Another file's does not.
  const compilation =
    state.compiled?.fileName === fileName ? state.compiled.compilation : built?.compilation;
  return {
    compilation,
    tla: compilation === built?.compilation ? built?.tla : undefined,
    error: isCurrent ? state.response?.error : undefined,
    isCompiling: !isCurrent,
    start: () => setIsStarted(true),
  };
};
