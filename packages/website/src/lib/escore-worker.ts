import type { Compilation } from "./compilation";
import { getErrorResult } from "./run-error";
import type { RunRequest, RunResult } from "./run-worker";

export interface CompileRequest {
  source: string;
  fileName: string;
}

export interface CompileResponse {
  source: string;
  fileName: string;
  compilation?: Compilation;
  error?: string;
}

// What the page asks the worker, which compiles as well as checks.
export type EscoreRequest = RunRequest | { compile: CompileRequest };

// What the worker answers: a compile's response, or a run's result.
export type EscoreResponse = RunResult | { compiled: CompileResponse };

// One worker compiles and checks, so the page loads TypeScript's compiler, fetches the
// host, and prepares ESCore's runtime once, and keeps the runtime between runs. A run that the page
// stops ends the worker, and the next request starts another.
let worker: Worker | undefined;
const compileListeners = new Set<(response: CompileResponse) => void>();
let runListener: ((result: RunResult) => void) | undefined;

const getWorker = () => {
  if (worker !== undefined) return worker;
  const started = new Worker(new URL("./run-worker.ts", import.meta.url), { type: "module" });
  started.onmessage = (event: MessageEvent<EscoreResponse>) => {
    if ("compiled" in event.data) {
      const compiled = event.data.compiled;
      compileListeners.forEach((listener) => listener(compiled));
      return;
    }
    const listener = runListener;
    runListener = undefined;
    listener?.(event.data);
  };
  started.onerror = (event) => {
    compileListeners.forEach((listener) =>
      listener({ source: "", fileName: "", error: event.message }),
    );
    const listener = runListener;
    runListener = undefined;
    listener?.(getErrorResult(event.message));
  };
  worker = started;
  return started;
};

export const startEscoreWorker = () => {
  getWorker();
};

export const listenToCompiles = (listener: (response: CompileResponse) => void) => {
  compileListeners.add(listener);
  return () => {
    compileListeners.delete(listener);
  };
};

export const compileOnEscore = (request: CompileRequest) =>
  getWorker().postMessage({ compile: request } satisfies EscoreRequest);

export const runOnEscore = (request: RunRequest, onResult: (result: RunResult) => void) => {
  runListener = onResult;
  getWorker().postMessage(request satisfies EscoreRequest);
};

// Stops a run that the worker is checking, which only ending the worker does.
export const stopEscoreRun = () => {
  if (runListener === undefined) return;
  runListener = undefined;
  worker?.terminate();
  worker = undefined;
};
