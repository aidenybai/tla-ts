import type { Expression } from "./ast";
import {
  checkSequentially,
  type CheckOptions,
  type CheckProgress,
  type CheckResult,
  type InitialStates,
} from "./check";
import { parseConfig, type ModelConfig } from "./config";
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
import {
  createCheckEnvironment,
  createSearch,
  findAssumptionViolation,
  reportInitialStatesProgress,
  reportStartup,
} from "./search";
import { getInitialStates } from "./successors";
import { getFingerprintDistance, OUT_DEGREE_BUCKETS } from "./tlc/summary";
import { createStateEncoder, type EncodedStates } from "./transfer";
import { createCanonicalizer, getUnorderedString, type Value } from "./values";
import { spawnWorker, type Port } from "./worker";

export interface StartMessage extends Pick<
  CheckOptions,
  | "source"
  | "isTool"
  | "traceSpec"
  | "isWarningEnabled"
  | "version"
  | "fingerprintPolynomial"
  | "maxSetSize"
  | "isLazyValueExpanded"
> {
  type: "start";
  config: ModelConfig;
  modules: [string, string | undefined][];
  classes: [string, Uint8Array | undefined][];
  index: number;
  ports: (Port | undefined)[];
  seed: EncodedStates;
  fingerprints: SharedFingerprints;
  requests: Int32Array;
  remaining: Int32Array;
}

interface LevelMessage {
  type: "level";
  generated: number;
  added: number;
  outDegrees: number[];
  fingerprints: BigInt64Array;
}

export type WorkerMessage =
  | { type: "ready" }
  | { type: "abort"; string?: string }
  | { type: "paused" }
  | LevelMessage;

export type CoordinatorMessage =
  | { type: "level" }
  | { type: "resize"; fingerprints: SharedFingerprints };

