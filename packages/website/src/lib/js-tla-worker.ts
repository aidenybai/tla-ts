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
export type JsTlaRequest = RunRequest | { compile: CompileRequest };

// What the worker answers: a compile's response, a run's result, or an error that ended whatever
// it was doing.
export type JsTlaResponse = RunResult | { compiled: CompileResponse } | { failed: string };

// The note that the page leaves in the tab's session while the worker compiles or checks a file,
// until the page shows the answer. Chromium runs a worker in its page's renderer, so running out of
// memory, in the page or in the worker, crashes the tab, which keeps the note for the page that
// loads again to show.
type CrashPhase = "compile" | "run";

interface CrashNote {
  fileName: string;
  characters: number;
}

const getCrashKey = (phase: CrashPhase) => `tla-ts:${phase}`;

const leaveCrashNote = (phase: CrashPhase, note: CrashNote) =>
  sessionStorage.setItem(getCrashKey(phase), JSON.stringify(note));

const CRASH_PHASES: CrashPhase[] = ["run", "compile"];

export const clearCrashNote = (phase: CrashPhase) => sessionStorage.removeItem(getCrashKey(phase));

// A page that the visitor leaves, rather than one that crashes, ends what it was doing.
export const clearCrashNotes = () => CRASH_PHASES.forEach(clearCrashNote);

// The message of a crash that a note tells of, the run's before the compile's, which clears both.
export const takeCrashNote = () => {
  const found = CRASH_PHASES.map((phase) => ({
    phase,
    text: sessionStorage.getItem(getCrashKey(phase)),
  })).find((entry) => entry.text !== null);
  clearCrashNotes();
  if (found === undefined || found.text === null) return undefined;
  const note: CrashNote = JSON.parse(found.text);
  return `The tab crashed as tla-ts ${found.phase === "run" ? "checked" : "compiled"} ${note.fileName}, of ${note.characters.toLocaleString()} characters, most likely out of memory`;
};

// One worker compiles and checks, so the page loads TypeScript's compiler, fetches the
// host, and prepares JS.tla's runtime once, and keeps the runtime between runs. A run that the page
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
  started.onmessage = (event: MessageEvent<JsTlaResponse>) => {
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

export const startJsTlaWorker = () => {
  getWorker();
};

export const listenToCompiles = (listener: (response: CompileResponse) => void) => {
  compileListeners.add(listener);
  return () => {
    compileListeners.delete(listener);
  };
};

export const compileOnJsTla = (request: CompileRequest) => {
  lastCompile = request;
  leaveCrashNote("compile", { fileName: request.fileName, characters: request.source.length });
  getWorker().postMessage({ compile: request } satisfies JsTlaRequest);
};

export const runOnJsTla = (request: RunRequest, onResult: (result: RunResult) => void) => {
  runListener = onResult;
  leaveCrashNote("run", {
    fileName: request.typescript?.fileName ?? "the spec",
    characters: (request.typescript?.source ?? request.source).length,
  });
  getWorker().postMessage(request satisfies JsTlaRequest);
};

// Stops a run that the worker is checking, which only ending the worker does.
export const stopJsTlaRun = () => {
  if (runListener === undefined) return;
  runListener = undefined;
  clearCrashNote("run");
  worker?.terminate();
  worker = undefined;
};
