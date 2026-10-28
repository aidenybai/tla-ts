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

interface PeerMessage {
  phase: "balance";
  level: number;
  from: number;
  states: EncodedStates;
}

interface Expansion {
  origin: number;
  successors: Successor[] | undefined;
  index: number;
  generated: number;
  newStates: Int32Array;
  next: Value[][];
  fingerprintStates: Value[][];
}

interface Transfer {
  from: number;
  to: number;
  count: number;
}

const getBalancePlan = (sizes: number[]) => {
  const total = sizes.reduce((sum, size) => sum + size, 0);
  const average = total / sizes.length;
  if (Math.max(...sizes) - Math.min(...sizes) <= Math.max(64, average / 4)) return [];
  const targets = sizes.map(
    (_, index) => Math.floor(average) + (index < total % sizes.length ? 1 : 0),
  );
  const donors = sizes.flatMap((size, index) =>
    size > targets[index] ? [{ index, amount: size - targets[index] }] : [],
  );
  const receivers = sizes.flatMap((size, index) =>
    size < targets[index] ? [{ index, amount: targets[index] - size }] : [],
  );
  const transfers: Transfer[] = [];
  for (const donor of donors) {
    for (const receiver of receivers) {
      const moved = Math.min(donor.amount, receiver.amount);
      if (moved === 0) continue;
      transfers.push({ from: donor.index, to: receiver.index, count: moved });
      donor.amount -= moved;
      receiver.amount -= moved;
    }
  }
  return transfers;
};

const getParentPort = async () => {
  if (typeof (globalThis as { postMessage?: unknown }).postMessage === "function") {
    return globalThis as unknown as Port;
  }
  const threads: typeof import("node:worker_threads") = await import(
    /* @vite-ignore */ /* webpackIgnore: true */ WORKER_THREADS_MODULE
  );
  return threads.parentPort as unknown as Port;
};

const createInbox = () => {
  const messages = new Map<string, PeerMessage[]>();
  const waiters = new Map<string, { count: number; resolve: (messages: PeerMessage[]) => void }>();
  const getKey = (phase: PeerMessage["phase"], level: number) => `${phase}:${level}`;
  const settle = (key: string) => {
    const waiter = waiters.get(key);
    const received = messages.get(key) ?? [];
    if (!waiter || received.length < waiter.count) return;
    waiters.delete(key);
    messages.delete(key);
    waiter.resolve(received);
  };
  return {
    deliver: (message: PeerMessage) => {
      const key = getKey(message.phase, message.level);
      messages.set(key, [...(messages.get(key) ?? []), message]);
      settle(key);
    },
    receive: (phase: PeerMessage["phase"], level: number, count: number) =>
      new Promise<PeerMessage[]>((resolve) => {
        const key = getKey(phase, level);
        waiters.set(key, { count, resolve });
        settle(key);
      }),
  };
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
  // Under symmetry, a successor the worker generated before has the representative it had then,
  // so the worker skips the search for one.
  const generatedStates = search.isSymmetric ? createFingerprintTable() : undefined;
  const fingerprint = new Int32Array(2);
  const inbox = createInbox();
  const peers = start.ports.flatMap((port, index) => (port ? [{ port, index }] : []));
  peers.forEach((peer) => {
    peer.port.addEventListener("message", (event) => inbox.deliver(event.data as PeerMessage));
    peer.port.start?.();
  });
  const frontier = { states: decode(start.seed).map(canonicalize) };
  const send = (index: number, message: PeerMessage, transfer: unknown[]) =>
    start.ports[index]?.postMessage(message, transfer);

  // The worker pauses before a successor when the shared table needs to grow, and resumes there.
  const expand = (expansion: Expansion) => {
    const states = frontier.states;
    for (; expansion.origin < states.length; expansion.origin++) {
      const state = states[expansion.origin];
      if (!expansion.successors) {
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
        expansion.newStates[expansion.origin]++;
      }
      expansion.successors = undefined;
      expansion.index = 0;
    }
    return "done";
  };

  const balance = async (level: number, next: Value[][], sizes: number[]) => {
    const transfers = getBalancePlan(sizes);
    if (transfers.length === 0) return true;
    const outgoing = new Map(peers.map((peer) => [peer.index, createStateEncoder()]));
    for (const transfer of transfers.filter((candidate) => candidate.from === self)) {
      const encoder = outgoing.get(transfer.to);
      const states = next.splice(next.length - transfer.count, transfer.count);
      if (!encoder || !states.every(encoder.encode)) return false;
    }
    outgoing.forEach((encoder, index) => {
      const states = encoder.finish();
      send(index, { phase: "balance", level, from: self, states }, [states.words.buffer]);
    });
    const incoming = await inbox.receive("balance", level, peers.length);
    incoming.forEach((message) => next.push(...decode(message.states).map(canonicalize)));
    return true;
  };

  const waiters = { resume: () => {}, balance: (_sizes: number[]) => {} };
  const report = (message: WorkerMessage) =>
    parent.postMessage(message, message.type === "level" ? [message.fingerprints.buffer] : []);

  const runLevel = async (level: number): Promise<LevelMessage | undefined> => {
    const expansion: Expansion = {
      origin: 0,
      successors: undefined,
      index: 0,
      generated: 0,
      newStates: new Int32Array(frontier.states.length),
      next: [],
      fingerprintStates: [],
    };
    for (let status = expand(expansion); status !== "done"; status = expand(expansion)) {
      if (status === undefined) return undefined;
      const resumed = new Promise<void>((resolve) => (waiters.resume = resolve));
      report({ type: "paused" });
      await resumed;
    }
    if (getRankedStringCount() !== startupStrings) return undefined;
    const next = expansion.next;
    const added = next.length;
    const outDegrees = Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0);
    expansion.newStates.forEach((degree) => outDegrees[Math.min(degree, OUT_DEGREE_BUCKETS - 1)]++);
    const fingerprints = search.getStoredFingerprints(next, expansion.fingerprintStates);
    const sizes = new Promise<number[]>((resolve) => (waiters.balance = resolve));
    report({ type: "expanded", from: self, added });
    if (!(await balance(level, next, await sizes))) return undefined;
    frontier.states = next;
    return {
      type: "level",
      level,
      generated: expansion.generated,
      added,
      outDegrees,
      fingerprints,
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
    if (message.type === "balance") waiters.balance(message.sizes);
  });
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
