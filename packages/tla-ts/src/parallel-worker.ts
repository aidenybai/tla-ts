import { createCanonicalizer } from "./canonical";
import { createSearch } from "./check";
import { createEnvironment } from "./environment";
import {
  createFingerprintTable,
  insertSharedFingerprint,
  isSharedFingerprintsFull,
  writeStateFingerprint,
} from "./fingerprints";
import type {
  CoordinatorMessage,
  LevelMessage,
  Port,
  StartMessage,
  WorkerMessage,
} from "./parallel";
import { getSuccessors, type Successor } from "./successors";
import { getTlcStringOrder, getTlcVariableOrder } from "./tlc-order";
import { OUT_DEGREE_BUCKETS } from "./tlc-summary";
import { createStateDecoder, createStateEncoder, type EncodedStates } from "./transfer";
import { getRankedStringCount, setStringOrder, type Value } from "./values";

const WORKER_THREADS_MODULE = "node:worker_threads";
const LOCKED = -1;

interface Expansion {
  states: Value[][];
  origin: number;
  end: number;
  successors: Successor[] | undefined;
  index: number;
  added: number;
  generated: number;
  outDegrees: number[];
  next: Value[][];
  fingerprintStates: Value[][];
}

const getParentPort = async () => {
  if (typeof (globalThis as { postMessage?: unknown }).postMessage === "function") {
    return globalThis as unknown as Port;
  }
  const threads: typeof import("node:worker_threads") = await import(
    /* @vite-ignore */ /* webpackIgnore: true */ WORKER_THREADS_MODULE
  );
  return threads.parentPort as unknown as Port;
};

