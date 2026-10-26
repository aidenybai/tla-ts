import type { Value } from "./values";

export interface CheckerRuntime {
  levels: WeakMap<readonly (Value | undefined)[], number>;
  generatedStates: number;
  distinctStates: number;
  initialStates: number;
  queueSize: number;
  diameter: number;
  registers: Map<number, Value>;
  namedRegisters: Map<string, Value>;
  properties: Map<string, string>;
  isStopped: boolean;
  checkDeadlock: boolean;
  startedAt: number;
}

export const createRuntime = (checkDeadlock: boolean): CheckerRuntime => ({
  levels: new WeakMap(),
  generatedStates: 0,
  distinctStates: 0,
  initialStates: 0,
  queueSize: 0,
  diameter: 1,
  registers: new Map(),
  namedRegisters: new Map(),
  properties: new Map(),
  isStopped: false,
  checkDeadlock,
  startedAt: Date.now(),
});
