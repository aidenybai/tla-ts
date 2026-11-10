import { useEffect, useRef, useState } from "react";
import type { PrintedSpec } from "./compile-worker";
import type { CompileRequest, CompileResponse } from "./compile-worker";

export interface Compilation {
  // The TypeScript that the spec's regions index into.
  input: string;
  spec: PrintedSpec;
  elapsed: number;
}

interface CompileState {
  compilation: Compilation | undefined;
  finished: string | undefined;
  error: string | undefined;
}

interface Compiler {
  compile: (request: CompileRequest) => void;
  terminate: () => void;
}

// One worker compiles every edit, since TypeScript parses its declaration files once per worker.
// While a compile runs, only the newest edit waits for it.
const createCompiler = (
  onFinish: (request: CompileRequest, response: CompileResponse) => void,
): Compiler => {
  const worker = new Worker(new URL("./compile-worker.ts", import.meta.url), { type: "module" });
  let running: CompileRequest | undefined;
  let waiting: CompileRequest | undefined;
  const send = (request: CompileRequest) => {
    running = request;
    waiting = undefined;
    worker.postMessage(request);
  };
  const finish = (response: CompileResponse) => {
    if (running !== undefined) onFinish(running, response);
    running = undefined;
    if (waiting !== undefined) send(waiting);
  };
  worker.onmessage = (event: MessageEvent<CompileResponse>) => finish(event.data);
  worker.onerror = (event) => finish({ kind: "failed", message: event.message });
  return {
    compile: (request) => {
      if (running === undefined) send(request);
      else waiting = request;
    },
    terminate: () => worker.terminate(),
  };
};

export const useCompile = (source: string, fileName: string) => {
  const [state, setState] = useState<CompileState>({
    compilation: undefined,
    finished: undefined,
    error: undefined,
  });
  const compilerRef = useRef<Compiler | undefined>(undefined);

  useEffect(() => {
    const compiler = createCompiler((request, response) =>
      setState((previous) =>
        response.kind === "compiled"
          ? {
              compilation: {
                input: request.source,
                spec: response.spec,
                elapsed: response.elapsed,
              },
              finished: request.source,
              error: undefined,
            }
          : { ...previous, finished: request.source, error: response.message },
      ),
    );
    compilerRef.current = compiler;
    return compiler.terminate;
  }, []);

  useEffect(() => compilerRef.current?.compile({ source, fileName }), [source, fileName]);

  return {
    compilation: state.compilation,
    error: state.error,
    isCompiling: state.finished !== source,
  };
};
