import { createCanonicalizer } from "./canonical";
import {
  checkSequentially,
  createSearch,
  findAssumptionViolation,
  type CheckOptions,
  type CheckResult,
} from "./check";
import { parseConfig, type ModelConfig } from "./config";
import { createEnvironment } from "./environment";
import { isImpure } from "./evaluate";
import { createFingerprintTable, getFingerprintOwner, getStateFingerprint } from "./fingerprints";
import { getInitialStates } from "./successors";
import { getTlcStringOrder, getTlcVariableOrder } from "./tlc-order";
import { createStateEncoder, type EncodedStates } from "./transfer";
import { getRankedStringCount, setStringOrder } from "./values";

const WORKER_THREADS_MODULE = "node:worker_threads";

export interface Port {
  postMessage: (message: unknown, transfer?: unknown[]) => void;
  addEventListener: (type: "message", listener: (event: { data: unknown }) => void) => void;
  removeEventListener?: (type: "message", listener: (event: { data: unknown }) => void) => void;
  start?: () => void;
}

export interface StartMessage {
  type: "start";
  source: string;
  config: ModelConfig;
  modules: [string, string | undefined][];
  classes: [string, Uint8Array | undefined][];
  index: number;
  count: number;
  ports: (Port | undefined)[];
  seed: EncodedStates;
  seedFingerprints: Int32Array;
}

export interface LevelMessage {
  type: "level";
  level: number;
  generated: number;
  added: number;
}

export type WorkerMessage = { type: "ready" } | { type: "abort" } | LevelMessage;

interface WorkerHandle {
  postMessage: (message: unknown, transfer?: unknown[]) => void;
  terminate: () => void;
}

interface WebWorker {
  postMessage: (message: unknown, transfer?: unknown[]) => void;
  addEventListener: (type: string, listener: (event: { data: unknown }) => void) => void;
  terminate: () => void;
}

declare const Worker: new (url: URL, options: { type: "module" }) => WebWorker;

const spawnWorker = async (onMessage: (message: WorkerMessage) => void): Promise<WorkerHandle> => {
  if (typeof Worker === "function") {
    const worker = new Worker(new URL("./parallel-worker.js", import.meta.url), { type: "module" });
    worker.addEventListener("message", (event) => onMessage(event.data as WorkerMessage));
    worker.addEventListener("error", () => onMessage({ type: "abort" }));
    return worker;
  }
  const threads: typeof import("node:worker_threads") = await import(
    /* @vite-ignore */ /* webpackIgnore: true */ WORKER_THREADS_MODULE
  );
  const worker = new threads.Worker(new URL("./parallel-worker.js", import.meta.url));
  worker.on("message", (message: WorkerMessage) => onMessage(message));
  worker.on("error", () => onMessage({ type: "abort" }));
  return {
    postMessage: (message, transfer) =>
      worker.postMessage(message, transfer as Parameters<typeof worker.postMessage>[1]),
    terminate: () => void worker.terminate(),
  };
};

