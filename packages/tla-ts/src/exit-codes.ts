import type { LivenessChecker } from "./liveness-checker";

export const EXIT_STATUS = {
  success: 0,
  assumptionViolation: 10,
  deadlock: 11,
  safetyViolation: 12,
  livenessViolation: 13,
  assertViolation: 14,
  specEvaluationFailure: 75,
  safetyEvaluationFailure: 76,
  livenessEvaluationFailure: 77,
  specParseError: 150,
  configParseError: 151,
  error: 255,
} as const;

// Node's exit status for a module whose top-level await never settles, and the start of the warning
// it prints.
export const UNSETTLED_AWAIT_EXIT_CODE = 13;
export const UNSETTLED_AWAIT_WARNING = "Detected unsettled top-level await at ";
// Node's exit status for a script that throws or rejects with what nothing handles.
export const UNCAUGHT_EXCEPTION_EXIT_CODE = 1;
// Where Node says that an ES module threw, and that a promise rejected with what nothing handles,
// both in its own code, and what it prints after a primitive that nothing catches.
export const MODULE_UNCAUGHT_LOCATION =
  "node:internal/modules/run_main:107\n    triggerUncaughtException(\n    ^";
export const UNHANDLED_REJECTION_LOCATION =
  "node:internal/process/promises:392\n      new UnhandledPromiseRejection(reason);\n      ^";
export const UNHANDLED_REJECTION_PREFIX =
  "UnhandledPromiseRejection: This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason ";
export const UNHANDLED_REJECTION_SUFFIX = ". {\n  code: 'ERR_UNHANDLED_REJECTION'\n}";
export const TRACE_UNCAUGHT_HINT =
  "(Use `node --trace-uncaught ...` to show where the exception was thrown)";

const MESSAGE_EXIT_STATUSES = new Map<number, number>([
  ...[
    ...Array.from({ length: 24 }, (_, index) => 2222 + index),
    2272,
    2273,
    2274,
    2280,
    2281,
    ...Array.from({ length: 7 }, (_, index) => 5001 + index),
  ].map((code): [number, number] => [code, EXIT_STATUS.configParseError]),
  [2253, EXIT_STATUS.livenessEvaluationFailure],
  [2109, EXIT_STATUS.specEvaluationFailure],
  [2115, EXIT_STATUS.specEvaluationFailure],
  [2103, EXIT_STATUS.specEvaluationFailure],
  [2147, EXIT_STATUS.specEvaluationFailure],
  [2111, EXIT_STATUS.safetyEvaluationFailure],
  [2146, EXIT_STATUS.safetyEvaluationFailure],
  [2107, EXIT_STATUS.safetyViolation],
  [2110, EXIT_STATUS.safetyViolation],
  [2112, EXIT_STATUS.livenessViolation],
  [2113, EXIT_STATUS.livenessViolation],
  [2116, EXIT_STATUS.livenessViolation],
  [2108, EXIT_STATUS.livenessViolation],
  [2114, EXIT_STATUS.deadlock],
  [2104, EXIT_STATUS.assumptionViolation],
  [2105, EXIT_STATUS.assumptionViolation],
  [2404, EXIT_STATUS.assumptionViolation],
  [2405, EXIT_STATUS.assumptionViolation],
  [2780, EXIT_STATUS.assumptionViolation],
  [2132, EXIT_STATUS.assertViolation],
  [2171, EXIT_STATUS.specParseError],
  [3002, EXIT_STATUS.specParseError],
]);

export const getMessageExitStatus = (code: number) =>
  MESSAGE_EXIT_STATUSES.get(code) ?? EXIT_STATUS.error;

const exitCodes = new WeakMap<Error, number>();

export const setExitCode = <Thrown>(error: Thrown, code: number) => {
  if (error instanceof Error && !exitCodes.has(error)) exitCodes.set(error, code);
  return error;
};

export const getExitCode = (error: Error) => exitCodes.get(error);

const withErrorExitCode = <Result>(run: () => Result) => {
  try {
    return run();
  } catch (error) {
    throw setExitCode(error, EXIT_STATUS.error);
  }
};

export const withLivenessExitCode = (
  create: () => LivenessChecker | undefined,
): LivenessChecker | undefined => {
  const checker = withErrorExitCode(create);
  return (
    checker && {
      branches: checker.branches,
      solutions: checker.solutions,
      addInitialState: (index, state, tracing) =>
        withErrorExitCode(() => checker.addInitialState(index, state, tracing)),
      addState: (index, state, successors, tracing) =>
        withErrorExitCode(() => checker.addState(index, state, successors, tracing)),
      findViolation: () => withErrorExitCode(() => checker.findViolation()),
      getViolatedProperties: (path, cycleStart) =>
        withErrorExitCode(() => checker.getViolatedProperties(path, cycleStart)),
    }
  );
};
