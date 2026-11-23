import runs from "../../../tla-ts/tests/conformance/test262-runs.json";

interface Test262Run {
  passed: number;
  total: number;
}

export const TEST262_RUNS = runs.map((run) => ({
  ...run,
  label: new Date(run.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }),
}));

export const getTest262Share = (run: Test262Run): number => run.passed / run.total;

export const getTest262Percent = (run: Test262Run): string =>
  `${(getTest262Share(run) * 100).toFixed(2)}%`;
