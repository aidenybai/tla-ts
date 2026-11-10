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
