import type { Expression } from "./ast";
import { createCanonicalizer } from "./canonical";
import {
  checkSequentially,
  createSearch,
  findAssumptionViolation,
  reportInitialStatesProgress,
  reportStartup,
  reportStateLevelProperties,
  type CheckOptions,
  type CheckProgress,
  type CheckResult,
  type InitialStates,
} from "./check";
import { parseConfig, type ModelConfig } from "./config";
import { createEnvironment } from "./environment";
import { TlaEvaluationError } from "./errors";
import { isImpure } from "./evaluate";
import {
  createSharedFingerprints,
  growSharedFingerprints,
  insertSharedFingerprint,
  isSharedFingerprintsFull,
  writeStateFingerprint,
  type SharedFingerprints,
} from "./fingerprints";
import { getInitialStates } from "./successors";
import { getTlcStringOrder, getTlcVariableOrder } from "./tlc-order";
import { getFingerprintDistance, OUT_DEGREE_BUCKETS } from "./tlc-summary";
import { createStateEncoder, type EncodedStates } from "./transfer";
import { getRankedStringCount, setStringOrder, type Value } from "./values";

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
  ports: (Port | undefined)[];
  seed: EncodedStates;
  isTool: boolean | undefined;
  isTraceRecorded: boolean | undefined;
  isWarningEnabled: boolean | undefined;
  fingerprints: SharedFingerprints;
  requests: Int32Array;
  remaining: Int32Array;
}

export interface LevelMessage {
  type: "level";
  level: number;
  generated: number;
  added: number;
  outDegrees: number[];
  fingerprints: BigInt64Array;
}

export type WorkerMessage =
  | { type: "ready" }
  | { type: "abort" }
  | { type: "paused" }
  | LevelMessage;

export type CoordinatorMessage =
  | { type: "level"; level: number }
  | { type: "resize"; fingerprints: SharedFingerprints };

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
  worker.on("message", onMessage);
  worker.on("error", () => onMessage({ type: "abort" }));
  return {
    postMessage: (message, transfer) =>
      worker.postMessage(message, transfer as Parameters<typeof worker.postMessage>[1]),
    terminate: () => void worker.terminate(),
  };
};

