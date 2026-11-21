import { getTlcFingerprint } from "./tlc/fingerprint";
import { createJavaRandom, type JavaRandom } from "./tlc/random";
import { createFunction, createRecord, type Value } from "./values";
import type { EvalControl } from "./evaluate";
import type { SpecAction } from "./spec-description";
import type { TlcVersion } from "./tlc/version";

export interface CheckerRuntime {
  getLevel: (state: (Value | undefined)[]) => number;
  getBehavior: (state: Value[]) => Value[][];
  getSpecification: () => Value;
  counterExample: Value | undefined;
  deferred: ((next: Value[]) => void) | undefined;
  setLivenessSource: (index: number | undefined) => void;
  getCurrentState: () => Value[] | undefined;
  getFingerprint: (state: Value[]) => bigint;
  getRandom: () => JavaRandom;
  reseedRandom: () => void;
  runWithNewRandom: <Result>(evaluate: () => Result) => Result;
  runWithCurrentState: <Result>(state: Value[] | undefined, evaluate: () => Result) => Result;
  runWithEvalControl: <Result>(control: EvalControl, evaluate: () => Result) => Result;
  getSimulationValue:
    | ((key: string, state: (Value | undefined)[] | undefined) => Value | undefined)
    | undefined;
  evaluateAtStartup: <Result>(evaluate: () => Result) => Result;
  pause: (() => void) | undefined;
  readLine: (() => string | undefined) | undefined;
  printPrompt: (text: string, code?: number) => void;
  warn: (code: number, text: string) => void;
  isWarningEnabled: boolean;
  isTool: boolean;
  hasUserFile: boolean;
  version: TlcVersion;
  seed: bigint;
  isSeen: (state: Value[]) => boolean;
  markExplored: ((state: Value[]) => void) | undefined;
  getSuccessorAction: (state: Value[], next: Value[]) => SpecAction | undefined;
  toRecord: (state: Value[]) => Record<string, Value>;
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
  evalControl: EvalControl;
}

export const createRuntime = (checkDeadlock: boolean, seed = 0n): CheckerRuntime => {
  const startupRandom = createJavaRandom(seed);
  let workerRandom = createJavaRandom(seed);
  let seededState: Value[] | undefined;
  let isStartup = false;
  let isWorkerStateSet = false;
  let workerState: Value[] | undefined;
  const runtime: CheckerRuntime = {
    getLevel: () => 0,
    getBehavior: () => [],
    getSpecification: () => createRecord([]),
    counterExample: undefined,
    deferred: undefined,
    isSeen: () => false,
    markExplored: undefined,
    getSuccessorAction: () => undefined,
    toRecord: () => ({}),
    setLivenessSource: () => {},
    getCurrentState: () => undefined,
    getFingerprint: getTlcFingerprint,
    getSimulationValue: undefined,
    getRandom: () => {
      if (isStartup) return startupRandom;
      const state = isWorkerStateSet ? workerState : runtime.getCurrentState();
      // A worker without a current state, as AbstractChecker#setErrState leaves it, draws on from its random unseeded.
      if (state === undefined) return isWorkerStateSet ? workerRandom : startupRandom;
      if (state !== seededState) {
        workerRandom.setSeed(runtime.getFingerprint(state) ^ BigInt.asUintN(64, seed));
        seededState = state;
      }
      return workerRandom;
    },
    reseedRandom: () => {
      seededState = undefined;
    },
    runWithNewRandom: (evaluate) => {
      const random = workerRandom;
      const state = seededState;
      workerRandom = createJavaRandom(seed);
      seededState = undefined;
      try {
        return evaluate();
      } finally {
        workerRandom = random;
        seededState = state;
      }
    },
    runWithCurrentState: (state, evaluate) => {
      const wasWorkerStateSet = isWorkerStateSet;
      const previous = workerState;
      isWorkerStateSet = true;
      workerState = state;
      try {
        return evaluate();
      } finally {
        isWorkerStateSet = wasWorkerStateSet;
        workerState = previous;
      }
    },
    runWithEvalControl: (control, evaluate) => {
      const outer = runtime.evalControl;
      runtime.evalControl = control;
      try {
        return evaluate();
      } finally {
        runtime.evalControl = outer;
      }
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
    pause: undefined,
    readLine: undefined,
    printPrompt: () => {},
    warn: () => {},
    isWarningEnabled: true,
    isTool: false,
    hasUserFile: false,
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
    evalControl: "Clear",
  };
  return runtime;
};

export const EMPTY_STATE: (Value | undefined)[] = [];

export const NAMED_REGISTER_PREFIX = "s:";

const POSSIBLE_REGISTER = "s:_possible";

export const getPossibleCounts = (runtime: CheckerRuntime) =>
  createFunction([...runtime.possibleCounts].map((entry): [Value, Value] => [entry[0], entry[1]]));

export const getNamedRegisters = (runtime: CheckerRuntime): Map<string, Value> =>
  runtime.possibleCounts.size === 0
    ? runtime.namedRegisters
    : new Map([...runtime.namedRegisters, [POSSIBLE_REGISTER, getPossibleCounts(runtime)]]);