const run = (start: StartMessage, parent: Port) => {
  const modules = new Map(start.modules);
  const loadModule = (name: string) => modules.get(name);
  const classes = new Map(start.classes);
  setStringOrder(getTlcStringOrder(start.source, start.config, loadModule));
  const startupStrings = getRankedStringCount();
  const specification = createEnvironment(start.config, {
    source: start.source,
    loadModule,
    loadClass: (name) => classes.get(name),
    print: () => {},
    files: { readFile: undefined, writeFile: undefined },
  });
  const environment = specification.environment;
  const search = createSearch(start.config, environment, () =>
    getTlcVariableOrder(start.source, loadModule),
  );
  const nextAction = search?.spec.next;
  if (!search || nextAction === undefined)
    return parent.postMessage({ type: "abort" } satisfies WorkerMessage);
  const self = start.index;
  const canonicalize = createCanonicalizer();
  const decode = createStateDecoder(environment.variables.length);
  const shared = { fingerprints: start.fingerprints };
  const requests = start.requests;
  const remaining = start.remaining;
  // Under symmetry, a successor the worker generated before has the representative it had then,
  // so the worker skips the search for one.
  const generatedStates = search.isSymmetric ? createFingerprintTable() : undefined;
  const fingerprint = new Int32Array(2);
  const waiters = { resume: () => {}, loot: (_states: EncodedStates) => {} };
  start.ports.forEach((port) => {
    port?.addEventListener("message", (event) => waiters.loot(event.data as EncodedStates));
    port?.start?.();
  });
  const frontier = { states: decode(start.seed).map(canonicalize) };

  // A worker that runs out of states asks a peer for some by writing its index + 1 to the peer's
  // request word. The peer sends half of the states it hasn't started, keeps expanding, and wakes
  // the workers waiting to ask it next.
  const answer = (expansion: Expansion, request: number) => {
    const thief = Atomics.load(requests, self) - 1;
    const given = Math.floor((expansion.end - expansion.origin - 1) / 2);
    const encoder = createStateEncoder();
    const states = expansion.states.slice(expansion.end - given, expansion.end);
    const isEncoded = given > 0 && states.every(encoder.encode);
    if (isEncoded) expansion.end -= given;
    const loot = isEncoded ? encoder.finish() : createStateEncoder().finish();
    start.ports[thief]?.postMessage(loot, [loot.words.buffer]);
    Atomics.store(requests, self, request);
    Atomics.notify(requests, self);
  };

  // A worker answers any request before it pauses or runs out of states, and takes no more until
  // it resumes.
  const lock = (expansion: Expansion) => {
    Atomics.store(remaining, self, 0);
    if (Atomics.compareExchange(requests, self, 0, LOCKED) === 0) return;
    answer(expansion, LOCKED);
  };

  const unlock = (expansion: Expansion) => {
    Atomics.store(remaining, self, expansion.end - expansion.origin);
    Atomics.store(requests, self, 0);
  };

  // The worker pauses before a successor when the shared table needs to grow, and resumes there.
  const expand = (expansion: Expansion) => {
    for (; expansion.origin < expansion.end; expansion.origin++) {
      const state = expansion.states[expansion.origin];
      if (!expansion.successors) {
        if (Atomics.load(requests, self) > 0) answer(expansion, 0);
        Atomics.store(remaining, self, expansion.end - expansion.origin - 1);
        expansion.successors = getSuccessors(nextAction, state, environment, search.spec.scope);
        expansion.generated += expansion.successors.length;
        if (expansion.successors.length === 0 && start.config.checkDeadlock) return undefined;
      }
      const successors = expansion.successors;
      for (; expansion.index < successors.length; expansion.index++) {
        if (isSharedFingerprintsFull(shared.fingerprints)) return "paused";
        const successor = successors[expansion.index];
        if (search.findViolatedActionProperty(state, successor.state)) return undefined;
        if (!search.satisfiesActionConstraints(state, successor.state)) continue;
        if (generatedStates) {
          writeStateFingerprint(successor.state, fingerprint);
          if (!generatedStates.insert(fingerprint[0], fingerprint[1])) continue;
        }
        canonicalize(successor.state);
        const fingerprintState = search.getFingerprintState(successor.state);
        writeStateFingerprint(fingerprintState, fingerprint);
        if (!insertSharedFingerprint(shared.fingerprints, fingerprint[0], fingerprint[1])) continue;
        if (search.findViolatedInvariant(successor.state, state)) return undefined;
        if (!search.satisfiesConstraints(successor.state, state)) continue;
        expansion.next.push(successor.state);
        expansion.fingerprintStates.push(fingerprintState);
        expansion.added++;
      }
      expansion.outDegrees[Math.min(expansion.added, OUT_DEGREE_BUCKETS - 1)]++;
      expansion.successors = undefined;
      expansion.index = 0;
      expansion.added = 0;
    }
    return "done";
  };

  // Each attempt asks the peer with the most states left. While another worker's request to that
  // peer is open, the worker waits for the peer to answer it. The worker stops once no peer that
  // takes requests has two states left.
  const steal = async (expansion: Expansion) => {
    const skipped = new Set<number>();
    for (;;) {
      const victim = start.ports.reduce<number | undefined>((best, port, index) => {
        if (!port || skipped.has(index) || Atomics.load(remaining, index) < 2) return best;
        return best === undefined || Atomics.load(remaining, index) > Atomics.load(remaining, best)
          ? index
          : best;
      }, undefined);
      if (victim === undefined) return false;
      const request = Atomics.compareExchange(requests, victim, 0, self + 1);
      if (request === LOCKED) skipped.add(victim);
      if (request > 0) Atomics.wait(requests, victim, request);
      if (request !== 0) continue;
      const loot = await new Promise<EncodedStates>((resolve) => (waiters.loot = resolve));
      if (loot.count === 0) {
        skipped.add(victim);
        continue;
      }
      expansion.states = decode(loot).map(canonicalize);
      expansion.origin = 0;
      expansion.end = expansion.states.length;
      unlock(expansion);
      return true;
    }
  };

  const report = (message: WorkerMessage) =>
    parent.postMessage(message, message.type === "level" ? [message.fingerprints.buffer] : []);

  const runLevel = async (level: number): Promise<LevelMessage | undefined> => {
    const expansion: Expansion = {
      states: frontier.states,
      origin: 0,
      end: frontier.states.length,
      successors: undefined,
      index: 0,
      added: 0,
      generated: 0,
      outDegrees: Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0),
      next: [],
      fingerprintStates: [],
    };
    for (;;) {
      const status = expand(expansion);
      if (status === undefined) return undefined;
      lock(expansion);
      if (status === "paused") {
        const resumed = new Promise<void>((resolve) => (waiters.resume = resolve));
        report({ type: "paused" });
        await resumed;
        unlock(expansion);
        continue;
      }
      if (!(await steal(expansion))) break;
    }
    if (getRankedStringCount() !== startupStrings) return undefined;
    frontier.states = expansion.next;
    Atomics.store(remaining, self, frontier.states.length);
    return {
      type: "level",
      level,
      generated: expansion.generated,
      added: expansion.next.length,
      outDegrees: expansion.outDegrees,
      fingerprints: search.getStoredFingerprints(expansion.next, expansion.fingerprintStates),
    };
  };

  const step = (level: number) => {
    runLevel(level).then(
      (message) => report(message ?? { type: "abort" }),
      () => report({ type: "abort" }),
    );
  };
  parent.addEventListener("message", (event) => {
    const message = event.data as CoordinatorMessage;
    if (message.type === "level") step(message.level);
    if (message.type === "resize") {
      shared.fingerprints = message.fingerprints;
      waiters.resume();
    }
  });
  Atomics.store(remaining, self, frontier.states.length);
  report({ type: "ready" });
};

void getParentPort().then((parent) => {
  const onStart = (event: { data: unknown }) => {
    const message = event.data as StartMessage;
    if (message.type !== "start") return;
    parent.removeEventListener?.("message", onStart);
    try {
      run(message, parent);
    } catch {
      parent.postMessage({ type: "abort" } satisfies WorkerMessage);
    }
  };
  parent.addEventListener("message", onStart);
  parent.start?.();
});
