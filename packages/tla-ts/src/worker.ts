// Worker threads as Web Workers, or as Node's worker_threads where there are none.

const WORKER_THREADS_MODULE = "node:worker_threads";

export interface Port {
  postMessage: (message: unknown, transfer?: unknown[]) => void;
  addEventListener: (type: "message", listener: (event: { data: unknown }) => void) => void;
  removeEventListener?: (type: "message", listener: (event: { data: unknown }) => void) => void;
  start?: () => void;
}

export interface WorkerHandle {
  postMessage: (message: unknown, transfer?: unknown[]) => void;
  terminate: () => void;
}

interface WebWorker {
  postMessage: (message: unknown, transfer?: unknown[]) => void;
  addEventListener: (type: string, listener: (event: { data: unknown }) => void) => void;
  terminate: () => void;
}

declare const Worker: new (url: URL, options: { type: "module" }) => WebWorker;

// Whether this runtime runs workers: Web Workers, or Node's.
export const isWorkerSupported = () =>
  typeof Worker === "function" ||
  (typeof process !== "undefined" && process.versions?.node !== undefined);

// Starts the worker at url, which the caller writes as new URL("./name.js", import.meta.url) for
// bundlers to find. onError receives what the worker threw.
export const spawnWorker = async (
  url: URL,
  onMessage: (message: unknown) => void,
  onError: (error: unknown) => void,
): Promise<WorkerHandle> => {
  if (typeof Worker === "function") {
    const worker = new Worker(url, { type: "module" });
    worker.addEventListener("message", (event) => onMessage(event.data));
    worker.addEventListener("error", onError);
    return worker;
  }
  const threads: typeof import("node:worker_threads") = await import(
    /* @vite-ignore */ /* webpackIgnore: true */ WORKER_THREADS_MODULE
  );
  const worker = new threads.Worker(url);
  worker.on("message", onMessage);
  worker.on("error", onError);
  return {
    postMessage: (message, transfer) =>
      worker.postMessage(message, transfer as Parameters<typeof worker.postMessage>[1]),
    terminate: () => void worker.terminate(),
  };
};

// The port a worker receives its messages on and posts its own to.
export const getParentPort = async () => {
  if (typeof (globalThis as { postMessage?: unknown }).postMessage === "function") {
    return globalThis as unknown as Port;
  }
  const threads: typeof import("node:worker_threads") = await import(
    /* @vite-ignore */ /* webpackIgnore: true */ WORKER_THREADS_MODULE
  );
  return threads.parentPort as unknown as Port;
};
