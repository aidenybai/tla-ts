import { useEffect, useRef, useState } from "react";
import type { Compilation, CompileRequest, CompileResponse } from "./compile-worker";

interface CompileState {
  response: CompileResponse | undefined;
  compilation: Compilation | undefined;
}

export const useCompile = (source: string, fileName: string) => {
  const [state, setState] = useState<CompileState>({ response: undefined, compilation: undefined });
  const workerRef = useRef<Worker | undefined>(undefined);

  useEffect(() => {
    const worker = new Worker(new URL("./compile-worker.ts", import.meta.url), { type: "module" });
    const receive = (response: CompileResponse) =>
      setState((previous) => ({
        response,
        compilation: response.compilation ?? previous.compilation,
      }));
    worker.onmessage = (event: MessageEvent<CompileResponse>) => receive(event.data);
    worker.onerror = (event) => receive({ source: "", error: event.message });
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({ source, fileName } satisfies CompileRequest);
  }, [source, fileName]);

  const isCurrent = state.response?.source === source;
  return {
    compilation: state.compilation,
    error: isCurrent ? state.response?.error : undefined,
    isCompiling: !isCurrent,
  };
};
