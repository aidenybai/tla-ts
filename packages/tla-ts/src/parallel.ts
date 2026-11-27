import type { Expression } from "./ast";
import {
  checkSequentially,
  PERIODIC_START,
  PROGRESS_INTERVAL,
  type CheckOptions,
  type CheckProgress,
  type CheckResult,
  type InitialStates,
  type SearchStatistics,
} from "./check";
import { parseConfig, type ModelConfig } from "./config";
import { TlaEvaluationError } from "./errors";
import type { RuntimeInvariant } from "./environment";
import {
  createSharedFingerprints,
  getSharedFingerprintBuffers,
  growSharedFingerprints,
  insertSharedFingerprint,
  isSharedFingerprintsFull,
  writeStateFingerprint,
  type SharedFingerprintBuffers,
} from "./fingerprints";
import {
  createCheckEnvironment,
  createSearch,
  findAssumptionViolation,
  reportInitialStatesProgress,
  reportStartup,
} from "./search";
import { getSpecDescription } from "./spec-description";
import { forEachInitialState } from "./successors";
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
  | "seed"
> {
  type: "start";
  config: ModelConfig;
  runtimeInvariants: RuntimeInvariant[];
  modules: [string, string | undefined][];
  classes: [string, Uint8Array | undefined][];
  index: number;
  ports: (Port | undefined)[];
  frontier: EncodedStates;
  fingerprints: SharedFingerprintBuffers;
  requests: Int32Array;
  remaining: Int32Array;
  counts: BigInt64Array;
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
  | { type: "resize"; fingerprints: SharedFingerprintBuffers };

interface Attempt {
  onPrint: (text: string) => void;
  onProgress: (progress: CheckProgress) => void;
}

/** Model checks a spec as TLC does. It runs one check at a time, so a callback must not start another check. */
export const check = async (options: CheckOptions): Promise<CheckResult> => {
  const startedAt = performance.now();
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
  const reported = new Map<string, number>();
  let reportedStatistics: SearchStatistics | undefined;
  const createAttempt = (): Attempt => {
    let printCount = 0;
    const counts = new Map<string, number>();
    return {
      onPrint: (text) => {
        printCount++;
        if (printCount <= printedCount) return;
        printedCount = printCount;
        print(text);
      },
      onProgress: (progress) => {
        if (progress.kind === "progress") {
          const statistics = progress.statistics;
          if (
            reportedStatistics &&
            (statistics.generatedStates < reportedStatistics.generatedStates ||
              statistics.distinctStates < reportedStatistics.distinctStates)
          ) {
            return;
          }
          reportedStatistics = statistics;
        } else {
          const key = getKey(progress);
          const count = (counts.get(key) ?? 0) + 1;
          counts.set(key, count);
          if (count <= (reported.get(key) ?? 0)) return;
          reported.set(key, count);
        }
        options.onProgress?.(progress);
      },
    };
  };
  const fallBack = (createdString?: string) => {
    if (createdString !== undefined) {
      options.onProgress?.({ kind: "sequential-fallback", string: createdString });
    }
    return checkSequentially(
      { ...options, config, ...createAttempt() },
      startedAt,
      undefined,
      true,
    );
  };
  const workerCount = options.workers ?? 1;
  const isSequential =
    workerCount < 2 ||
    typeof SharedArrayBuffer !== "function" ||
    options.dump !== undefined ||
    options.coverage !== undefined ||
    options.isContinued === true ||
    config.view !== undefined ||
    config.periodic !== undefined ||
    config.postconditions.length > 0 ||
    config.possible.length > 0 ||
    (options.moduleOperators?.length ?? 0) > 0;
  if (isSequential) return checkSequentially({ ...options, config, ...createAttempt() }, startedAt);
  return checkSequentially(
    { ...options, config, ...createAttempt() },
    startedAt,
    (search, description) =>
      search.spec.init === undefined ||
      search.spec.next === undefined ||
      search.properties.liveness.length > 0 ||
      description.isNextOverlapping ||
      search.isImpure()
        ? undefined
        : checkWithWorkers(config, options, createAttempt(), fallBack),
  );
};

const checkWithWorkers = async (
  config: ModelConfig,
  options: CheckOptions,
  attempt: Attempt,
  fallBack: (createdString?: string) => CheckResult | Promise<CheckResult>,
): Promise<CheckResult> => {
  const workerCount = options.workers ?? 1;
  const report = attempt.onProgress;
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
    { ...options, loadModule, loadClass, moduleOperators: undefined },
    attempt.onPrint,
    true,
  );
  const specification = created.specification;
  reportStartup(specification, config, report);
  const environment = specification.environment;
  const search = createSearch(
    config,
    environment,
    () => created.order.getDeclarationOrder("variable"),
    report,
    [],
    specification.runtimeInvariants,
    specification.instanceActions,
  );
  // Tool's constructor describes the specification before TLC creates the checker.
  getSpecDescription(config, environment, specification.instanceActions);
  if (findAssumptionViolation(specification.assumptions, environment)) return fallBack();
  if (search.spec.init === undefined) return fallBack();

  let sharedFingerprints = createSharedFingerprints();
  const fingerprint = new Int32Array(2);
  const frontiers = Array.from({ length: workerCount }, createStateEncoder);
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
      (visit) => {
        const fingerprints = new BigInt64Array(statistics.distinctStates);
        tlcFingerprints.reduce((offset, level) => {
          fingerprints.set(level, offset);
          return offset + level.length;
        }, 0);
        visit(fingerprints);
      },
    ),
  });
  const seedInitialStates = (init: Expression) => {
    const canonicalize = createCanonicalizer();
    const seeded: Value[][] = [];
    let isSeeded = true;
    forEachInitialState(
      init,
      environment,
      (state) => {
        reportInitialStatesProgress(statistics.generatedStates, report);
        statistics.generatedStates++;
        const isInModel = search.satisfiesConstraints(state);
        if (isInModel) {
          canonicalize(state);
          writeStateFingerprint(search.getFingerprintState(state), fingerprint);
          if (isSharedFingerprintsFull(sharedFingerprints)) {
            sharedFingerprints = growSharedFingerprints(sharedFingerprints);
          }
          if (!insertSharedFingerprint(sharedFingerprints, fingerprint[0], fingerprint[1])) {
            return false;
          }
        }
        isSeeded =
          !search.findViolatedInvariant(state) &&
          !search.findFailedInitialPredicate(state) &&
          (!isInModel || frontiers[seeded.length % workerCount].encode(state));
        if (!isSeeded || !isInModel) return !isSeeded;
        seeded.push(state);
        statistics.distinctStates++;
        return false;
      },
      search.spec.scope,
      search.spec.initPredicates,
    );
    tlcFingerprints.push(
      BigInt64Array.from(seeded, (state) => environment.runtime.getFingerprint(state)),
    );
    return isSeeded;
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
  statistics.queuedStates = statistics.distinctStates;

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
  const counts = new BigInt64Array(new SharedArrayBuffer(workerCount * 4 * 8));
  const workers = await Promise.all(
    Array.from({ length: workerCount }, () =>
      spawnWorker(
        new URL("./parallel-worker.js", import.meta.url),
        (message) => onMessage(message as WorkerMessage),
        () => onMessage({ type: "abort" }),
      ),
    ),
  );
  const reportProgress = () => {
    let generated = 0;
    let added = 0;
    let expanded = 0;
    for (let index = 0; index < counts.length; index += 4) {
      let sequence = -1n;
      let workerGenerated = 0n;
      let workerAdded = 0n;
      let workerExpanded = 0n;
      while (sequence % 2n !== 0n || Atomics.load(counts, index) !== sequence) {
        sequence = Atomics.load(counts, index);
        workerGenerated = Atomics.load(counts, index + 1);
        workerAdded = Atomics.load(counts, index + 2);
        workerExpanded = Atomics.load(counts, index + 3);
      }
      generated += Number(workerGenerated);
      added += Number(workerAdded);
      expanded += Number(workerExpanded);
    }
    report({
      kind: "progress",
      statistics: {
        generatedStates: statistics.generatedStates + generated,
        distinctStates: statistics.distinctStates + added,
        // TLC reports progress while each worker expands a state that has left the queue.
        queuedStates: Math.max(statistics.queuedStates + added - expanded - workerCount, 0),
        depth: added > 0 ? statistics.depth + 1 : statistics.depth,
        coverage: undefined,
      },
    });
    progressTimer = setTimeout(reportProgress, PROGRESS_INTERVAL);
  };
  let progressTimer = options.onProgress ? setTimeout(reportProgress, PERIODIC_START) : undefined;
  const terminate = () => {
    clearTimeout(progressTimer);
    workers.forEach((worker) => worker.terminate());
  };
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
    const frontier = frontiers[index].finish();
    const message: StartMessage = {
      type: "start",
      source: options.source,
      config,
      runtimeInvariants: specification.runtimeInvariants,
      modules: [...modules],
      classes: [...classes],
      index,
      ports,
      frontier,
      seed: options.seed,
      isTool: options.isTool,
      traceSpec: options.traceSpec,
      isWarningEnabled: options.isWarningEnabled,
      version: options.version,
      fingerprintPolynomial: options.fingerprintPolynomial,
      maxSetSize: options.maxSetSize,
      isLazyValueExpanded: options.isLazyValueExpanded,
      fingerprints: getSharedFingerprintBuffers(sharedFingerprints),
      requests,
      remaining,
      counts,
    };
    worker.postMessage(message, [
      ...ports.filter((port) => port !== undefined),
      frontier.words.buffer,
    ]);
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
    send({ type: "resize", fingerprints: getSharedFingerprintBuffers(sharedFingerprints) });
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
    counts.forEach((_count, index) => Atomics.store(counts, index, 0n));
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
    statistics.queuedStates = added;
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
