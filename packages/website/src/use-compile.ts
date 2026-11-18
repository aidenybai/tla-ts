import { useEffect, useRef, useState } from "react";
import type { CompileRequest, CompileResponse } from "./compile-worker";

interface CompileState {
  response: CompileResponse | undefined;
  compiled: CompileResponse | undefined;
}

export const useCompile = (source: string, fileName: string) => {
  const [state, setState] = useState<CompileState>({ response: undefined, compiled: undefined });
  const workerRef = useRef<Worker | undefined>(undefined);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({ source, fileName } satisfies CompileRequest);
  }, [source, fileName]);

  const isCurrent = state.response?.source === source;
  return {
    // An edit keeps the last output on screen until its own lands. Another file's does not.
    compilation: state.compiled?.fileName === fileName ? state.compiled.compilation : undefined,
    error: isCurrent ? state.response?.error : undefined,
    isCompiling: !isCurrent,
  };
};
