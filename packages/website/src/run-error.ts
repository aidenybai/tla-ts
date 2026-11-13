import type { RunResult } from "./run-worker";

export const getErrorResult = (message: string): RunResult => ({
  isPassed: false,
  title: message,
  activeLine: undefined,
  notes: [],
});