export const check = async (options: CheckOptions): Promise<CheckResult> => {
  const config =
    typeof options.config === "string"
      ? parseConfig(options.config, options.version)
      : options.config;
  const print = options.onPrint ?? console.log;
  let printedCount = 0;
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
  const fallBack = (createdString?: string) => {
    if (createdString !== undefined) {
      options.onProgress?.({ kind: "sequential-fallback", string: createdString });
    }
    let skippedCount = printedCount;
    return checkSequentially({
      ...options,
      config,
      onPrint: (text) => (skippedCount-- > 0 ? undefined : print(text)),
      onProgress: (progress) => {
        if (!reported.has(getKey(progress))) options.onProgress?.(progress);
      },
    });
  };
  const workerCount = options.workers ?? 1;
  const isSequential =
    workerCount < 2 ||
    typeof SharedArrayBuffer !== "function" ||
    options.dump !== undefined ||
    options.coverage !== undefined ||
    options.isContinued === true ||
    config.view !== undefined ||
    config.postconditions.length > 0 ||
    config.possible.length > 0 ||
    (options.moduleOperators?.length ?? 0) > 0;
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
  const created = createCheckEnvironment(
    config,
    { ...options, loadModule, loadClass, seed: undefined, moduleOperators: undefined },
    (text) => {
      printedCount++;
      print(text);
    },
    true,
  );
  const specification = created.specification;
  reportStartup(specification, config, report);
  const environment = specification.environment;
  const search = createSearch(
    config,
    environment,
    specification.variableLocations,
    () => created.order.getDeclarationOrder("variable"),
    report,
  );
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
  let sharedFingerprints = createSharedFingerprints();
  const fingerprint = new Int32Array(2);
  const seeds = Array.from({ length: workerCount }, createStateEncoder);
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
      if (isSharedFingerprintsFull(sharedFingerprints)) {
        sharedFingerprints = growSharedFingerprints(sharedFingerprints);
      }
      if (!insertSharedFingerprint(sharedFingerprints, fingerprint[0], fingerprint[1])) continue;
      if (search.findViolatedInvariant(state) || search.findFailedInitialPredicate(state)) {
        return false;
      }
      if (!search.satisfiesConstraints(state)) continue;
      if (!seeds[seeded.length % workerCount].encode(state)) return false;
      seeded.push(state);
      statistics.distinctStates++;
    }
    tlcFingerprints.push(
      BigInt64Array.from(seeded, (state) => environment.runtime.getFingerprint(state)),
    );
    return true;
  };
  report({ kind: "initial-states-started" });
  try {
    if (!seedInitialStates(search.spec.init)) return fallBack();
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    return fallBack();
  }
  const unorderedString = getUnorderedString();
  if (unorderedString !== undefined) return fallBack(unorderedString);
  statistics.depth = statistics.generatedStates === 0 ? 0 : 1;
  statistics.initialStates = {
    generated: statistics.generatedStates,
    distinct: statistics.distinctStates,
  };
  report({ kind: "initial-states-computed", initialStates: statistics.initialStates });
  if (statistics.distinctStates === 0) return createSuccess();

  const reports: WorkerMessage[] = [];
  let pendingCount = workerCount;
  let resolvePending = (_reports: WorkerMessage[]) => {};
  const onMessage = (message: WorkerMessage) => {
    reports.push(message);
    if (message.type === "abort" || reports.length === pendingCount) {
      resolvePending(reports.splice(0));
    }
  };
  const waitForReports = (expected: number) =>
    new Promise<WorkerMessage[]>((resolve) => {
      pendingCount = expected;
      resolvePending = resolve;
    });
  const ready = waitForReports(workerCount);
  const requests = new Int32Array(new SharedArrayBuffer(workerCount * 4));
  const remaining = new Int32Array(new SharedArrayBuffer(workerCount * 4));
  const workers = await Promise.all(
    Array.from({ length: workerCount }, () =>
      spawnWorker(
        new URL("./parallel-worker.js", import.meta.url),
        (message) => onMessage(message as WorkerMessage),
        () => onMessage({ type: "abort" }),
      ),
    ),
  );
  const terminate = () => workers.forEach((worker) => worker.terminate());
  const channels = new Map<string, MessageChannel>();
  const getPort = (from: number, to: number) => {
    const key = from < to ? `${from}:${to}` : `${to}:${from}`;
    const channel = channels.get(key) ?? new MessageChannel();
    channels.set(key, channel);
    return (from < to ? channel.port1 : channel.port2) as unknown as Port;
  };
  workers.forEach((worker, index) => {
    const ports = Array.from({ length: workerCount }, (_value, peer) =>
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
      traceSpec: options.traceSpec,
      isWarningEnabled: options.isWarningEnabled,
      version: options.version,
      fingerprintPolynomial: options.fingerprintPolynomial,
      maxSetSize: options.maxSetSize,
      isLazyValueExpanded: options.isLazyValueExpanded,
      fingerprints: sharedFingerprints,
      requests,
      remaining,
    };
    worker.postMessage(message, [...ports.filter((port) => port !== undefined), seed.words.buffer]);
  });
  const isAborted = (messages: WorkerMessage[]) =>
    messages.some((message) => message.type === "abort");
  const send = (message: CoordinatorMessage) =>
    workers.forEach((worker) => worker.postMessage(message));
  const collectLevels = async (messages: WorkerMessage[]): Promise<WorkerMessage[]> => {
    const pausedCount = messages.filter((message) => message.type === "paused").length;
    if (pausedCount === 0 || isAborted(messages)) return messages;
    sharedFingerprints = growSharedFingerprints(sharedFingerprints);
    const resumed = waitForReports(pausedCount);
    send({ type: "resize", fingerprints: sharedFingerprints });
    const unpaused = messages.filter((message) => message.type !== "paused");
    return [...unpaused, ...(await collectLevels(await resumed))];
  };
  if (isAborted(await ready)) {
    terminate();
    return fallBack();
  }
  for (;;) {
    const levelReports = waitForReports(workerCount);
    requests.forEach((_request, index) => Atomics.store(requests, index, 0));
    send({ type: "level" });
    const messages = await collectLevels(await levelReports);
    if (isAborted(messages)) {
      terminate();
      const aborted = messages.find(
        (message) => message.type === "abort" && message.string !== undefined,
      );
      return fallBack(aborted?.type === "abort" ? aborted.string : undefined);
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
