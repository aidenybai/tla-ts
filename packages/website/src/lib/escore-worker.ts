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

// What the worker answers: a compile's response, a run's result, or an error that ended whatever
// it was doing.
export type EscoreResponse = RunResult | { compiled: CompileResponse } | { failed: string };

// One worker compiles and checks, so the page loads TypeScript's compiler, fetches the
// host, and prepares ESCore's runtime once, and keeps the runtime between runs. A run that the page
// stops ends the worker, and the next request starts another.
let worker: Worker | undefined;
const compileListeners = new Set<(response: CompileResponse) => void>();
let runListener: ((result: RunResult) => void) | undefined;
// The file that the page last asked the worker to compile, whose compile an error ends.
let lastCompile: CompileRequest | undefined;

// Ends what the page waits for with an error's message: the last compile and the run.
const fail = (message: string) => {
  compileListeners.forEach((listener) =>
    listener({
      source: lastCompile?.source ?? "",
      fileName: lastCompile?.fileName ?? "",
      error: message,
    }),
  );
  const listener = runListener;
  runListener = undefined;
  listener?.(getErrorResult(message));
};

const getWorker = () => {
  if (worker !== undefined) return worker;
  const started = new Worker(new URL("./run-worker.ts", import.meta.url), { type: "module" });
  started.onmessage = (event: MessageEvent<EscoreResponse>) => {
    if ("failed" in event.data) {
      fail(event.data.failed);
      return;
    }
    if ("compiled" in event.data) {
      const compiled = event.data.compiled;
      compileListeners.forEach((listener) => listener(compiled));
      return;
    }
    const listener = runListener;
    runListener = undefined;
    listener?.(event.data);
  };
  started.onerror = (event) => fail(event.message);
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

export const compileOnEscore = (request: CompileRequest) => {
  lastCompile = request;
  getWorker().postMessage({ compile: request } satisfies EscoreRequest);
};

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
