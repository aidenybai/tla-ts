import type { RunResult } from "./run-worker";

export const getErrorResult = (title: string, message: string, summary = ""): RunResult => ({
  isPassed: false,
  title,
  name: undefined,
  summary,
  trace: [],
  loopStart: undefined,
  rows: [{ id: 0, title: message, detail: "", isFailed: true }],
});
