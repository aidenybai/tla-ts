import { getTlcFingerprint } from "./tlc/fingerprint";
import { createJavaRandom, type JavaRandom } from "./tlc/random";
import { createFunction, createRecord, type Value } from "./values";
import type { TlcVersion } from "./tlc/version";

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
  warn: (code: number, text: string) => void;
  isWarningEnabled: boolean;
  isTool: boolean;
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

export const createRuntime = (checkDeadlock: boolean, seed = 0n): CheckerRuntime => {
  const startupRandom = createJavaRandom(seed);
  const workerRandom = createJavaRandom(seed);
  let seededState: Value[] | undefined;
  let isStartup = false;
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
      const state = isStartup ? undefined : runtime.getCurrentState();
      if (state === undefined) return startupRandom;
      if (state !== seededState) {
        workerRandom.setSeed(runtime.getFingerprint(state) ^ BigInt.asUintN(64, seed));
        seededState = state;
      }
      return workerRandom;
    },
    evaluateAtStartup: (evaluate) => {
      const wasStartup = isStartup;
      isStartup = true;
      try {
        return evaluate();
      } finally {
        isStartup = wasStartup;
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