export const check = async (options: CheckOptions): Promise<CheckResult> => {
  const config = typeof options.config === "string" ? parseConfig(options.config) : options.config;
  const fallBack = () => checkSequentially({ ...options, config });
  const count = options.workers ?? 1;
  const isSequential =
    count < 2 ||
    config.view !== undefined ||
    config.postconditions.length > 0 ||
    config.possible.length > 0;
  if (isSequential) return fallBack();
  const modules = new Map<string, string | undefined>();
  const loadModule = (name: string) => {
    const source = options.loadModule?.(name);
    modules.set(name, source);
    return source;
  };
  const classes = new Map<string, Uint8Array | undefined>();
  const loadClass = (name: string) => {
    const bytes = options.loadClass?.(name);
    classes.set(name, bytes);
    return bytes;
  };
  setStringOrder(getTlcStringOrder(options.source, config, loadModule));
  const startupStrings = getRankedStringCount();
  const specification = createEnvironment(config, {
    source: options.source,
    loadModule,
    loadClass,
    print: options.onPrint ?? console.log,
    files: { readFile: options.readFile, writeFile: options.writeFile },
  });
  const environment = specification.environment;
  if (findAssumptionViolation(specification.assumptions, environment)) return fallBack();
  const search = createSearch(config, environment, () =>
    getTlcVariableOrder(options.source, loadModule),
  );
  if (
    !search ||
    search.spec.init === undefined ||
    search.spec.next === undefined ||
    search.properties.liveness.length > 0 ||
    isImpure(environment)
  ) {
    return fallBack();
  }

  const canonicalize = createCanonicalizer();
  const table = createFingerprintTable();
  const fingerprint = new Int32Array(2);
  const seeds = Array.from({ length: count }, () => ({
    encoder: createStateEncoder(),
    fingerprints: [] as number[],
  }));
  const statistics = { generatedStates: 0, distinctStates: 0, depth: 0 };
  for (const state of getInitialStates(search.spec.init, environment, search.spec.scope)) {
    canonicalize(state);
    statistics.generatedStates++;
    getStateFingerprint(search.getFingerprintState(state), fingerprint);
    if (!table.insert(fingerprint[0], fingerprint[1])) continue;
    if (search.findViolatedInvariant(state) || search.findFailedInitialPredicate(state)) {
      return fallBack();
    }
    if (!search.satisfiesConstraints(state)) {
      table.remove(fingerprint[0], fingerprint[1]);
      continue;
    }
    const seed = seeds[getFingerprintOwner(fingerprint[1], count)];
    if (!seed.encoder.encode(state)) return fallBack();
    seed.fingerprints.push(fingerprint[0], fingerprint[1]);
    statistics.distinctStates++;
  }
  if (getRankedStringCount() !== startupStrings) return fallBack();
  statistics.depth = statistics.generatedStates === 0 ? 0 : 1;
  if (statistics.distinctStates === 0)
    return { status: "success", violation: undefined, ...statistics };

  const reports: WorkerMessage[] = [];
  const pending = { resolve: (_: WorkerMessage[]) => {} };
  const onMessage = (message: WorkerMessage) => {
    reports.push(message);
    if (message.type === "abort" || reports.length === count) {
      pending.resolve(reports.splice(0));
    }
  };
  const waitForReports = () =>
    new Promise<WorkerMessage[]>((resolve) => {
      pending.resolve = resolve;
    });
  const ready = waitForReports();
  const workers = await Promise.all(Array.from({ length: count }, () => spawnWorker(onMessage)));
  const terminate = () => workers.forEach((worker) => worker.terminate());
  const channels = new Map<string, MessageChannel>();
  const getPort = (from: number, to: number): Port => {
    const key = from < to ? `${from}:${to}` : `${to}:${from}`;
    const channel = channels.get(key) ?? new MessageChannel();
    channels.set(key, channel);
    return (from < to ? channel.port1 : channel.port2) as unknown as Port;
  };
  workers.forEach((worker, index) => {
    const ports = Array.from({ length: count }, (_, peer) =>
      peer === index ? undefined : getPort(index, peer),
    );
    const seed = seeds[index].encoder.finish();
    const seedFingerprints = Int32Array.from(seeds[index].fingerprints);
    const message: StartMessage = {
      type: "start",
      source: options.source,
      config,
      modules: [...modules],
      classes: [...classes],
      index,
      count,
      ports,
      seed,
      seedFingerprints,
    };
    worker.postMessage(message, [
      ...ports.filter((port) => port !== undefined),
      seed.words.buffer,
      seedFingerprints.buffer,
    ]);
  });
  const isAborted = (messages: WorkerMessage[]) =>
    messages.some((message) => message.type === "abort");
  if (isAborted(await ready)) {
    terminate();
    return fallBack();
  }
  for (let level = 1; ; level++) {
    const reported = waitForReports();
    workers.forEach((worker) => worker.postMessage({ type: "level", level }));
    const messages = await reported;
    if (isAborted(messages)) {
      terminate();
      return fallBack();
    }
    const levels = messages.flatMap((message) => (message.type === "level" ? [message] : []));
    const added = levels.reduce((sum, message) => sum + message.added, 0);
    statistics.generatedStates += levels.reduce((sum, message) => sum + message.generated, 0);
    statistics.distinctStates += added;
    if (added === 0) {
      terminate();
      return { status: "success", violation: undefined, ...statistics };
    }
    statistics.depth++;
  }
};
