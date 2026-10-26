import { createFunction, type Value } from "./values";

export interface CheckerRuntime {
  levels: WeakMap<readonly (Value | undefined)[], number>;
  expandingLevel: number | undefined;
  getBehavior: (state: Value[]) => Value[][];
  random: () => number;
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
  checkDeadlock: boolean;
  startedAt: number;
}

const createRandom = (seed: number) => {
  const state = { value: seed >>> 0 };
  return () => {
    state.value = (state.value + 0x6d2b79f5) >>> 0;
    const mixed = Math.imul(state.value ^ (state.value >>> 15), state.value | 1);
    const shifted = mixed ^ (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61));
    return ((shifted ^ (shifted >>> 14)) >>> 0) / 4294967296;
  };
};

export const createRuntime = (checkDeadlock: boolean): CheckerRuntime => ({
  levels: new WeakMap(),
  expandingLevel: undefined,
  getBehavior: () => [],
  random: createRandom(0),
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
  checkDeadlock,
  startedAt: Date.now(),
});

export const NAMED_REGISTER_PREFIX = "s:";

export const POSSIBLE_REGISTER = "s:_possible";

export const getPossibleCounts = (runtime: CheckerRuntime) =>
  createFunction([...runtime.possibleCounts].map(([name, count]): [Value, Value] => [name, count]));

export const getNamedRegisters = (runtime: CheckerRuntime): Map<string, Value> =>
  runtime.possibleCounts.size === 0
    ? runtime.namedRegisters
    : new Map([...runtime.namedRegisters, [POSSIBLE_REGISTER, getPossibleCounts(runtime)]]);
