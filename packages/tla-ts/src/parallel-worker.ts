import { createCanonicalizer } from "./canonical";
import { createSearch } from "./check";
import { createEnvironment } from "./environment";
import { createFingerprintTable, getFingerprintOwner, getStateFingerprint } from "./fingerprints";
import type { LevelMessage, Port, StartMessage, WorkerMessage } from "./parallel";
import { getSuccessors } from "./successors";
import { getTlcStringOrder, getTlcVariableOrder } from "./tlc-order";
import { createStateDecoder, createStateEncoder, type EncodedStates } from "./transfer";
import { getRankedStringCount, setStringOrder, type Value } from "./values";

const WORKER_THREADS_MODULE = "node:worker_threads";

interface Pending {
  states: Value[][];
  parents: Value[][];
  fingerprints: number[];
}

interface PeerMessage {
  phase: "query" | "answer" | "sizes" | "balance";
  level: number;
  from: number;
  fingerprints?: Int32Array;
  bits?: Uint8Array;
  states?: EncodedStates;
  unmarks?: Int32Array;
  size?: number;
}

interface Transfer {
  from: number;
  to: number;
  count: number;
}

const getBalancePlan = (sizes: number[]): Transfer[] => {
  const total = sizes.reduce((sum, size) => sum + size, 0);
  const average = total / sizes.length;
  if (Math.max(...sizes) - Math.min(...sizes) <= Math.max(64, average / 4)) return [];
  const targets = sizes.map(
    (_, index) => Math.floor(total / sizes.length) + (index < total % sizes.length ? 1 : 0),
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

const getParentPort = async (): Promise<Port> => {
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
  const width = environment.variables.length;
  const count = start.count;
  const self = start.index;
  const canonicalize = createCanonicalizer();
  const decode = createStateDecoder(width);
  const table = createFingerprintTable();
  const known = createFingerprintTable();
  const fingerprint = new Int32Array(2);
  const inbox = createInbox();
  const peers = start.ports.flatMap((port, index) => (port ? [{ port, index }] : []));
  peers.forEach((peer) => {
    peer.port.addEventListener("message", (event) => inbox.deliver(event.data as PeerMessage));
    peer.port.start?.();
  });
  for (let index = 0; index < start.seedFingerprints.length; index += 2) {
    table.insert(start.seedFingerprints[index], start.seedFingerprints[index + 1]);
  }
  const frontier = { states: decode(start.seed).map(canonicalize) };
  const send = (index: number, message: PeerMessage, transfer: unknown[]) =>
    start.ports[index]?.postMessage(message, transfer);

  const expand = (states: Value[][], next: Value[][]) => {
    const pending: Pending[] = Array.from({ length: count }, () => ({
      states: [],
      parents: [],
      fingerprints: [],
    }));
    const statistics = { generated: 0 };
    for (const state of states) {
      const successors = getSuccessors(nextAction, state, environment, search.spec.scope);
      statistics.generated += successors.length;
      if (successors.length === 0 && start.config.checkDeadlock) return undefined;
      for (const successor of successors) {
        if (search.findViolatedActionProperty(state, successor.state)) return undefined;
        if (!search.satisfiesActionConstraints(state, successor.state)) continue;
        canonicalize(successor.state);
        getStateFingerprint(search.getFingerprintState(successor.state), fingerprint);
        const owner = getFingerprintOwner(fingerprint[1], count);
        if (owner === self) {
          if (!table.insert(fingerprint[0], fingerprint[1])) continue;
          if (search.findViolatedInvariant(successor.state, state)) return undefined;
          if (search.satisfiesConstraints(successor.state, state)) next.push(successor.state);
          else table.remove(fingerprint[0], fingerprint[1]);
          continue;
        }
        if (!known.insert(fingerprint[0], fingerprint[1])) continue;
        pending[owner].states.push(successor.state);
        pending[owner].parents.push(state);
        pending[owner].fingerprints.push(fingerprint[0], fingerprint[1]);
      }
    }
    return { pending, generated: statistics.generated };
  };

  const answer = (fingerprints: Int32Array | number[]) => {
    const bits = new Uint8Array(fingerprints.length / 2);
    for (let index = 0; index < bits.length; index++) {
      bits[index] = table.insert(fingerprints[index * 2], fingerprints[index * 2 + 1]) ? 1 : 0;
    }
    return bits;
  };

  const commit = (pending: Pending, bits: Uint8Array, next: Value[][]) => {
    const unmarks: number[] = [];
    for (let index = 0; index < bits.length; index++) {
      if (bits[index] === 0) continue;
      const state = pending.states[index];
      const parentState = pending.parents[index];
      if (search.findViolatedInvariant(state, parentState)) return undefined;
      if (search.satisfiesConstraints(state, parentState)) {
        next.push(state);
        continue;
      }
      known.remove(pending.fingerprints[index * 2], pending.fingerprints[index * 2 + 1]);
      unmarks.push(pending.fingerprints[index * 2], pending.fingerprints[index * 2 + 1]);
    }
    return Int32Array.from(unmarks);
  };

  const removeAll = (fingerprints: Int32Array) => {
    for (let index = 0; index < fingerprints.length; index += 2) {
      table.remove(fingerprints[index], fingerprints[index + 1]);
    }
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
    incoming.forEach((message) => {
      if (message.states) next.push(...decode(message.states).map(canonicalize));
    });
    return true;
  };

  const runLevel = async (level: number): Promise<LevelMessage | undefined> => {
    const next: Value[][] = [];
    const expanded = expand(frontier.states, next);
    if (!expanded || getRankedStringCount() !== startupStrings) return undefined;
    peers.forEach((peer) => {
      const fingerprints = Int32Array.from(expanded.pending[peer.index].fingerprints);
      send(peer.index, { phase: "query", level, from: self, fingerprints }, [fingerprints.buffer]);
    });
    const queries = await inbox.receive("query", level, peers.length);
    queries.forEach((query) => {
      const bits = answer(query.fingerprints ?? []);
      send(query.from, { phase: "answer", level, from: self, bits }, [bits.buffer]);
    });
    const answers = await inbox.receive("answer", level, peers.length);
    for (const reply of answers) {
      const unmarks = commit(expanded.pending[reply.from], reply.bits ?? new Uint8Array(), next);
      if (!unmarks) return undefined;
      send(reply.from, { phase: "sizes", level, from: self, unmarks, size: 0 }, [unmarks.buffer]);
    }
    const added = next.length;
    const sizes = Array.from({ length: count }, () => 0);
    sizes[self] = added;
    peers.forEach((peer) =>
      send(peer.index, { phase: "sizes", level, from: self, size: added }, []),
    );
    const received = await inbox.receive("sizes", level, peers.length * 2);
    received.forEach((message) => {
      if (message.unmarks) removeAll(message.unmarks);
      else sizes[message.from] = message.size ?? 0;
    });
    if (getRankedStringCount() !== startupStrings) return undefined;
    if (!(await balance(level, next, sizes))) return undefined;
    frontier.states = next;
    return { type: "level", level, generated: expanded.generated, added };
  };

  const report = (message: WorkerMessage) => parent.postMessage(message);
  const step = (level: number) => {
    runLevel(level).then(
      (message) => report(message ?? { type: "abort" }),
      () => report({ type: "abort" }),
    );
  };
  parent.addEventListener("message", (event) => {
    const message = event.data as { type: string; level: number };
    if (message.type === "level") step(message.level);
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
