const WORKER_THREADS_MODULE = "node:worker_threads";
const V8_MODULE = "node:v8";

// The stack, in MB, of each thread that checks a spec, measured to hold the deepest evaluations
// of Effect's modules on JS.tla with room to spare. Node gives its main thread about 1 MB.
export const CHECK_STACK_MB = 8;
const BUN_JSC_MODULE = "bun:jsc";

interface PortEvent {
  data: unknown;
}

export interface Port {
  postMessage: (message: unknown, transfer?: unknown[]) => void;
  addEventListener: (type: "message", listener: (event: PortEvent) => void) => void;
  removeEventListener?: (type: "message", listener: (event: PortEvent) => void) => void;
  start?: () => void;
}

export interface WorkerHandle {
  postMessage: (message: unknown, transfer?: unknown[]) => void;
  terminate: () => void;
}

interface WebWorker {
  postMessage: (message: unknown, transfer?: unknown[]) => void;
  addEventListener: (type: string, listener: (event: PortEvent) => void) => void;
  terminate: () => void;
}

declare const Worker: new (url: URL, options: { type: "module" }) => WebWorker;

export const isWorkerSupported = () =>
  typeof Worker === "function" ||
  (typeof process !== "undefined" && process.versions?.node !== undefined);

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
  // A worker's heap is its parent's, which a worker would otherwise size by the machine's memory.
  const v8: typeof import("node:v8") = await import(
    /* @vite-ignore */ /* webpackIgnore: true */ V8_MODULE
  );
  const worker = new threads.Worker(url, {
    resourceLimits: {
      stackSizeMb: CHECK_STACK_MB,
      maxOldGenerationSizeMb: Math.floor(v8.getHeapStatistics().heap_size_limit / 2 ** 20),
    },
  });
  worker.on("message", onMessage);
  worker.on("error", onError);
  return {
    postMessage: (message, transfer) =>
      worker.postMessage(message, transfer as Parameters<typeof worker.postMessage>[1]),
    terminate: () => void worker.terminate(),
  };
};

export const getParentPort = async () => {
  if (typeof (globalThis as { postMessage?: unknown }).postMessage === "function") {
    return globalThis as unknown as Port;
  }
  const threads: typeof import("node:worker_threads") = await import(
    /* @vite-ignore */ /* webpackIgnore: true */ WORKER_THREADS_MODULE
  );
  return threads.parentPort as unknown as Port;
};

export const createBreak = () => {
  const jsc: Promise<{ edenGC: () => void }> | undefined =
    "Bun" in globalThis
      ? import(/* @vite-ignore */ /* webpackIgnore: true */ BUN_JSC_MODULE)
      : undefined;
  return async () => {
    (await jsc)?.edenGC();
    await new Promise((resolve) =>
      typeof setImmediate === "function" ? setImmediate(resolve) : setTimeout(resolve, 0),
    );
  };
};
