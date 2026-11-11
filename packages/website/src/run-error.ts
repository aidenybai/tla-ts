import type { RunResult } from "./run-worker";

export const getErrorResult = (title: string, message: string, summary = ""): RunResult => ({
  isPassed: false,
  title,
  stats: undefined,
  name: undefined,
  summary,
  trace: [],
  loopStart: undefined,
  rows: [{ title: message, detail: "", isFailed: true }],
});