export const check = async (options: CheckOptions): Promise<CheckResult> => {
  const config =
    typeof options.config === "string"
      ? parseConfig(options.config, options.version)
      : options.config;
  const print = options.onPrint ?? console.log;
  const printed = { count: 0 };
  // What each point the search reports is about, such as the invariant TLC warns about.
  const getKey = (progress: CheckProgress) =>
    [
      progress.kind,
      "name" in progress ? progress.name : "",
      "count" in progress ? progress.count : "",
      "text" in progress ? progress.text : "",
    ].join(" ");
  const reported = new Set<string>();
  const report = (progress: CheckProgress) => {
    reported.add(getKey(progress));
    options.onProgress?.(progress);
  };
  // The search on the calling thread prints and reports what this one did while it started, so it
  // skips that.
  const fallBack = () => {
    const skipped = { count: printed.count };
    return checkSequentially({
      ...options,
      config,
      onPrint: (text) => (skipped.count-- > 0 ? undefined : print(text)),
      onProgress: (progress) => {
        if (!reported.has(getKey(progress))) options.onProgress?.(progress);
      },
    });
  };
  const count = options.workers ?? 1;
  // TLC's workers write the -dump state graph in whichever order they find it, so one worker
  // writes the graph a single TLC worker does.
  const isSequential =
    count < 2 ||
    typeof SharedArrayBuffer !== "function" ||
    options.dump !== undefined ||
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
    print: (text) => {
      printed.count++;
      print(text);
    },
    files: { readFile: options.readFile, writeFile: options.writeFile },
    isTool: options.isTool,
    isTraceRecorded: options.isTraceRecorded,
    isWarningEnabled: options.isWarningEnabled,
  });
  reportStartup(specification, config, report);
  const environment = specification.environment;
  const search = createSearch(config, environment, () =>
    getTlcVariableOrder(options.source, loadModule),
  );
  if (search) reportStateLevelProperties(config, environment, report);
  if (findAssumptionViolation(specification.assumptions, environment)) return fallBack();
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
  const shared = { fingerprints: createSharedFingerprints() };
  const fingerprint = new Int32Array(2);
  const seeds = Array.from({ length: count }, createStateEncoder);
  const statistics = {
    generatedStates: 0,
    distinctStates: 0,
    queuedStates: 0,
    depth: 0,
    initialStates: undefined as InitialStates | undefined,
    outDegrees: Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0),
  };
  const tlcFingerprints: BigInt64Array[] = [];
  const createSuccess = (): CheckResult => ({
    status: "success",
    violation: undefined,
    failure: undefined,
    ...statistics,
    fingerprintDistance: getFingerprintDistance(
      statistics.distinctStates,
      statistics.generatedStates,
      () => {
        const fingerprints = new BigInt64Array(statistics.distinctStates);
        tlcFingerprints.reduce((offset, level) => {
          fingerprints.set(level, offset);
          return offset + level.length;
        }, 0);
        return fingerprints;
      },
    ),
  });
  const seedInitialStates = (init: Expression) => {
    const seeded: Value[][] = [];
    for (const state of getInitialStates(init, environment, search.spec.scope)) {
      reportInitialStatesProgress(statistics.generatedStates, report);
      canonicalize(state);
      statistics.generatedStates++;
      writeStateFingerprint(search.getFingerprintState(state), fingerprint);
      if (isSharedFingerprintsFull(shared.fingerprints)) {
        shared.fingerprints = growSharedFingerprints(shared.fingerprints);
      }
      if (!insertSharedFingerprint(shared.fingerprints, fingerprint[0], fingerprint[1])) continue;
      if (search.findViolatedInvariant(state) || search.findFailedInitialPredicate(state)) {
        return false;
      }
      if (!search.satisfiesConstraints(state)) continue;
      if (!seeds[seeded.length % count].encode(state)) return false;
      seeded.push(state);
      statistics.distinctStates++;
    }
    tlcFingerprints.push(
      BigInt64Array.from(seeded, (state) => environment.runtime.getFingerprint(state)),
    );
    return true;
  };
  // The sequential search reports a violation or a failed evaluation in the initial states.
  report({ kind: "initial-states-started" });
  try {
    if (!seedInitialStates(search.spec.init)) return fallBack();
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    return fallBack();
  }
  if (getRankedStringCount() !== startupStrings) return fallBack();
  statistics.depth = statistics.generatedStates === 0 ? 0 : 1;
  statistics.initialStates = {
    generated: statistics.generatedStates,
    distinct: statistics.distinctStates,
  };
  report({ kind: "initial-states-computed", initialStates: statistics.initialStates });
  if (statistics.distinctStates === 0) return createSuccess();

  const reports: WorkerMessage[] = [];
  const pending = { count, resolve: (_reports: WorkerMessage[]) => {} };
  const onMessage = (message: WorkerMessage) => {
    reports.push(message);
    if (message.type === "abort" || reports.length === pending.count) {
      pending.resolve(reports.splice(0));
    }
  };
  const waitForReports = (expected: number) =>
    new Promise<WorkerMessage[]>((resolve) => {
      pending.count = expected;
      pending.resolve = resolve;
    });
  const ready = waitForReports(count);
  const requests = new Int32Array(new SharedArrayBuffer(count * 4));
  const remaining = new Int32Array(new SharedArrayBuffer(count * 4));
  const workers = await Promise.all(Array.from({ length: count }, () => spawnWorker(onMessage)));
  const terminate = () => workers.forEach((worker) => worker.terminate());
  const channels = new Map<string, MessageChannel>();
  const getPort = (from: number, to: number) => {
    const key = from < to ? `${from}:${to}` : `${to}:${from}`;
    const channel = channels.get(key) ?? new MessageChannel();
    channels.set(key, channel);
    return (from < to ? channel.port1 : channel.port2) as unknown as Port;
  };
  workers.forEach((worker, index) => {
    const ports = Array.from({ length: count }, (_, peer) =>
      peer === index ? undefined : getPort(index, peer),
    );
    const seed = seeds[index].finish();
    const message: StartMessage = {
      type: "start",
      source: options.source,
      config,
      modules: [...modules],
      classes: [...classes],
      index,
      ports,
      seed,
      isTool: options.isTool,
      isTraceRecorded: options.isTraceRecorded,
      isWarningEnabled: options.isWarningEnabled,
      fingerprints: shared.fingerprints,
      requests,
      remaining,
    };
    worker.postMessage(message, [...ports.filter((port) => port !== undefined), seed.words.buffer]);
  });
  const isAborted = (messages: WorkerMessage[]) =>
    messages.some((message) => message.type === "abort");
  const send = (message: CoordinatorMessage) =>
    workers.forEach((worker) => worker.postMessage(message));
  // Workers pause when the shared table needs to grow, and resume once it has.
  const collectLevels = async (messages: WorkerMessage[]): Promise<WorkerMessage[]> => {
    const paused = messages.filter((message) => message.type === "paused").length;
    if (paused === 0 || isAborted(messages)) return messages;
    shared.fingerprints = growSharedFingerprints(shared.fingerprints);
    const resumed = waitForReports(paused);
    send({ type: "resize", fingerprints: shared.fingerprints });
    const reported = messages.filter((message) => message.type !== "paused");
    return [...reported, ...(await collectLevels(await resumed))];
  };
  if (isAborted(await ready)) {
    terminate();
    return fallBack();
  }
  for (let level = 1; ; level++) {
    const reported = waitForReports(count);
    // Every worker is idle, so peers can ask any of them for states once the level starts.
    requests.forEach((_, index) => Atomics.store(requests, index, 0));
    send({ type: "level", level });
    const messages = await collectLevels(await reported);
    if (isAborted(messages)) {
      terminate();
      return fallBack();
    }
    const levels = messages.flatMap((message) => (message.type === "level" ? [message] : []));
    const added = levels.reduce((sum, message) => sum + message.added, 0);
    statistics.generatedStates += levels.reduce((sum, message) => sum + message.generated, 0);
    statistics.distinctStates += added;
    levels.forEach((message) => {
      message.outDegrees.forEach(
        (degreeCount, degree) => (statistics.outDegrees[degree] += degreeCount),
      );
      tlcFingerprints.push(message.fingerprints);
    });
    if (added === 0) {
      terminate();
      return createSuccess();
    }
    statistics.depth++;
  }
};
