import { createJavaRandom, getTlcFingerprint, type JavaRandom } from "./tlc-random";
import { createFunction, createRecord, type Value } from "./values";
import type { TlcVersion } from "./tlc-version";

export interface CheckerRuntime {
  getLevel: (state: (Value | undefined)[]) => number;
  getBehavior: (state: Value[]) => Value[][];
  getSpecification: () => Value;
  counterExample: Value | undefined;
  setLivenessSource: (index: number | undefined) => void;
  getCurrentState: () => Value[] | undefined;
  getFingerprint: (state: Value[]) => bigint;
  getRandom: () => JavaRandom;
  evaluateAtStartup: <Result>(evaluate: () => Result) => Result;
  pause: () => void;
  // Prints a warning TLC raises while it evaluates, with its message code. TLC prints each
  // distinct warning once.
  warn: (code: number, text: string) => void;
  // TLC's -nowarning turns the warnings off, and with them the shortcut that evaluates the rest
  // of an action once it assigns every variable, since that shortcut skips a warning.
  isWarningEnabled: boolean;
  // TLC's -tool, under which the message of an error that TLC raises with a code holds the
  // code's markers, which AssertError compares with.
  isTool: boolean;
  // The TLC whose messages tla-ts reproduces.
  version: TlcVersion;
  seed: bigint;
  isSeen: (state: Value[]) => boolean;
  generatedStates: number;
  distinctStates: number;
  initialStates: number;
  queueSize: number;
  diameter: number;
  registers: Map<number, Value>;
  namedRegisters: Map<string, Value>;
  properties: Map<string, string>;
  possibleCounts: Map<string, number>;
  isStopped: boolean;
  isStarted: boolean;
  checkDeadlock: boolean;
  startedAt: number;
}

// TLC's RandomEnumerableValues keeps one java.util.Random per thread, seeded with -seed. The
// main thread evaluates constants, assumptions, and initial states with it. A worker reseeds
// its Random with the fingerprint of each state it expands, XORed with the seed, so a state's
// successors are the same whatever order the workers expand states in.
export const createRuntime = (checkDeadlock: boolean, seed = 0n): CheckerRuntime => {
  const startup = createJavaRandom(seed);
  const worker = { random: createJavaRandom(seed), state: undefined as Value[] | undefined };
  const phase = { isStartup: false };
  const runtime: CheckerRuntime = {
    getLevel: () => 0,
    getBehavior: () => [],
    getSpecification: () => createRecord([]),
    counterExample: undefined,
    isSeen: () => false,
    setLivenessSource: () => {},
    getCurrentState: () => undefined,
    getFingerprint: getTlcFingerprint,
    getRandom: () => {
      const state = phase.isStartup ? undefined : runtime.getCurrentState();
      if (state === undefined) return startup;
      if (state !== worker.state) {
        worker.random.setSeed(runtime.getFingerprint(state) ^ BigInt.asUintN(64, seed));
        worker.state = state;
      }
      return worker.random;
    },
    evaluateAtStartup: (evaluate) => {
      const wasStartup = phase.isStartup;
      phase.isStartup = true;
      try {
        return evaluate();
      } finally {
        phase.isStartup = wasStartup;
      }
    },
    pause: () => {},
    warn: () => {},
    isWarningEnabled: true,
    isTool: false,
    version: "master",
    seed,
    generatedStates: 0,
    distinctStates: 0,
    initialStates: 0,
    queueSize: 0,
    diameter: 1,
    registers: new Map(),
    namedRegisters: new Map(),
    properties: new Map(),
    possibleCounts: new Map(),
    isStopped: false,
    isStarted: false,
    checkDeadlock,
    startedAt: Date.now(),
  };
  return runtime;
};

export const NAMED_REGISTER_PREFIX = "s:";

const POSSIBLE_REGISTER = "s:_possible";

export const getPossibleCounts = (runtime: CheckerRuntime) =>
  createFunction([...runtime.possibleCounts].map(([name, count]): [Value, Value] => [name, count]));

export const getNamedRegisters = (runtime: CheckerRuntime): Map<string, Value> =>
  runtime.possibleCounts.size === 0
    ? runtime.namedRegisters
    : new Map([...runtime.namedRegisters, [POSSIBLE_REGISTER, getPossibleCounts(runtime)]]);
