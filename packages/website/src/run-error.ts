import type { RunResult } from "./run-worker";

export const getErrorResult = (message: string): RunResult => ({
  isPassed: false,
  title: message,
  rule: undefined,
  stateCount: 0,
  activeLine: undefined,
  notes: [],
});
